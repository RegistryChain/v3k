import { match, P } from 'ts-pattern'
import { Address } from 'viem'

import type { useAbilities } from '@app/hooks/abilities/useAbilities'

import { createTransactionItem, TransactionItem } from '..'

type MakeTransferNameOrSubnameTransactionItemParams = {
  name: string
  newOwnerAddress: Address
  sendType: 'sendManager' | 'sendOwner'
  isOwnerOrManager: boolean
  abilities: ReturnType<typeof useAbilities>['data']
}

export const makeTransferNameOrSubnameTransactionItem = ({
  name,
  newOwnerAddress,
  sendType,
  isOwnerOrManager,
  abilities,
}: MakeTransferNameOrSubnameTransactionItemParams): TransactionItem | null => {
  return (
    match([
      isOwnerOrManager,
      sendType,
      abilities?.sendNameFunctionCallDetails?.[sendType]?.contract,
    ])
      .with([true, 'sendOwner', P.not(P.nullish)], ([, , contract]) =>
        createTransactionItem('transferName', {
          name,
          newOwnerAddress,
          sendType: 'sendOwner',
          contract,
        } as any),
      )
      .with([true, 'sendManager', 'registrar'], () =>
        createTransactionItem('transferName', {
          name,
          newOwnerAddress,
          sendType: 'sendManager',
          contract: 'registrar',
          reclaim: abilities?.sendNameFunctionCallDetails?.sendManager?.method === 'reclaim',
        } as any),
      )
      .with([true, 'sendManager', P.union('registry', 'nameWrapper')], ([, , contract]) =>
        createTransactionItem('transferName', {
          name,
          newOwnerAddress,
          sendType: 'sendManager',
          contract,
        } as any),
      )
      // A parent name can only transfer the manager
      .with([false, 'sendManager', P.union('registry', 'nameWrapper')], ([, , contract]) =>
        createTransactionItem('transferSubname', {
          name,
          newOwnerAddress,
          contract,
        } as any),
      )
      .otherwise(() => null)
  )
}
