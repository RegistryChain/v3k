import { useEffect, useMemo, useState } from 'react'
import {
  Address,
  createWalletClient,
  custom,
  decodeAbiParameters,
  encodeFunctionData,
  getContract,
  parseAbi,
  zeroAddress,
} from 'viem'
import { sepolia } from 'viem/chains'
import { useAccount, useConnect } from 'wagmi'

import { namehash, normalise } from '@ensdomains/ensjs/utils'

import { ErrorModal } from '@app/components/ErrorModal'
import { roles } from '@app/constants/members'
import { getTransactions } from '@app/hooks/useExecuteWriteToResolver'
import { useBreakpoint } from '@app/utils/BreakpointProvider'

import contractAddresses from '../../../../../../constants/contractAddresses.json'
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

const ActionsTab = ({
  refreshRecords,
  multisigAddress,
  entityMemberManager,
  client,
  name,
  checkEntityStatus,
}: any) => {
  const [userRoles, setUserRoles]: any[] = useState([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [wallet, setWallet] = useState<any>(null)
  const { address, isConnected } = useAccount()
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

  let amendmentsTrigger = null
  if (address !== zeroAddress) {
    amendmentsTrigger = (
      <ActionsProposal
        setErrorMessage={setErrorMessage}
        multisigAddress={multisigAddress}
        wallet={wallet}
        name={name}
      />
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
      {amendmentsTrigger}
      {txToConfirm}
      {txToExecute}
      {txHistory}
    </div>
  )
}

export default ActionsTab
