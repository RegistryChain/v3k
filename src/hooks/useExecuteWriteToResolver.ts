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
        const res: any = await handleDBStorage({
          domain,
          url,
          message,
          wallet,
        })
        if (res.status === 200) {
          const resBytes = await res.text()
          const dec = decodeAbiParameters(
            [{ type: 'bytes' }, { type: 'uint64' }, { type: 'bytes' }],
            resBytes,
          )
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

          // const multisigAddr = await checkOwner(decodedData[1])
          // console.log('MULTISIG', multisigAddr)

          // await initializeFirstUser(multisigAddr)

          // DIFFERENCES WHEN MULTICALL
          // Multicall calldata is equal
          // The decode probably wont work in execute transaction, as it is expecting to decode (b32, b32), not [(b32, b32), (b32, b32)]
          // The value passed to the function must be equal to the one signed over in gateway
        }
        return '0x'
      }
      default:
        console.error('error registering domain: ', { err })
    }
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

export async function getRecordData({ domain = '', needsSchema = true }: any) {
  const nodeHash = namehash(normalise(domain))
  const registrar = domain.split('.')[1]
  const name = domain.split('.')[0]
  try {
    const res = await fetch(
      `https://oyster-app-mn4sb.ondigitalocean.app/direct/getRecord/nodeHash=${nodeHash}.json`,
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
      `https://oyster-app-mn4sb.ondigitalocean.app/direct/handleImportEntity/filingID=${filingID}&name=${
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
}: any) {
  try {
    const res = await fetch(
      `https://oyster-app-mn4sb.ondigitalocean.app/direct/getEntitiesList/registrar=${registrar}&page=${page}&nameSubstring=${nameSubstring}&sortField=${sortType}&sortDir=${sortDirection}.json`,
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
      `https://oyster-app-mn4sb.ondigitalocean.app/direct/getTransactions/nodeHash=${nodeHash}&memberAddress=${address}.json`,
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
  //http://localhost:2000/{sender}/{data}.json
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
