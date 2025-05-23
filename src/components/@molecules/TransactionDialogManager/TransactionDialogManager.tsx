import { QueryClientProvider } from '@tanstack/react-query'
import { Dispatch, useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import usePrevious from 'react-use/lib/usePrevious'
import { match, P } from 'ts-pattern'
import { useAccount, useChainId } from 'wagmi'

import { Dialog } from '@ensdomains/thorin'

import { queryClientWithRefetch } from '@app/utils/query/reactQuery'

import { DataInputComponents } from '../../../transaction-flow/input'
import { InternalTransactionFlow, TransactionFlowAction } from '../../../transaction-flow/types'
import { IntroStageModal } from './stage/Intro'
import { TransactionStageModal } from './stage/TransactionStageModal'
import { useWallets } from '@privy-io/react-auth'
import { Address } from 'viem'

export const useResetSelectedKey = (dispatch: any) => {
  const { wallets } = useWallets();      // Privy hook
  const address = useMemo(() => wallets[0]?.address, [wallets]) as Address
  const chainId = useChainId()

  const prevAddress = usePrevious(address)
  const prevChainId = usePrevious(chainId)

  useEffect(() => {
    if (prevChainId && prevChainId !== chainId) {
      dispatch({
        name: 'stopFlow',
      })
    }
  }, [prevChainId, chainId, dispatch])

  useEffect(() => {
    if (prevAddress && prevAddress !== address) {
      dispatch({
        name: 'stopFlow',
      })
    }
  }, [prevAddress, address, dispatch])
}

export const TransactionDialogManager = ({
  state,
  dispatch,
  selectedKey,
}: {
  state: InternalTransactionFlow
  dispatch: Dispatch<TransactionFlowAction>
  selectedKey: string | null
}) => {
  const { t } = useTranslation()
  const selectedItem = useMemo(
    () => (selectedKey ? state.items[selectedKey] : null),
    [selectedKey, state.items],
  )

  useResetSelectedKey(dispatch)

  const onDismiss = useCallback(() => {
    dispatch({ name: 'stopFlow' })
  }, [dispatch])

  const onDismissDialog = useCallback(() => {
    if (selectedItem?.disableBackgroundClick && selectedItem?.currentFlowStage === 'input') return
    dispatch({
      name: 'stopFlow',
    })
  }, [dispatch, selectedItem?.disableBackgroundClick, selectedItem?.currentFlowStage])

  return (
    <Dialog
      variant="blank"
      open={!!state.selectedKey}
      onDismiss={onDismissDialog}
      onClose={onDismiss}
    >
      {match([selectedKey, selectedItem])
        .with(
          [P.not(P.nullish), { input: P.not(P.nullish), currentFlowStage: 'input' }],
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ([_, _selectedItem]) => {
            const Component = DataInputComponents[_selectedItem.input.name]
            return (
              <QueryClientProvider client={queryClientWithRefetch}>
                <Component
                  {...{
                    data: _selectedItem.input.data,
                    transactions: _selectedItem.transactions,
                    dispatch,
                    onDismiss,
                  }}
                />
              </QueryClientProvider>
            )
          },
        )
        .with(
          [P.not(P.nullish), { intro: P.not(P.nullish), currentFlowStage: 'intro' }],
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ([_, _selectedItem]) => {
            const currentTx = _selectedItem.transactions[_selectedItem.currentTransaction]
            const currentStep =
              currentTx.stage === 'complete'
                ? _selectedItem.currentTransaction + 1
                : _selectedItem.currentTransaction

            const stepStatus =
              currentTx.stage === 'sent' || currentTx.stage === 'failed'
                ? 'inProgress'
                : 'notStarted'

            return (
              <IntroStageModal
                stepStatus={stepStatus}
                currentStep={currentStep}
                onSuccess={() => dispatch({ name: 'setFlowStage', payload: 'transaction' })}
                {...{
                  ..._selectedItem.intro,
                  onDismiss,
                  transactions: _selectedItem.transactions,
                }}
              />
            )
          },
        )
        .otherwise(([_selectedKey, _selectedItem]) => {
          if (!_selectedKey || !_selectedItem) return null
          const transactionItem = _selectedItem.transactions[_selectedItem.currentTransaction]

          return (
            null
          )
        })}
    </Dialog>
  )
}
