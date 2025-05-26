import { useCallback, useEffect, useState } from 'react'
import {
  Address,
  BaseError,
  decodeAbiParameters,
  decodeFunctionResult,
  defineChain,
  encodeAbiParameters,
  encodeFunctionData,
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
import l1abi from '../constants/l1abi.json'

export const executeWriteToResolver = async (wallet: any, calldata: any, callbackData: any) => {
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
  try {
    const tx = await callbackContract.write[callbackData.functionName]([
      ...callbackData.args,
      resBytes,
      req,
    ])
    return tx.hash
  } catch (err) {
    return zeroHash
  }
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

export async function getRecordData({ entityid = '', needsSchema = true }: any) {
  const nodehash = namehash(normalise(entityid))
  const registrar = entityid.split('.')[1]
  const name = entityid.split('.')[0]
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_RESOLVER_URL + `/direct/getRecord/nodehash=${nodehash}.json`,
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
    return {}
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
    return {}
  }
}

export async function getEntitiesList({
  registrar = 'ai',
  nameSubstring = '',
  sortType = '',
  sortDirection = '',
  page = 0,
  limit = 25,
  address = zeroAddress,
  params = {},
}: any) {
  try {
    let paramsQuery = ''
    if (params) {
      if (Object.keys(params)?.length > 0) {
        const fields = Object.keys(params)
        paramsQuery =
          '&' +
          fields
            .map((x) => {
              if (typeof params[x] === 'object') {
                return x + '=' + JSON.stringify(params[x])
              }

              return x + '=' + params[x]
            })
            .join('&')
      }
    }
    const res = await fetch(
      process.env.NEXT_PUBLIC_RESOLVER_URL +
        `/direct/getEntitiesList/registrar=${registrar}&page=${page}&nameSubstring=${nameSubstring}&address=${address}&sortField=${sortType}&sortDir=${sortDirection}&limit=${limit}${paramsQuery}.json`,
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
    return []
  }
}

export async function handleEmail({ email, address }: any) {
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_RESOLVER_URL +
        `/direct/handleEmail/email=${email}&address=${address}.json`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    const emailReq = await res.json()
    return emailReq.data.sucess
  } catch (err) {
    return false
  }
}

export async function handleFeedback({ comment, mood, email }: any) {
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_RESOLVER_URL +
        `/direct/handleFeedback/email=${email}&comment=${comment}&mood=${mood}.json`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    const feedbackReq = await res.json()
    return feedbackReq.data.sucess
  } catch (err) {
    return false
  }
}

export async function getTransactions({ nodehash = zeroHash, address }: any) {
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_RESOLVER_URL +
        `/direct/getTransactions/nodehash=${nodehash}&memberAddress=${address}.json`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    return (await res.json())?.data || []
  } catch (err) {
    return []
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
  domain.chainId += ''
  message.expirationTimestamp += ''
  try {
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
  } catch (err) {
    console.log('DB handler error', err)
  }
}

export async function readResolverData(resolverAddress: any, client: any, nodehash: any) {
  let results: any = {}
  try {
    const calls = displayKeys.map((key) =>
      encodeFunctionData({
        abi: parseAbi(['function text(bytes32,string) view returns (string)']),
        functionName: 'text',
        args: [nodehash, key],
      }),
    )

    const resolverContract: any = await getContract({
      client,
      abi: [
        ...l1abi,
        ...parseAbi(['function multicallView(bytes[] calldata) view returns (bytes calldata)']),
      ],
      address: resolverAddress as Address,
    })

    const multicallResponse = await resolverContract.read.multicallView([calls])

    const encodedTexts = decodeAbiParameters([{ type: 'bytes[]' }], multicallResponse)[0]

    const decodedResults: any[] = encodedTexts.map((result: any, index: number) => {
      try {
        return decodeAbiParameters([{ type: 'string' }], result)?.[0]
      } catch (error) {
        console.error(`Failed to decode text(${displayKeys[index]})`, error)
        return ''
      }
    })

    // Convert results into a key-value object
    results = displayKeys.reduce(
      (acc, key, index) => {
        acc[key] = decodedResults[index] || '' // Assign null if decoding failed
        return acc
      },
      {} as Record<string, string | null>,
    )
  } catch (err: any) {
    console.log('Error reading resolver data ', err.message)
  }

  //hardcodes or derived fields
  results.entityid = results.name + '.' + results?.registrar + '.entity.id'
  return results
}

export const getResolverAddress = async (client: any, domain: any) => {
  let resolverAddr = zeroAddress
  // Check resolver type
  const registry: any = await getContract({
    client,
    abi: [...parseAbi(['function resolver(bytes32) view returns (address)'])],
    address: contractAddresses.ENSRegistry as Address,
  })
  try {
    resolverAddr = await registry.read.resolver([namehash(domain)])
  } catch (err: any) {
    console.log('ERROR GETTING CURRENT RESOLVER ADDRESS: ', err.message)
  }

  if (resolverAddr === zeroAddress) {
    try {
      resolverAddr = await registry.read.resolver([namehash(domain.split('.').slice(1).join('.'))])
    } catch (err: any) {
      console.log('ERROR GETTING CURRENT PARENT RESOLVER ADDRESS: ', err.message)
    }
  }

  return resolverAddr
}

export function useRecordData({ entityid = '', wallet = null, publicClient = null }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resolverAddress, setResolverAddress] = useState('')
  const nodehash = namehash(normalise(entityid))

  const getRes = async () => {
    if (publicClient) {
      try {
        const res = await getResolverAddress(publicClient, normalise(entityid))
        if (isAddress(res) && res !== zeroAddress) {
          setResolverAddress(res)
          return
        }
      } catch (e) {}
    }
  }
  // useEffect(() => {
  //   if (publicClient && entityid) {
  //     getRes()
  //   }
  // }, [publicClient, entityid])

  const fetchRecordData = useCallback(async () => {
    if (!entityid) return

    setLoading(true)
    setError(null)

    const registrar = entityid.split('.')[1]
    const name = entityid.split('.')[0]

    try {
      if (resolverAddress?.toUpperCase() === contractAddresses.PublicResolver?.toUpperCase()) {
        const returnObj = await readResolverData(
          resolverAddress || zeroAddress,
          publicClient,
          nodehash,
        )

        setData(returnObj)
      } else {
        const res = await fetch(
          process.env.NEXT_PUBLIC_RESOLVER_URL + `/direct/getRecord/nodehash=${nodehash}.json`,
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
          getRes()
          // const newRecord = await importEntity({ filingID: '', name, registrar })
          // setData(newRecord)
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
  }, [entityid, resolverAddress])

  useEffect(() => {
    if (entityid && (wallet || publicClient)) {
      fetchRecordData()
    }
  }, [entityid, wallet, publicClient])

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
  'legalentity__lei',
  'name',
  'address',
  'description',
  'url',
  'location',
  'avatar',
  'registrar',
  'keywords',
  'birthdate',
  'arbitrator__name',
]

const partnerDisplayKeys = [
  'partner__[0]__name',
  'partner__[0]__type',
  'partner__[0]__walletaddress',
  'partner__[0]__location',
  'partner__[0]__birthdate',
  'partner__[0]__is__manager',
  'partner__[0]__is__signer',
  'partner__[0]__lockup',
  'partner__[0]__shares',
  'partner__[1]__name',
  'partner__[1]__type',
  'partner__[1]__walletaddress',
  'partner__[1]__location',
  'partner__[1]__birthdate',
  'partner__[1]__is__manager',
  'partner__[1]__is__signer',
  'partner__[1]__lockup',
  'partner__[1]__shares',
  'partner__[2]__name',
  'partner__[2]__type',
  'partner__[2]__walletaddress',
  'partner__[2]__location',
  'partner__[2]__birthdate',
  'partner__[2]__is__manager',
  'partner__[2]__is__signer',
  'partner__[2]__lockup',
  'partner__[2]__shares',
  'partner__[3]__name',
  'partner__[3]__type',
  'partner__[3]__walletaddress',
  'partner__[3]__location',
  'partner__[3]__birthdate',
  'partner__[3]__is__manager',
  'partner__[3]__is__signer',
  'partner__[3]__lockup',
  'partner__[3]__shares',
  'partner__[4]__name',
  'partner__[4]__type',
  'partner__[4]__walletaddress',
  'partner__[4]__location',
  'partner__[4]__birthdate',
  'partner__[4]__is__manager',
  'partner__[4]__is__signer',
  'partner__[4]__lockup',
  'partner__[4]__shares',
  'partner__[5]__name',
  'partner__[5]__type',
  'partner__[5]__walletaddress',
  'partner__[5]__location',
  'partner__[5]__birthdate',
  'partner__[5]__is__manager',
  'partner__[5]__is__signer',
  'partner__[5]__lockup',
  'partner__[5]__shares',
]
