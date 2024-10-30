import { useEffect, useMemo, useState } from 'react'
import {
  Address,
  createWalletClient,
  custom,
  decodeAbiParameters,
  encodeFunctionData,
  getContract,
  parseAbi,
} from 'viem'
import { sepolia } from 'viem/chains'
import { useAccount, useConnect } from 'wagmi'

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

const roles: any = {
  manager: '0x9a57c351532c19ba0d9d0f5f5524a133d80a3ebcd8b10834145295a87ddce7ce',
  signer: '0x2b0aecafcc9db9e85be7c1cee931b36fd598f30aec1c255376b92e2490cfe264',
  holder: '0xb238d52ec7e0f2a9731685576ee3e720fb21bfd1cdd4c8de0c3d8df492028584',
}

const ActionsTab = ({
  refreshRecords,
  multisigAddress,
  entityMemberManager,
  client,
  name,
}: any) => {
  const [userRoles, setUserRoles]: any[] = useState([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [memberBytes, setMemberBytes] = useState('')
  const [wallet, setWallet] = useState<any>(null)
  const { address, isConnected } = useAccount()

  const [methodsCallable, setMethodsCallable]: any = useState({})
  const [txs, setTxs]: any[] = useState([])

  const refresh = async () => {
    readTransactions()
  }

  const getMemberBytes = async () => {
    const memberManager: any = getContract({
      address: entityMemberManager as Address,
      abi: parseAbi(['function userDataBytes() external view returns (bytes)']),
      client: wallet,
    })

    const userDataBytes = await memberManager.read.userDataBytes()
    setMemberBytes(userDataBytes)
    return userDataBytes
  }

  const checkCallableByUser = async () => {
    const readTxDataEncodes: any[] = []
    const indexToMethod: any = {}
    const indexToRole: any = {}
    const methodToUserCanCall: any = {}
    let objectIdx = 0
    txs.forEach((tx: any) => {
      userRoles.forEach((role: any) => {
        try {
          readTxDataEncodes.push(
            encodeFunctionData({
              abi: [
                {
                  inputs: [
                    {
                      internalType: 'bytes4',
                      name: '',
                      type: 'bytes4',
                    },
                    {
                      internalType: 'bytes32',
                      name: '',
                      type: 'bytes32',
                    },
                  ],
                  name: 'methodCallableByRole',
                  outputs: [],
                  stateMutability: 'view',
                  type: 'function',
                },
              ],
              functionName: 'methodCallableByRole',
              args: [tx.method, role],
            }),
          )
        } catch (err) {}
        indexToMethod[objectIdx] = tx.method
        indexToRole[objectIdx] = role
        objectIdx += 1
      })
    })
    const resolver: any = await getResolver()
    let encResArr: any[] = []

    try {
      encResArr = await resolver.read.multicallView([multisigAddress, readTxDataEncodes])

      encResArr.forEach((x: any, idx: any) => {
        const userCallableMethod = decodeAbiParameters([{ type: 'bool' }], x)[0]
        if (userCallableMethod === true) {
          methodToUserCanCall[indexToMethod[idx]] = indexToRole[idx]
        }
      })
    } catch (e) {}
    Object.values(indexToMethod).forEach((method: any) => {
      if (!methodToUserCanCall[method]) {
        methodToUserCanCall[method] = false
      }
    })

    setMethodsCallable(methodToUserCanCall)
  }

  const readUserRoles = async () => {
    const resolver: any = await getResolver()
    const readTxDataEncodes = Object.keys(roles).map((role: any) => {
      try {
        return encodeFunctionData({
          abi: [
            {
              inputs: [
                {
                  internalType: 'address',
                  name: '',
                  type: 'address',
                },
                {
                  internalType: 'bytes32',
                  name: '',
                  type: 'bytes32',
                },
              ],
              name: 'userRoleLookup',
              outputs: [],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'userRoleLookup',
          args: [address as any, roles[role]],
        })
      } catch (e) {}
    })
    let encResArr: any[] = []
    let viewRes: any[] = []

    const userRoles: any[] = []
    if (!txs[0]?.executed && txs[0]?.txIndex === 0) {
      //map through databytes and decode
      // userDataBytes
      let bytes: any = memberBytes
      if (!memberBytes) {
        bytes = await getMemberBytes()
      }

      if (bytes) {
        const txDataArray = decodeAbiParameters([{ type: 'bytes[]' }], bytes)[0]

        txDataArray.forEach((data) => {
          const userData = decodeAbiParameters(
            [{ type: 'address' }, { type: 'uint256' }, { type: 'bytes' }],
            data,
          )
          if (userData[0] === address) {
            Object.keys(roles).forEach((role, idx) => {
              if (userData[2].includes(roles[role].slice(2))) {
                userRoles.push(roles[role])
              }
              if (Number(userData[1]) > 0) {
                userRoles.push(roles['holder'])
              }
            })
          }
        })
      }
    } else {
      try {
        viewRes = await resolver.read.multicallView([
          entityMemberManager, //entityTokens
          readTxDataEncodes,
        ])
      } catch (e) {}

      encResArr = viewRes.map((x: any) => {
        try {
          return decodeAbiParameters([{ type: 'bool' }], x)[0]
        } catch (e) {}
      })
      Object.keys(roles).forEach((role, idx) => {
        if (encResArr[idx] === true) {
          userRoles.push(roles[role])
        }
      })
    }
    setUserRoles(userRoles)
  }

  const readTransactions = async () => {
    const multisigState: any = await getContract({
      client,
      abi: parseAbi(['function entityToTransactionNonce(address entity) view returns (uint256)']),
      address: contractAddresses.MultisigState as Address,
    })
    let count = 0
    try {
      count = await multisigState.read.entityToTransactionNonce([multisigAddress])
      count = Number(count)
    } catch (e) {}

    const readTxDataEncodes = Array.from({ length: count }).map((_: any, idx: any) => {
      return encodeFunctionData({
        abi: [
          {
            inputs: [
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            name: 'entityToTransactions',
            outputs: [],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'entityToTransactions',
        args: [multisigAddress, idx],
      })
    })
    const resolver: any = await getResolver()
    let encResArr: any[] = []

    try {
      encResArr = await resolver.read.multicallView([
        contractAddresses.MultisigState,
        readTxDataEncodes,
      ])
    } catch (e) {}

    const txArray = encResArr
      .map((e: any, idx: any) => {
        try {
          const decode = decodeAbiParameters(
            [
              { type: 'address' },
              { type: 'string' },
              { type: 'bytes4' },
              { type: 'bytes' },
              { type: 'bool' },
              { type: 'uint256' },
              { type: 'uint256' },
            ],
            e,
          )
          return {
            targetContract: decode[0],
            title: decode[1],
            method: decode[2],
            methodName: methodsNames[decode[2]],
            dataBytes: decode[3],
            executed: decode[4],
            sigsMade: Number(decode[5]),
            sigsNeeded: Number(decode[6]),
            txIndex: Number(idx),
          }
        } catch (e) {
          return null
        }
      })
      ?.filter((x: any) => x)
    setTxs(txArray)
  }

  const getResolver = async () => {
    return getContract({
      client,
      abi: parseAbi([
        'function multicallView(address contract, bytes[] memory data) view returns (bytes[] memory)',
      ]),
      address: contractAddresses.PublicResolver as Address,
    })
  }

  const processTxAction = (tx: any) => {
    let data: any[] = []
    let name = tx.title
    if (tx.method === '0xac9650d8') {
      data = decodeMulticallDatabytes(tx.dataBytes)
      name = 'Update Entity Information'
    }
    if (tx.method === '0x10f13a8c') {
      return
    }

    return { name, data }
  }

  const decodeMulticallDatabytes = (databytes: any) => {
    const txDataArray = decodeAbiParameters([{ type: 'bytes[]' }], databytes)[0]
    const reformedData = txDataArray.map((data) => {
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
      return { key: dec[1], value: dec[2] }
    })
    return reformedData
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const newWallet = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum),
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
    if (entityMemberManager && address && userRoles.length === 0) {
      readUserRoles()
    }
  }, [address, txs, entityMemberManager])

  useEffect(() => {
    if (multisigAddress && userRoles && txs && Object.keys(methodsCallable).length === 0) {
      checkCallableByUser()
    }
  }, [multisigAddress, userRoles, txs])

  useEffect(() => {
    if (multisigAddress && userRoles && txs) {
      checkCallableByUser()
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
  if (userRoles.includes(roles.manager)) {
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
        userRoles={userRoles}
        multisigAddress={multisigAddress}
        getMemberBytes={getMemberBytes}
        memberBytes={memberBytes}
        methodsCallable={methodsCallable}
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
        userRoles={userRoles}
        processTxAction={processTxAction}
        multisigAddress={multisigAddress}
        setErrorMessage={setErrorMessage}
        methodsCallable={methodsCallable}
        wallet={wallet}
      />
    </div>
  )

  let txHistory = <ActionsExecuted txData={txsExecuted} />

  return (
    <div>
      {amendmentsTrigger}
      {txToConfirm}
      {txToExecute}
      {txHistory}
    </div>
  )
}

export default ActionsTab
