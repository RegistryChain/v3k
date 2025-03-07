import { useCallback, useEffect, useState } from 'react'
import {
  Address,
  BaseError,
  decodeAbiParameters,
  defineChain,
  encodeAbiParameters,
  getContract,
  Hex,
  isAddress,
  namehash,
  parseAbi,
  PrivateKeyAccount,
  RawContractError,
  WalletClient,
  zeroAddress,
  zeroHash,
} from 'viem'
import { simulateContract } from 'viem/actions'
import * as chains from 'viem/chains'

import { normalise } from '@ensdomains/ensjs/utils'

import contractAddresses from '../constants/contractAddresses.json'

export const executeWriteToResolver = async (wallet: any, calldata: any, callbackData: any) => {
  // IMPORTANT: Change made to gateway witout test. Should be handling POST with :{sender}/:{calldata}.json with server/this.handleRequest
  try {
    await simulateContract(wallet, calldata)
  } catch (err) {
    const data = getRevertErrorData(err)
    switch (data?.errorName) {
      case 'StorageHandledByOffChainDatabase': {
        const [domain, url, message] = data.args as any[]
        let urlToUse: string = url
        if (process.env.NEXT_PUBLIC_RESOLVER_URL) {
          urlToUse = process.env.NEXT_PUBLIC_RESOLVER_URL
        }
        const res: any = await handleDBStorage({
          domain,
          url: urlToUse,
          message,
          wallet,
        })
        if (res.status === 200) {
          const resBytes = await res.text()

          if (!callbackData) return resBytes
          return await resolverCallback(wallet, message, resBytes, callbackData)
        }
        return '0x'
      }
      default:
        console.error('error registering domain: ', { err })
    }
  }
}

export async function resolverCallback(
  wallet: any,
  message: any,
  resBytes: any,
  callbackData: any,
) {
  const req = encodeAbiParameters(
    [{ type: 'bytes' }, { type: 'address' }],
    [message.callData, wallet.account.address],
  )
  const callbackContract: any = getContract({
    client: wallet,
    args: [...callbackData.args, resBytes, req],
    ...callbackData,
  })
  const tx = await callbackContract.write[callbackData.functionName]([
    ...callbackData.args,
    resBytes,
    req,
  ])
  return tx.hash
}

export function getRevertErrorData(err: unknown) {
  if (!(err instanceof BaseError)) return undefined
  const error = err.walk() as RawContractError
  return error?.data as { errorName: string; args: unknown[] }
}

export type CcipRequestParameters = {
  body: { data: Hex; signature: any; sender: Address }
  url: string
}

export async function getRecordData({ domain = '', needsSchema = true }: any) {
  const nodeHash = namehash(normalise(domain))
  const registrar = domain.split('.')[1]
  const name = domain.split('.')[0]
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_RESOLVER_URL + `/direct/getRecord/nodeHash=${nodeHash}.json`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    const existingRecord = await res.json()
    if (!existingRecord.data || (JSON.stringify(existingRecord.data) === '{}' && needsSchema)) {
      return await importEntity({ filingID: '', name, registrar })
    }
    return existingRecord.data
  } catch (err) {
    console.log('getRecordData err', err)
    return Promise.resolve(new Response(null, { status: 204 }))
  }
}

export async function importEntity({ filingID, name, registrar }: any) {
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_RESOLVER_URL +
        `/direct/handleImportEntity/filingID=${filingID}&name=${
          name.split('.')[0]
        }&registrar=${registrar}.json`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    const importedRecord = await res.json()
    return importedRecord.data
  } catch (err) {
    console.log('importEntity err', err)
    return Promise.resolve(new Response(null, { status: 204 }))
  }
}

export async function getEntitiesList({
  registrar = 'ai',
  nameSubstring = '',
  sortType,
  sortDirection,
  page = 0,
  limit = 25,
  params = {},
}: any) {
  try {
    let paramsQuery = ''
    if (params) {
      if (Object.keys(params)?.length > 0) {
        const fields = Object.keys(params)
        paramsQuery = '&' + fields.map((x) => x + '=' + params[x]).join('&')
      }
    }
    const res = await fetch(
      process.env.NEXT_PUBLIC_RESOLVER_URL +
        `/direct/getEntitiesList/registrar=${registrar}&page=${page}&nameSubstring=${nameSubstring}&sortField=${sortType}&sortDir=${sortDirection}&limit=${limit}${paramsQuery}.json`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    const entitiesList = await res.json()
    return entitiesList.data
  } catch (err) {
    throw new Error('Failed to fetch entities list')
  }
}

export async function getTransactions({ nodeHash = zeroHash, address }: any) {
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_RESOLVER_URL +
        `/direct/getTransactions/nodeHash=${nodeHash}&memberAddress=${address}.json`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    return await res.json()
  } catch (err) {
    return Promise.resolve(new Response(null, { status: 204 }))
  }
}

export async function ccipRequest({ body, url }: CcipRequestParameters): Promise<Response> {
  try {
    const res = await fetch(url.replace('/{sender}/{data}.json', ''), {
      body: JSON.stringify(body, (_, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    return res
  } catch (err) {
    return Promise.resolve(new Response(null, { status: 204 }))
  }
}

export async function handleDBStorage({
  domain,
  url,
  message,
  wallet,
}: {
  domain: any
  url: string
  message: any
  wallet: WalletClient
}) {
  const signature = await wallet.signTypedData({
    account: wallet.account?.address as any,
    domain,
    message,
    types: {
      Message: [
        { name: 'callData', type: 'bytes' },
        { name: 'sender', type: 'address' },
        { name: 'expirationTimestamp', type: 'uint256' },
      ],
    },
    primaryType: 'Message',
  })
  const requestResponse = await ccipRequest({
    body: {
      data: message.callData,
      signature: { message, domain, signature },
      sender: message.sender,
    },
    url,
  })
  return requestResponse
}

export async function readResolverData(client: any, nodeHash: any) {
  let results = []
  try {
    results = await client.multicall({
      contracts: displayKeys.map((x) => ({
        address: contractAddresses.PublicResolver,
        abi: [
          ...parseAbi([
            'function multicall(bytes[] memory data) view returns (bytes[] memory)',
            'function text(bytes32,string memory) view returns (string memory)',
          ]),
        ],
        functionName: 'text',
        args: [nodeHash, x],
      })) as any[],
    })
    results.domain = results.name + '.' + results?.entity__registrar + '.entity.id'
  } catch (err: any) {
    console.log('Error reading on chain resolver data ', err.message)
  }

  let resultsObj: any = {}
  if (results) {
    results.map((x: any) => {
      return x?.result || ''
    })
  } else {
    displayKeys.map((x: any, idx: any) => {
      resultsObj[displayKeys[idx]] = x?.result || ''
    })
  }

  return resultsObj
}

export const getResolverAddress = async (client: any, nodeHash: any) => {
  let resolverAddr = zeroAddress
  // Check resolver type
  try {
    const registry: any = await getContract({
      client,
      abi: [...parseAbi(['function resolver(bytes32) view returns (address)'])],
      address: contractAddresses.ENSRegistry as Address,
    })

    resolverAddr = await registry.read.resolver([nodeHash])
  } catch (err) {}
  return resolverAddr
  // if (resolverAddr === contractAddresses.DatabaseResolver) {
  //   return await getRecordData({ domain })
  // }
}

export function useRecordData({
  domain = '',
  wallet = null,
  publicClient = null,
  needsSchema = true,
}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resolverAddress, setResolverAddress] = useState('')
  const nodeHash = namehash(normalise(domain))

  const getRes = async () => {
    if (wallet) {
      const res = await getResolverAddress(wallet, nodeHash)
      if (isAddress(res)) {
        setResolverAddress(res)
      }
    }
  }
  useEffect(() => {
    if (wallet && domain) {
      getRes()
    }
  }, [wallet, domain])

  const fetchRecordData = useCallback(async () => {
    if (!domain) return

    setLoading(true)
    setError(null)

    const registrar = domain.split('.')[1]
    const name = domain.split('.')[0]

    try {
      if (resolverAddress?.toUpperCase() === contractAddresses.PublicResolver?.toUpperCase()) {
        const returnObj = await readResolverData(publicClient, nodeHash)

        setData(returnObj)
      } else {
        const res = await fetch(
          process.env.NEXT_PUBLIC_RESOLVER_URL + `/direct/getRecord/nodeHash=${nodeHash}.json`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )

        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)

        const existingRecord = await res.json()
        if (existingRecord?.data) {
          const formatted = existingRecord?.data
          setData(formatted)
        } else if (!existingRecord?.data || JSON.stringify(existingRecord?.data) === '{}') {
          const newRecord = await importEntity({ filingID: '', name, registrar })
          setData(newRecord)
        } else {
          setData(null)
        }
      }
    } catch (err: any) {
      console.error('getRecordData error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [domain, resolverAddress])

  useEffect(() => {
    if (domain && wallet && resolverAddress) {
      fetchRecordData()
    }
  }, [domain, wallet, resolverAddress])

  return { data, loading, error, refetch: fetchRecordData }
}

export function getChain(chainId: number): chains.Chain | undefined {
  return [
    ...Object.values(chains),
    defineChain({
      id: Number(chainId),
      name: 'Arbitrum Local',
      nativeCurrency: {
        name: 'Arbitrum Sepolia Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ['http://127.0.0.1:8547'],
        },
      },
    }),
  ].find((chain) => chain.id === chainId)
}

// gather the first part of the domain (e.g. floripa.blockful.eth -> floripa)
export function extractLabelFromName(name: string): string {
  const [, label] = /^(\w+)/.exec(name) || []
  return label
}

// gather the last part of the domain (e.g. floripa.blockful.eth -> blockful.eth)
export function extractParentFromName(name: string): string {
  const [, parent] = /\w*\.(.*)$/.exec(name) || []
  return parent
}

export const displayKeys = [
  'LEI',
  'name',
  'address',
  'description',
  'url',
  'location',
  'avatar',
  'entity__name',
  'entity__address',
  'entity__registrar',
  'entity__type',
  'entity__description',
  'entity__purpose',
  'entity__formation__date',
  'entity__lockup__days',
  'entity__additional__terms',
  'entity__selected__model',
  'entity__lookup__number',
  'entity__code',
  'entity__arbitrator',
  'partner__[0]__name',
  'partner__[0]__type',
  'partner__[0]__wallet__address',
  'partner__[0]__physical__address',
  'partner__[0]__DOB',
  'partner__[0]__is__manager',
  'partner__[0]__is__signer',
  'partner__[0]__lockup',
  'partner__[0]__shares',
  'partner__[1]__name',
  'partner__[1]__type',
  'partner__[1]__wallet__address',
  'partner__[1]__physical__address',
  'partner__[1]__DOB',
  'partner__[1]__is__manager',
  'partner__[1]__is__signer',
  'partner__[1]__lockup',
  'partner__[1]__shares',
  'partner__[2]__name',
  'partner__[2]__type',
  'partner__[2]__wallet__address',
  'partner__[2]__physical__address',
  'partner__[2]__DOB',
  'partner__[2]__is__manager',
  'partner__[2]__is__signer',
  'partner__[2]__lockup',
  'partner__[2]__shares',
  'partner__[3]__name',
  'partner__[3]__type',
  'partner__[3]__wallet__address',
  'partner__[3]__physical__address',
  'partner__[3]__DOB',
  'partner__[3]__is__manager',
  'partner__[3]__is__signer',
  'partner__[3]__lockup',
  'partner__[3]__shares',
  'partner__[4]__name',
  'partner__[4]__type',
  'partner__[4]__wallet__address',
  'partner__[4]__physical__address',
  'partner__[4]__DOB',
  'partner__[4]__is__manager',
  'partner__[4]__is__signer',
  'partner__[4]__lockup',
  'partner__[4]__shares',
  'partner__[5]__name',
  'partner__[5]__type',
  'partner__[5]__wallet__address',
  'partner__[5]__physical__address',
  'partner__[5]__DOB',
  'partner__[5]__is__manager',
  'partner__[5]__is__signer',
  'partner__[5]__lockup',
  'partner__[5]__shares',
]
