import { useConnectModal } from '@rainbow-me/rainbowkit'
import styled, { css } from 'styled-components'
import { Address, encodeFunctionData, getContract, parseAbi } from 'viem'
import { useAccount } from 'wagmi'

import { Button, mq, Tag, Toggle, Typography } from '@ensdomains/thorin'

import { CacheableComponent } from '@app/components/@atoms/CacheableComponent'
import RecordItem from '@app/components/RecordItem'

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

const ActionsExecution = ({
  refresh,
  client,
  setErrorMessage,
  txData,
  processTxAction,
  userRoles,
  multisigAddress,
  methodsCallable,
  wallet,
}: any) => {
  const { address, isConnected } = useAccount()
  const { openConnectModal }: any = useConnectModal()

  const executeAction = async (txIndex: any, method: any) => {
    try {
      const multisig: any = getContract({
        address: multisigAddress as Address,
        abi: parseAbi(['function executeTransaction(uint256,bytes32) external']),
        client: wallet,
      })
      const executionTxHash = await multisig.write.executeTransaction([
        txIndex,
        methodsCallable[method],
      ])
      console.log(await client?.waitForTransactionReceipt({ hash: executionTxHash }))
      refresh()
    } catch (err: any) {
      setErrorMessage(err.message)
    }
  }

  return (
    <Container>
      <HeaderContainer>
        <Typography fontVariant="headingFour">Transactions To Execute</Typography>
      </HeaderContainer>
      {txData.map((x: any, idx: number) => {
        const processedTx = processTxAction(x)
        return (
          <div key={x.dataBytes + idx + 'exec'} style={{ display: 'flex' }}>
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
                      itemKey={'categoryActionsExec' + (x?.databytes || idx2)}
                      data={recordObject}
                    />
                  </div>
                )
              })}
            </div>
            <div style={{ flex: 1, textAlign: 'center', alignContent: 'center' }}>
              <Button
                style={{ marginBottom: '6px', height: '42px' }}
                disabled={!methodsCallable?.[x?.method]}
                onClick={async () => {
                  if (!isConnected || !address) {
                    await openConnectModal()
                  } else {
                    executeAction(x.txIndex, x.method)
                  }
                }}
              >
                Execute
              </Button>
            </div>
          </div>
        )
      })}
    </Container>
  )
}

export default ActionsExecution
