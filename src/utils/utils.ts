import { ConnectedWallet } from '@privy-io/react-auth'
import { PinataSDK } from 'pinata'
import type { TFunction } from 'react-i18next'
import {
  createPublicClient,
  createWalletClient,
  custom,
  encodeAbiParameters,
  encodePacked,
  getContract,
  http,
  keccak256,
  toBytes,
  type Address,
} from 'viem'
import { sepolia } from 'viem/chains'

import { Eth2ldName } from '@ensdomains/ensjs/dist/types/types'
import { GetPriceReturnType } from '@ensdomains/ensjs/public'
import { DecodedFuses } from '@ensdomains/ensjs/utils'

import { infuraUrl } from '@app/utils/query/wagmi'

import { contracts as contractsBytecode } from '../constants/bytecode'
import contractAddresses from '../constants/contractAddresses.json'
import l1abi from '../constants/l1abi.json'
import { CURRENCY_FLUCTUATION_BUFFER_PERCENTAGE } from './constants'
import { ONE_DAY, ONE_YEAR } from './time'

const contractAddressesObj: any = contractAddresses

export * from './time'

export const shortenAddress = (address = '', maxLength = 10, leftSlice = 5, rightSlice = 5) => {
  if (address.length < maxLength) {
    return address
  }

  return `${address.slice(0, leftSlice)}...${address.slice(-rightSlice)}`
}

export const deriveYearlyFee = ({
  duration,
  price,
}: {
  duration: number
  price: GetPriceReturnType
}) => {
  const yearlyFee = (price.base * BigInt(ONE_YEAR)) / BigInt(duration)
  return yearlyFee
}

export const formatExpiry = (expiry: Date) =>
  `${expiry.toLocaleDateString(undefined, {
    month: 'long',
  })} ${expiry.getDate()}, ${expiry.getFullYear()}`

export const formatDateTime = (date: Date) => {
  const baseFormatted = date.toLocaleTimeString('en', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    timeZoneName: 'short',
  })
  return `${baseFormatted}`
}

export const formatFullExpiry = (expiryDate?: Date) =>
  expiryDate ? `${formatExpiry(expiryDate)}, ${formatDateTime(expiryDate)}` : ''

export const formatDuration = (duration: number, t: TFunction) => {
  const month = ONE_DAY * 30 // Assuming 30 days per month for simplicity

  if (duration >= ONE_YEAR) {
    const years = Math.floor(duration / ONE_YEAR)
    const months = Math.floor((duration - years * ONE_YEAR) / month)

    if (months !== 0)
      return `${t('unit.years', { count: years, ns: 'common' })}, ${t('unit.months', {
        count: months,
        ns: 'common',
      })}`

    return t('unit.years', { count: years, ns: 'common' })
  }
  if (duration >= month) {
    const months = Math.floor(duration / month)

    const days = Math.floor((duration - months * month) / ONE_DAY)

    // for 31-day months
    if (days > 1)
      return `${t('unit.months', { count: months, ns: 'common' })}, ${t('unit.days', {
        count: days,
        ns: 'common',
      })}`

    return t('unit.months', { count: months, ns: 'common' })
  }
  if (duration >= ONE_DAY) {
    const days = Math.floor(duration / ONE_DAY)
    return t('unit.days', { count: days, ns: 'common' })
  }

  return t('unit.invalid_date', { ns: 'common' })
}

export const makeEtherscanLink = (data: string, network?: string, route: string = 'tx') =>
  `https://${!network || network === 'mainnet' ? '' : `${network}.`}etherscan.io/${route}/${data}`

export const isBrowser = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
)

export const checkDNSName = (name: string): boolean => {
  const labels = name?.split('.')

  return !!labels && labels[labels.length - 1] !== 'eth'
}

export const checkETH2LDFromName = (name: string): name is Eth2ldName => {
  const labels = name.split('.')
  if (labels.length !== 2) return false
  if (labels[1] !== 'eth') return false
  return true
}

export const checkDNS2LDFromName = (name?: string) => {
  const labels = name?.split('.')
  if (!labels) return false
  if (labels.length !== 2) return false
  if (labels[1] === 'eth') return false
  return true
}

export const checkSubname = (name: string) => name.split('.').length > 2

export const isLabelTooLong = (label: string) => {
  const bytes = toBytes(label)
  return bytes.byteLength > 255
}

export const getTestId = (props: any, fallback: string): string => {
  return props['data-testid'] ? String(props['data-testid']) : fallback
}

export const deleteProperty = <T extends Record<string, any>, K extends keyof T>(
  key: K,
  { [key]: _, ...newObj }: T,
): Omit<T, K> => newObj

export const deleteProperties = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> => {
  const newObj = { ...obj }
  for (const key of keys) {
    delete newObj[key]
  }
  return newObj
}

export const getLabelFromName = (name: string = '') => name.split('.')[0]

export const validateExpiry = ({
  name,
  fuses,
  expiry,
  pccExpired = false,
}: {
  name: string
  fuses: DecodedFuses | undefined | null
  expiry: Date | undefined
  pccExpired?: boolean
}) => {
  const isDotETH = checkETH2LDFromName(name)
  if (isDotETH) return expiry
  if (!fuses) return undefined
  return pccExpired || fuses.parent.PARENT_CANNOT_CONTROL ? expiry : undefined
}

export const getResolverWrapperAwareness = ({
  chainId,
  resolverAddress,
}: {
  chainId: number
  resolverAddress?: Address
}) => !!resolverAddress

export const calculateValueWithBuffer = (value: bigint) =>
  (value * CURRENCY_FLUCTUATION_BUFFER_PERCENTAGE) / 100n

const encodedLabelRegex = /\[[a-fA-F0-9]{64}\]/g
export const getEncodedLabelAmount = (name: string) => name.match(encodedLabelRegex)?.length || 0

export const createDateAndValue = <TValue extends bigint | number>(value: TValue) => ({
  date: new Date(Number(value)),
  value,
})

export const normalizeLabel = (label: string) => {
  if (!label) return ''
  let labelLower = label.toLowerCase()
  return labelLower
    .replace(/[()#@%!*?:"'+,.&\/]/g, '') // Remove unwanted characters
    .replace(/ /g, '-') // Replace spaces with hyphens
    .replace(/-{2,}/g, '-')
    .replace(/[^a-zA-Z0-9\s-.]/g, '')
}

export const generateSafeSalt = (labelHash: any, registrar: any) => {
  // Use encodeAbiParameters to match Solidity's abi.encode behavior
  const encodedData = encodeAbiParameters(
    [
      { type: 'bytes32', name: 'labelHash' },
      { type: 'address', name: 'registrar' },
    ],
    [labelHash, registrar],
  )

  // Hash the encoded data
  return keccak256(encodedData)
}

// Function to compute the contract address
export const generateSafeAddress = (claimingUser: any, labelHash: any, registrar: any) => {
  // Step 1: Compute the creation bytecode with constructor args
  const encodedAddress = encodeAbiParameters(
    [{ type: 'address', name: 'approvedEntityClaimer' }],
    [claimingUser],
  )

  // Concatenate the bytecode and the encoded address
  const bytecode = encodePacked(
    ['bytes', 'bytes'],
    [contractsBytecode.claimableTreasury, encodedAddress],
  )

  // Step 2: Compute the salt
  const salt = keccak256(
    encodeAbiParameters(
      [{ type: 'bytes32' }, { type: 'address' }],
      [generateSafeSalt(labelHash, registrar), claimingUser],
    ),
  )

  // Step 3: Compute the final contract address using CREATE2 formula
  const hash = keccak256(
    encodePacked(
      ['bytes1', 'address', 'bytes32', 'bytes32'],
      ['0xff', contractAddressesObj.ClaimableTreasuryFactory, salt, keccak256(bytecode)],
    ),
  )

  return `0x${hash.slice(-40)}`
}

export const getPublicClient = () => {
  return createPublicClient({
    chain: sepolia,
    transport: http(infuraUrl('sepolia')),
  })
}

export async function getPrivyWalletClient(
  wallet: ConnectedWallet, // ← a wallet object from `useWallets()`
  chain = sepolia, //   or `mainnet`, etc.
) {
  // 1. Ask Privy for the wallet’s EIP-1193 provider
  const provider = await wallet.getEthereumProvider()

  // 2. Hand that provider to viem
  return createWalletClient({
    chain,
    transport: custom(provider, { retryCount: 0 }),
    account: wallet.address as Address,
  })
}

export const getWalletClient = (address: Address) => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return createWalletClient({
      chain: sepolia,
      transport: custom(window.ethereum, { retryCount: 0 }),
      account: address,
    })
  }
  throw new Error('Ethereum object not found on window')
}

export const getContractInstance = (
  wallet: any,
  contractName: keyof typeof contractAddressesObj,
) => {
  return getContract({
    address: contractAddressesObj[contractName] as Address,
    abi: l1abi,
    client: wallet,
  })
}

export function getDefaultValueByType(type: string) {
  const typeMap: any = {
    String: '',
    Number: 0,
    Boolean: false,
    Object: {},
    Array: [],
    Date: '', // Default to epoch (1970-01-01)
  }

  return typeMap[type] !== undefined ? typeMap[type] : null // Return `null` if the type is not mapped
}

export const pinata = new PinataSDK({
  pinataJwt: `${process.env.NEXT_PUBLIC_PINATA_JWT}`,
  pinataGateway: `${process.env.NEXT_PUBLIC_GATEWAY_URL}`,
})

export const getChangedRecords = (agentPrepopulate: any, formState: any, fieldMapping: any) => {
  const changedRecords: any[] = []
  const fieldsOfChangedRecords: any = {}

  Object.keys(formState).forEach((key) => {
    const prepopField = fieldMapping(key)
    if (formState[key] !== agentPrepopulate[prepopField] && typeof formState[key] === 'string') {
      changedRecords.push({ key: prepopField, value: formState[key] })
      fieldsOfChangedRecords[prepopField] = formState[key]
    }
  })
  return changedRecords
}

/*
  Following types are based on this solution: https://stackoverflow.com/questions/53173203/typescript-recursive-function-composition/53175538#53175538
  Best to just move on and not try to understand it. (This is copilot's opintion!)
*/
type Lookup<T, K extends keyof any, Else = never> = K extends keyof T ? T[K] : Else

type Tail<T extends any[]> = T extends [any, ...infer R] ? R : never

type Func1 = (arg: any) => any
type ArgType<F, Else = never> = F extends (arg: infer A) => any ? A : Else
type AsChain<F extends [Func1, ...Func1[]], G extends Func1[] = Tail<F>> = {
  [K in keyof F]: (arg: ArgType<F[K]>) => ArgType<Lookup<G, K, any>, any>
}

type Last<T extends any[]> = T extends [...any, infer L] ? L : never
type LaxReturnType<F> = F extends (...args: any) => infer R ? R : never

export const thread = <F extends [(arg: any) => any, ...Array<(arg: any) => any>]>(
  arg: ArgType<F[0]>,
  ...f: F & AsChain<F>
): LaxReturnType<Last<F>> => f.reduce((acc, fn) => fn(acc), arg) as LaxReturnType<Last<F>>
