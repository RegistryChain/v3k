import styled, { css } from 'styled-components'
import { Address, encodeFunctionData, getContract, parseAbi } from 'viem'

import { Button, mq, Tag, Toggle, Typography } from '@ensdomains/thorin'

import { CacheableComponent } from '@app/components/@atoms/CacheableComponent'
import RecordItem from '@app/components/RecordItem'

import contractAddresses from '../../../../../../constants/contractAddresses.json'
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
  setErrorMessage,
  txData,
  userRoles,
  multisigAddress,
  methodsCallable,
  wallet,
}: any) => {
  const executeAction = async (txIndex: any, method: any) => {
    try {
      const multisig: any = getContract({
        address: multisigAddress as Address,
        abi: parseAbi(['function executeTransaction(uint256,bytes32) external']),
        client: wallet,
      })
      await multisig.write.executeTransaction([txIndex, methodsCallable[method]])
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
        return (
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 4, marginRight: '4px' }}>
              <ItemsContainer key={x.dataBytes + idx}>
                <RecordItem
                  itemKey={x.txIndex.toString()}
                  value={x.method + ' - ' + x.methodName}
                  type="text"
                />
              </ItemsContainer>
            </div>
            <div style={{ flex: 1, textAlign: 'center', alignContent: 'center' }}>
              <Button
                style={{ marginBottom: '6px', height: '42px' }}
                disabled={!methodsCallable?.[x?.method]}
                onClick={() => executeAction(x.txIndex, x.method)}
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
