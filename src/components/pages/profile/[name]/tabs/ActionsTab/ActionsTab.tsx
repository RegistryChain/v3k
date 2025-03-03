import { useContext, useEffect, useMemo, useState } from 'react'
import {
  Address,
  createWalletClient,
  custom,
  decodeAbiParameters,
  encodeAbiParameters,
  encodeFunctionData,
  getContract,
  isAddress,
  labelhash,
  parseAbi,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem'
import { sepolia } from 'viem/chains'
import { packetToBytes } from 'viem/ens'
import { useAccount, useConnect } from 'wagmi'

import { namehash, normalise } from '@ensdomains/ensjs/utils'
import { Button } from '@ensdomains/thorin'

import { LegacyDropdown } from '@app/components/@molecules/LegacyDropdown/LegacyDropdown'
import { ErrorModal } from '@app/components/ErrorModal'
import { roles } from '@app/constants/members'
import { executeWriteToResolver, getTransactions } from '@app/hooks/useExecuteWriteToResolver'
import useTokenBalances from '@app/hooks/useTokenBalances'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { generateSafeAddress, generateSafeSalt, normalizeLabel } from '@app/utils/utils'

import contractAddresses from '../../../../../../constants/contractAddresses.json'
import l1abi from '../../../../../../constants/l1abi.json'
import ActionsConfirmation from './ActionsConfirmation'
import ActionsExecuted from './ActionsExecuted'
import ActionsExecution from './ActionsExecution'
import ActionsProposal from './ActionsProposal'

const methodsNames: any = {
  '0x9254f59a': 'operationSwitch',
  '0x10f13a8c': 'setText',
  '0xac9650d8': 'multicall',
  '0x96393e81': 'toggleRoles',
  '0xe1b09e0a': 'toggleContracts',
  '0x528c198a': 'mintShares',
  '0xee7a7c04': 'burnShares',
  '0xa73f7f8a': 'addRole',
  '0x208dd1ff': 'revokeRole',
}

const contractAddressesObj: any = contractAddresses

const tld = 'entity.id'

const ActionsTab = ({
  refreshRecords,
  multisigAddress,
  registrar,
  entityMemberManager,
  onChainOwner,
  claimEntity,
  partners,
  owner,
  client,
  wallet,
  setWallet,
  makeAmendment,
  name,
  checkEntityStatus,
}: any) => {
  const [userRoles, setUserRoles]: any[] = useState([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const { address, isConnected } = useAccount()
  const label = name.split('.')[0]

  const labelHashToUse = labelhash(normalizeLabel(label))
  const generatedSafe = useMemo(() => {
    if (address && name) {
      return generateSafeAddress(address, labelHashToUse, contractAddressesObj['ai.' + tld])
    } else {
      return zeroAddress
    }
  }, [address, name])
  const { balances, loading, error } = useTokenBalances(generatedSafe)
  const breakpoints = useBreakpoint()

  const [txs, setTxs]: any[] = useState([])

  const refresh = async () => {
    readTransactions()
    checkEntityStatus()
  }

  const readTransactions = async () => {
    const txArray = await getTransactions({
      nodeHash: namehash(normalise(name)),
      address: (address as any) || (zeroAddress as any),
    })
    setTxs(txArray)
  }

  const processTxAction = (tx: any) => {
    let data: any[] = []
    let name = tx.title
    if (tx.method === '0xac9650d8') {
      data = decodeMulticallDatabytes(tx.dataBytes)
      name = 'Update Entity - ' + tx.title
    }
    if (tx.method === '0x10f13a8c') {
      return
    }

    return { name, data }
  }

  const deployMultisig = async () => {
    try {
      const formationPrep: any = {
        functionName: 'register',
        args: [
          toHex(packetToBytes(label)),
          owner,
          0 /* duration */,
          zeroHash /* secret */,
          zeroAddress /* resolver */,
          [
            encodeAbiParameters(
              [{ type: 'string' }, { type: 'string' }],
              ['nodeHash', namehash(normalise(name))],
            ),
          ] /* data */,
          false /* reverseRecord */,
          0 /* fuses */,
          zeroHash /* extraData */,
        ],
        abi: l1abi,
        address: contractAddressesObj['DatabaseResolver'],
      }
      const domain: any = registrar?.toLowerCase() + '.' + tld
      const registrarAddress: any =
        contractAddressesObj[domain] || contractAddressesObj['public.' + tld]

      const formationCallback: any = {
        functionName: 'deployEntityContracts',
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
            name: 'deployEntityContracts',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        address: registrarAddress,
        args: [],
      }

      if (owner === address) {
        const registrarContract: any = getContract({
          abi: [
            {
              inputs: [{ type: 'address' }, { type: 'address' }],
              name: 'isApprovedForAll',
              outputs: [{ type: 'bool' }],
              type: 'function',
              stateMutability: 'view',
            },
            {
              inputs: [
                {
                  internalType: 'address',
                  name: '',
                  type: 'address',
                },
                {
                  internalType: 'bool',
                  name: '',
                  type: 'bool',
                },
              ],
              name: 'setApprovalForAll',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          address: contractAddressesObj.ENSRegistry,
          client: wallet,
        })

        const registrarApproved = await registrarContract.read.isApprovedForAll([
          address,
          registrarAddress,
        ])
        if (!registrarApproved) {
          const approvalTx = await registrarContract.write.setApprovalForAll([
            registrarAddress,
            true,
          ])
          const approvalRes = await client?.waitForTransactionReceipt({
            hash: approvalTx,
          })
        }
      }

      const registerChaserTx = await executeWriteToResolver(
        wallet,
        formationPrep,
        formationCallback,
      )
      const transactionRes = await client?.waitForTransactionReceipt({
        hash: registerChaserTx,
      })
      if (transactionRes?.status === 'reverted') {
        throw Error('Transaction failed - contract error')
      }
      return () => window.location.reload()
    } catch (err: any) {
      setErrorMessage(err.message)
    }
  }

  const decodeMulticallDatabytes = (databytes: any) => {
    const txDataArray = decodeAbiParameters([{ type: 'bytes[]' }], databytes)[0]
    const reformedData = txDataArray.map((data) => {
      if (data.slice(0, 10) === '0x10f13a8c') {
        const dec = decodeAbiParameters(
          [
            {
              type: 'bytes32',
            },
            {
              type: 'string',
            },
            {
              type: 'string',
            },
          ],
          data.split('10f13a8c').join('') as any,
        )
        return { key: dec[1], value: dec[2], method: 'setText' }
      } else if (data.slice(0, 10) === '0xee7a7c04' || data.slice(0, 10) === '0x528c198a') {
        const methods: any = { '0xee7a7c04': 'burnShares()', '0x528c198a': 'mintShares()' }
        const dec = decodeAbiParameters(
          [
            {
              type: 'address',
            },
            {
              type: 'uint256',
            },
          ],
          ('0x' + data.slice(10)) as any,
        )
        return { key: dec[0], value: dec[1], method: methods[data.slice(0, 10)] }
      } else {
        return null
      }
    })
    return reformedData.filter((x) => x)
  }

  const claimPregeneratedSafe = async () => {
    try {
      if (address) {
        // -Construct the salt with the labelhash, generate the address with the connected account
        const labelHashToUse = labelhash(normalizeLabel(label))
        const generatedSafe: any = generateSafeAddress(
          address,
          labelHashToUse,
          contractAddressesObj['ai.' + tld],
        )

        // Attempt to call to the safe at the pregenerated address. If not deployed yet, proceed
        const bc = await client.getBytecode({ address: generatedSafe })
        if (bc && bc !== '0x') {
          console.log(bc, generatedSafe)
          throw new Error('This safe has already been claimed')
        }

        const deployerContract: any = getContract({
          abi: [
            {
              inputs: [{ internalType: 'bytes32', name: 'saltInput', type: 'bytes32' }],
              name: 'deployClaimableSafe',
              outputs: [{ internalType: 'address', name: '', type: 'address' }],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          address: contractAddressesObj.ClaimableSafeFactory,
          client: wallet,
        })

        const tx = await deployerContract.write.deployClaimableSafe([
          generateSafeSalt(labelHashToUse, contractAddressesObj['ai.' + tld]),
        ])
      }
    } catch (err: any) {
      console.log(err.message)
      setErrorMessage(err.message)
    }
  }

  const withdrawFromSafe = async (tokenAddress: any, balance: any, decimals: any) => {
    try {
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
        address: generatedSafe as any,
        client: wallet,
      })

      const tx = await tokenContract.write.withdrawERC20([tokenAddress, balance * 10 ** decimals])
      console.log('Transaction Hash:', tx)
      return tx
    } catch (err: any) {
      setErrorMessage(err.message)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const newWallet = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum, {
          retryCount: 0,
        }),
        account: address,
      })
      setWallet(newWallet)
    } else {
      console.error('Ethereum object not found on window')
    }
  }, [address])

  useEffect(() => {
    if (multisigAddress && txs.length === 0) {
      readTransactions()
    }
  }, [multisigAddress])

  useEffect(() => {
    if (entityMemberManager && address) {
      readTransactions()
    }
  }, [address])

  const txsToConfirm = useMemo(() => txs.filter((x: any) => x.sigsMade < x.sigsNeeded), [txs])
  const txsToExecute = useMemo(
    () => txs.filter((x: any) => x.sigsMade >= x.sigsNeeded && !x.executed),
    [txs],
  )
  const txsExecuted = useMemo(
    () => txs.filter((x: any) => x.sigsMade >= x.sigsNeeded && x.executed),
    [txs],
  )

  // if (
  //   isAddress(owner) &&
  //   owner === address &&
  //   (!isAddress(multisigAddress) || multisigAddress === zeroAddress)
  // ) {
  //   return (
  //     <div style={{ width: '50%', margin: '16px 0' }}>
  //       <Button onClick={() => deployMultisig()}>Deploy Contract Account</Button>
  //     </div>
  //   )
  // }

  let claimOnChainElement = null
  // if on chain owner is zeroAddress but record.owner || partner.walletAddress is equal to account
  const hasOwnerOnchain = isAddress(onChainOwner) && onChainOwner !== zeroAddress
  const isOwnerOperatorOffchain =
    owner === address || partners?.map((x: any) => x?.wallet__address)?.includes(address)
  if (!hasOwnerOnchain && isOwnerOperatorOffchain) {
    claimOnChainElement = (
      <div style={{ width: '50%', margin: '16px 0' }}>
        <Button onClick={() => claimEntity(namehash(name))}>Claim On-Chain</Button>
      </div>
    )
  }

  let amendmentElement = null
  if (address === owner || owner === multisigAddress) {
    amendmentElement = (
      <div style={{ width: '50%', margin: '16px 0' }}>
        <Button
          onClick={() => {
            makeAmendment()
          }}
        >
          Make Amendment
        </Button>
      </div>
    )
  }

  let txToConfirm = (
    <div style={{ margin: '16px 0' }}>
      <ActionsConfirmation
        processTxAction={processTxAction}
        refresh={refresh}
        client={client}
        txData={txsToConfirm}
        multisigAddress={multisigAddress}
        setErrorMessage={setErrorMessage}
        wallet={wallet}
      />
    </div>
  )

  let txToExecute = (
    <div style={{ margin: '16px 0' }}>
      <ActionsExecution
        refresh={() => {
          refreshRecords()
          refresh()
        }}
        client={client}
        txData={txsToExecute}
        processTxAction={processTxAction}
        multisigAddress={multisigAddress}
        setErrorMessage={setErrorMessage}
        wallet={wallet}
      />
    </div>
  )

  let txHistory = <ActionsExecuted txData={txsExecuted} />

  return (
    <div>
      <ErrorModal
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
        breakpoints={breakpoints}
      />
      {claimOnChainElement}
      <div style={{ width: '50%', margin: '16px 0' }}>
        <Button onClick={() => claimPregeneratedSafe()}>Claim Safe</Button>
      </div>
      {balances.length > 0 ? (
        <div style={{ width: '50%', margin: '16px 0' }}>
          <LegacyDropdown
            style={{ maxWidth: '100%', textAlign: 'left' }}
            inheritContentWidth={true}
            size={'medium'}
            label={'Withdraw tokens from safe'}
            items={balances.map((x: any, idx: any) => ({
              key: x.tokenAddress,
              label: x.balance + ' ' + x.tokenSymbol,
              color: 'blue',
              onClick: () => withdrawFromSafe(x.tokenAddress, x.balance, x.decimals),
              value: x.tokenAddress,
            }))}
          />
        </div>
      ) : null}

      <div style={{ width: '50%', margin: '16px 0' }}>
        <Button onClick={() => deployMultisig()}>Deploy Contract Account</Button>
      </div>
      {amendmentElement}
      <div style={{ width: '50%', margin: '16px 0' }}>
        <Button>KYC verification</Button>
      </div>
    </div>
  )
}

export default ActionsTab
