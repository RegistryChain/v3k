import { useConnectModal } from '@rainbow-me/rainbowkit'
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
  multisigAddress,
  wallet,
}: any) => {
  const { address, isConnected } = useAccount()

  const { openConnectModal }: any = useConnectModal()

  const signAction = async (txIndex: any, method: any) => {
    try {
      // IMPORTANT FETCH TO SEE IF USER HAS SIGNED THIS ALREADY

      const multisig: any = getContract({
        address: multisigAddress as Address,
        abi: parseAbi([
          'function confirmTransaction(uint256,bytes32)',
          'function initializeMember()',
        ]),
        client: wallet,
      })

      if (txIndex === 0) {
        const confirmTxHash = await multisig.write.initializeMember([])
        console.log(await client?.waitForTransactionReceipt({ hash: confirmTxHash }))
      } else {
        const confirmTxHash = await multisig.write.confirmTransaction([
          txIndex,
          '0x9a57c351532c19ba0d9d0f5f5524a133d80a3ebcd8b10834145295a87ddce7ce',
        ])
        console.log(await client?.waitForTransactionReceipt({ hash: confirmTxHash }))
      }

      refresh()
    } catch (err: any) {
      if (err.shortMessage === 'User rejected the request.') return
      let errMsg = err?.details
      if (!errMsg) errMsg = err?.shortMessage
      if (!errMsg) errMsg = err.message

      setErrorMessage(errMsg)
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
                disabled={!x.memberCanSign}
                onClick={async () => {
                  try {
                    if (!isConnected || !address) {
                      await openConnectModal()
                    } else {
                      signAction(x.txIndex, x.method)
                    }
                  } catch (err) { }
                }}
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
