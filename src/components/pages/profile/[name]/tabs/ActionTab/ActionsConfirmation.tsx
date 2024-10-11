import { useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { Address, decodeAbiParameters, encodeFunctionData, getContract, parseAbi } from 'viem'
import { useAccount } from 'wagmi'

import { Button, mq, Tag, Toggle, Typography } from '@ensdomains/thorin'

import { CacheableComponent } from '@app/components/@atoms/CacheableComponent'
import RecordItem from '@app/components/RecordItem'

import contractAddresses from '../../../../../../constants/contractAddresses.json'
import RecordEntry from '../../../RecordEntry'
import { TabWrapper } from '../../../TabWrapper'

const Container = styled(TabWrapper)(
  ({ theme }) => css`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;

    & > div {
      padding: ${theme.space['4']};
      border-bottom: 1px solid ${theme.colors.border};
    }

    & > div:last-of-type {
      border-bottom: none;
    }

    ${mq.sm.min(css`
      & > div {
        padding: ${theme.space['4']} ${theme.space['6']};
      }

      & > div:first-of-type {
        padding: ${theme.space['6']};
      }
    `)}
  `,
)

const HeaderContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    & > div:first-of-type {
      font-size: ${theme.fontSizes.headingFour};
      font-weight: ${theme.fontWeights.bold};
    }
  `,
)

const ItemsContainer = styled(CacheableComponent)(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${theme.space['4']};
    margin-bottom: 6px;

    overflow: hidden;

    ${mq.sm.min(css`
      flex-direction: row;
    `)}
  `,
)

const ActionsConfirmation = ({
  refresh,
  client,
  setErrorMessage,
  processTxAction,
  txData,
  userRoles,
  multisigAddress,
  methodsCallable,
  wallet,
}: any) => {
  const [txIndexToSigned, setTxIndexToSigned] = useState<any>({})

  const { address } = useAccount()

  useEffect(() => {
    if (txData && address && multisigAddress) {
      alreadySigned()
    }
  }, [txData, userRoles, address, multisigAddress])

  useEffect(() => {}, [txData])

  const getResolver = async () => {
    return getContract({
      client,
      abi: parseAbi([
        'function multicallView(address contract, bytes[] memory data) view returns (bytes[] memory)',
      ]),
      address: contractAddresses.PublicResolver as Address,
    })
  }

  const alreadySigned = async () => {
    const idxToTxIndex: any = {}
    const txIndexToSignedByUser: any = {}
    const readTxDataEncodes = txData.map((tx: any, idx: any) => {
      idxToTxIndex[idx] = tx.txIndex
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
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
            ],
            name: 'isConfirmed',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'isConfirmed',
        args: [contractAddresses['public.registry'] as any, tx.txIndex, address as any],
      })
    })
    const resolver: any = await getResolver()
    const encResArr = await resolver.read.multicallView([
      contractAddresses.MultisigState,
      readTxDataEncodes,
    ])

    encResArr.forEach((x: any, idx: any) => {
      const userHasSigned = decodeAbiParameters([{ type: 'bool' }], x)[0]
      const txIndex = idxToTxIndex[idx]
      txIndexToSignedByUser[txIndex] = userHasSigned
    })

    setTxIndexToSigned(txIndexToSignedByUser)
  }

  const signAction = async (txIndex: any, method: any) => {
    try {
      // IMPORTANT FETCH TO SEE IF USER HAS SIGNED THIS ALREADY

      const multisig: any = getContract({
        address: multisigAddress as Address,
        abi: parseAbi(['function confirmTransaction(uint256,bytes32)']),
        client: wallet,
      })

      const confirmTxHash = await multisig.write.confirmTransaction([
        txIndex,
        methodsCallable[method],
      ])
      console.log(await client?.waitForTransactionReceipt({ hash: confirmTxHash }))
      alreadySigned()
      refresh()
    } catch (err: any) {
      setErrorMessage(err.message)
    }
  }
  return (
    <Container>
      <HeaderContainer>
        <Typography fontVariant="headingFour">Proposed Entity Actions</Typography>
      </HeaderContainer>
      {txData.map((x: any, idx: number) => {
        const processedTx = processTxAction(x)
        return (
          <div key={x.dataBytes + 'confi'} style={{ display: 'flex' }}>
            <div style={{ flex: 4, marginRight: '4px' }}>
              <ItemsContainer key={x.dataBytes + idx}>
                <RecordItem
                  itemKey={'Transaction ' + x.txIndex.toString()}
                  value={processedTx.name}
                  type="text"
                />
              </ItemsContainer>
              {processedTx?.data?.map((recordObject: any, idx2: any) => {
                return (
                  <div style={{ marginLeft: '40px' }}>
                    <RecordEntry
                      itemKey={'categoryActionsConf' + (x?.databytes || idx2)}
                      data={recordObject}
                    />
                  </div>
                )
              })}
            </div>
            <div style={{ flex: 1, textAlign: 'center', alignContent: 'center' }}>
              <Button
                style={{ marginBottom: '6px', height: '42px' }}
                disabled={!methodsCallable?.[x?.method] || txIndexToSigned[x.txIndex]}
                onClick={() => signAction(x.txIndex, x.method)}
              >
                Sign
              </Button>
              <Button
                onClick={() => null}
                disabled={true}
                style={{ cursor: 'default', color: 'black', height: '42px', marginBottom: '6px' }}
              >
                {x.sigsMade}/{x.sigsNeeded}
              </Button>
            </div>
          </div>
        )
      })}
    </Container>
  )
}

export default ActionsConfirmation
