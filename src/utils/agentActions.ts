// @ts-nocheck
import { encodeFunctionData, getContract, isAddressEqual, zeroAddress } from 'viem'
import { normalize } from 'viem/ens'

import { namehash } from '@ensdomains/ensjs/utils'

import { executeWriteToResolver, getResolverAddress } from '@app/hooks/useExecuteWriteToResolver'
import { generateSafeAddress, generateSafeSalt, normalizeLabel } from '@app/utils/utils'

import contractAddresses from '../constants/contractAddresses.json'
import l1abi from '../constants/l1abi.json'

export async function claimPregeneratedSafe({ address, client, wallet, label, tld }: any) {
  const labelHashToUse = normalizeLabel(label)
  const generatedSafe: any = generateSafeAddress(
    address,
    labelHashToUse,
    contractAddresses['ai.' + tld],
  )

  const bc = await client.getBytecode({ address: generatedSafe })
  if (bc && bc !== '0x') throw new Error('This safe has already been claimed')

  const deployerContract: any = getContract({
    abi: [
      {
        inputs: [{ internalType: 'bytes32', name: 'saltInput', type: 'bytes32' }],
        name: 'deployClaimableTreasury',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    address: contractAddresses.ClaimableTreasuryFactory,
    client: wallet,
  })

  return await deployerContract.write.deployClaimableTreasury([
    generateSafeSalt(labelHashToUse, contractAddresses['ai.' + tld]),
  ])
}

export async function withdrawFromSafe({
  generatedSafe,
  tokenAddress,
  balance,
  decimals,
  wallet,
}: any) {
  const tokenContract: any = getContract({
    abi: [
      {
        inputs: [
          { internalType: 'address', name: 'tokenAddress', type: 'address' },
          { internalType: 'uint256', name: 'value', type: 'uint256' },
        ],
        name: 'withdrawERC20',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    address: generatedSafe,
    client: wallet,
  })

  return await tokenContract.write.withdrawERC20([tokenAddress, balance * 10 ** decimals])
}

export async function deploySafeMultisig({
  address,
  name,
  owner,
  onChainOwner,
  client,
  wallet,
  setErrorMessage,
  refresh,
}: any) {
  try {
    if (owner !== address) return

    if (onChainOwner === zeroAddress && owner === address) {
      const resolverAddress = await getResolverAddress(wallet, name)
      const calldata = {
        abi: l1abi,
        functionName: 'proveTextRecords',
        args: [namehash(name)],
        address: resolverAddress,
      }

      const callback = {
        ...calldata,
        functionName: 'bringRecordsOnchain',
        args: [contractAddresses['PublicResolver']],
        address: contractAddresses['ai.entity.id'],
      }

      await executeWriteToResolver(wallet, calldata, callback)
    }

    const saltNonce = BigInt(Date.now())
    const safeFactory: any = getContract({
      address: contractAddresses['SepoliaSafeFactory'] as any,
      abi: l1abi,
      client: wallet,
    })

    const initializerBytes = encodeFunctionData({
      abi: l1abi,
      functionName: 'setup',
      args: [
        [owner],
        BigInt(1),
        zeroAddress,
        '0x',
        contractAddresses['SepoliaFallbackHandler'],
        zeroAddress,
        BigInt(0),
        zeroAddress,
      ],
    })

    const txHash = await safeFactory.write.createProxyWithNonce([
      contractAddresses['SingletonAddress'],
      initializerBytes,
      saltNonce,
    ])

    const txReceipt = await client.waitForTransactionReceipt({ hash: txHash })
    const safeAddress = txReceipt.logs[0]?.address

    if (!safeAddress || safeAddress === zeroAddress) {
      setErrorMessage('No safe address detected')
      return
    }

    const registry: any = getContract({
      abi: l1abi,
      address: contractAddresses.ENSRegistry as any,
      client: wallet,
    })

    const txHash2 = await registry.write.setOwner([namehash(normalize(name)), safeAddress], {
      gas: 6000000n,
    })

    await client.waitForTransactionReceipt({ hash: txHash2 })
    refresh()
  } catch (err: any) {
    console.error(err.message)
    setErrorMessage(err.message)
  }
}

export async function migrateToOnchainRecords(
  wallet: any,
  name: string,
  contractAddresses: any,
  l1abi: any,
) {
  const resolverAddress = await getResolverAddress(wallet, name)

  const calldata = {
    abi: l1abi,
    functionName: 'proveTextRecords',
    args: [namehash(name)],
    address: resolverAddress,
  }

  const callback = {
    ...calldata,
    functionName: 'bringRecordsOnchain',
    args: [contractAddresses['PublicResolver']],
    address: contractAddresses['ai.entity.id'],
  }

  return await executeWriteToResolver(wallet, calldata, callback)
}

export async function claimEntity(
  newOwner: any,
  wallet: any,
  address: any,
  client: any,
  records: any,
  domain: any,
) {
  try {
    const resolverAddress = await getResolverAddress(client, normalize(records?.entityid || domain))
    if (address && isAddressEqual(resolverAddress, contractAddresses['DatabaseResolver'])) {
      const formationPrep: any = {
        functionName: 'transfer',
        args: [namehash(normalize(records?.entityid || domain)), newOwner],
        abi: l1abi,
        address: resolverAddress,
      }
      let registrarAddress = contractAddresses['ai' + tld]
      const formationCallback: any = {
        functionName: 'registerEntityWithOffchain',
        abi: [
          {
            inputs: [
              {
                internalType: 'bytes',
                name: 'responseBytes',
                type: 'bytes',
              },
              {
                internalType: 'bytes',
                name: 'extraData',
                type: 'bytes',
              },
            ],
            name: 'registerEntityWithOffchain',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        address: registrarAddress,
        args: [],
      }

      const registerChaserTx = await executeWriteToResolver(
        wallet,
        formationPrep,
        formationCallback,
      )
      const transactionRes = await client?.waitForTransactionReceipt({
        hash: registerChaserTx,
      })
    }
  } catch (err: any) {
    console.log(err.message)
    if (err.message !== 'Cannot convert undefined to a BigInt') {
    }
  }
}
