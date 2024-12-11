import {
  Address,
  BaseError,
  decodeAbiParameters,
  defineChain,
  encodeAbiParameters,
  getContract,
  Hex,
  PrivateKeyAccount,
  RawContractError,
  WalletClient,
} from 'viem'
import { simulateContract } from 'viem/actions'
import * as chains from 'viem/chains'

export const executeWriteToResolver = async (wallet: any, calldata: any, callbackData: any) => {
  try {
    // await client.
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
          callbackData.args = [...callbackData.args, resBytes, req]
          const callbackContract = getContract({
            client: wallet,
            ...callbackData,
          })
          const tx = await callbackContract.write[callbackData.functionName](callbackData.args)
          console.log('callback', tx)
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
        console.log(data?.errorName)
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
    console.log('ERRROROROOR', err)
    return new Promise(() => null)
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
  return await ccipRequest({
    body: {
      data: message.callData,
      signature: { message, domain, signature },
      sender: message.sender,
    },
    url,
  })
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
