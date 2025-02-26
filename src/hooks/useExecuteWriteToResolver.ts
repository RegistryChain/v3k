import { useCallback, useEffect, useState } from 'react'
import {
  Address,
  BaseError,
  decodeAbiParameters,
  defineChain,
  encodeAbiParameters,
  getContract,
  Hex,
  namehash,
  PrivateKeyAccount,
  RawContractError,
  WalletClient,
  zeroHash,
} from 'viem'
import { simulateContract } from 'viem/actions'
import * as chains from 'viem/chains'

import { normalise } from '@ensdomains/ensjs/utils'

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
    if (!existingRecord || JSON.stringify(existingRecord) === '{}') {
      return await importEntity({ filingID: '', name, registrar })
    }
    return existingRecord
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
    return importedRecord
  } catch (err) {
    console.log('importEntity err', err)
    return Promise.resolve(new Response(null, { status: 204 }))
  }
}

export async function getEntitiesList({
  registrar = 'public',
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
    return await res.json()
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

export function useRecordData({ domain = '' }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const nodeHash = namehash(normalise(domain))

  const fetchRecordData = useCallback(async () => {
    if (!domain) return

    setLoading(true)
    setError(null)

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

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)

      const existingRecord = await res.json()

      if (!existingRecord || JSON.stringify(existingRecord) === '{}') {
        const newRecord = await importEntity({ filingID: '', name, registrar })
        setData(newRecord)
      } else {
        setData(existingRecord)
      }
    } catch (err: any) {
      console.error('getRecordData error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [domain])

  useEffect(() => {
    if (domain) {
      fetchRecordData()
    }
  }, [domain])

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
