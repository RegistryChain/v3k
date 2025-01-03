import { useConnectModal } from '@rainbow-me/rainbowkit'
import styled, { css } from 'styled-components'
import { Address, decodeAbiParameters, getContract, isAddressEqual, parseAbi, zeroHash } from 'viem'
import { useAccount, useTransactionReceipt } from 'wagmi'

import { Button, mq, Tag, Toggle, Typography } from '@ensdomains/thorin'

import { CacheableComponent } from '@app/components/@atoms/CacheableComponent'
import RecordItem from '@app/components/RecordItem'
import { executeWriteToResolver } from '@app/hooks/useExecuteWriteToResolver'

import contractAddresses from '../../../../../../constants/contractAddresses.json'
import l1abi from '../../../../../../constants/l1abi.json'
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
  multisigAddress,
  wallet,
}: any) => {
  const { address, isConnected } = useAccount()
  const { openConnectModal }: any = useConnectModal()

  const executeAction = async (transaction: any) => {
    if (isAddressEqual(transaction.targetContract, contractAddresses.DatabaseResolver as any)) {
      await DBResolverFlow(transaction)
    } else {
      try {
        const multisig: any = getContract({
          address: multisigAddress as Address,
          abi: parseAbi(['function executeTransaction(uint256,bytes32, bytes, bytes) external']),
          client: wallet,
        })
        const executionTxHash = await multisig.write.executeTransaction([
          transaction.txIndex,
          '0x9a57c351532c19ba0d9d0f5f5524a133d80a3ebcd8b10834145295a87ddce7ce',
          zeroHash,
          zeroHash,
        ])
        console.log(await client?.waitForTransactionReceipt({ hash: executionTxHash }))
        refresh()
      } catch (err: any) {
        if (err.shortMessage === 'User rejected the request.') return
        let errMsg = err?.details
        if (!errMsg) errMsg = err?.shortMessage
        if (!errMsg) errMsg = err.message

        setErrorMessage(errMsg)
      }
    }
  }

  const DBResolverFlow = async (transaction: any) => {
    const args: any[] = []
    try {
      if (transaction.method === '0x10f13a8c') {
        // On setText, I just need to separate from tx bytes the key, value, and prepend the nodeHash
        args.push(
          decodeAbiParameters(
            [{ type: 'bytes32' }, { type: 'string' }, { type: 'string' }],
            transaction.dataBytes,
          )[0],
        )
      } else {
        // For multicall I have to decode the tx bytes into an array of bytes, then add to args
        args.push(decodeAbiParameters([{ type: 'bytes[]' }], transaction.dataBytes)[0])
      }

      const executionTxHash = await executeWriteToResolver(
        wallet,
        {
          functionName: transaction.method === '0x10f13a8c' ? 'setText' : 'multicall',
          abi: l1abi,
          address: contractAddresses.DatabaseResolver,
          args,
        },
        {
          functionName: 'executeTransaction',
          abi: [
            ...l1abi,
            ...parseAbi(['function executeTransaction(uint256,bytes32, bytes, bytes) external']),
          ],
          address: multisigAddress,
          args: [
            transaction.txIndex,
            '0x9a57c351532c19ba0d9d0f5f5524a133d80a3ebcd8b10834145295a87ddce7ce',
          ],
        },
      )
      console.log(await client?.waitForTransactionReceipt({ hash: executionTxHash }))
      refresh()
    } catch (err: any) {
      if (err.message === 'Cannot convert undefined to a BigInt') {
        refresh()
        return
      }
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
                      itemKey={'categoryActionsExec' + (x?.dataBytes || idx2)}
                      data={recordObject}
                    />
                  </div>
                )
              })}
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Button
                style={{ marginBottom: '6px', height: '42px' }}
                disabled={!x.memberCanExecute}
                onClick={async () => {
                  if (!isConnected || !address) {
                    await openConnectModal()
                  } else {
                    executeAction(x)
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
