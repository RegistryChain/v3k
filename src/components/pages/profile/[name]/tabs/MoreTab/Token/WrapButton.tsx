import { useTranslation } from 'react-i18next'

import { GetOwnerReturnType } from '@ensdomains/ensjs/public'
import { checkIsDecrypted } from '@ensdomains/ensjs/utils'

import { useAccountSafely } from '@app/hooks/account/useAccountSafely'
import { useResolverStatus } from '@app/hooks/resolver/useResolverStatus'
import { useWrapperApprovedForAll } from '@app/hooks/useWrapperApprovedForAll'
import { makeIntroItem } from '@app/transaction-flow/intro'
import { createTransactionItem } from '@app/transaction-flow/transaction'
import { useTransactionFlow } from '@app/transaction-flow/TransactionFlowProvider'
import { GenericTransaction, TransactionFlowItem } from '@app/transaction-flow/types'
import { Profile } from '@app/types'
import { useHasGraphError } from '@app/utils/SyncProvider/SyncProvider'

import BaseWrapButton from './BaseWrapButton'

type Props = {
  name: string
  canBeWrapped: boolean
  ownerData: GetOwnerReturnType | undefined
  profile: Profile | undefined
}

const WrapButton = ({ name, ownerData, profile, canBeWrapped }: Props) => {
  const { t } = useTranslation('profile')

  const { data: hasGraphError, isLoading: hasGraphErrorLoading } = useHasGraphError()
  const { address } = useAccountSafely()
  const resolverStatus = useResolverStatus({ name })

  const hasOwnerData = !!ownerData
  const isManager = ownerData?.owner === address
  const isRegistrant = ownerData?.registrant === address

  const shouldMigrate =
    !resolverStatus.data?.isMigratedProfileEqual && !resolverStatus.data?.isNameWrapperAware
  const resolverAddress = profile?.resolverAddress

  const _canBeWrapped =
    canBeWrapped &&
    !!address &&
    (ownerData?.ownershipLevel === 'registrar' ? isRegistrant : isManager)

  const isSubname = name.split('.').length > 2
  const { data: approvedForAll, isLoading: isApprovalLoading } = useWrapperApprovedForAll({
    address: address!,
    isSubname,
    canBeWrapped: _canBeWrapped,
  })

  const { createTransactionFlow, resumeTransactionFlow, getResumable, usePreparedDataInput } =
    useTransactionFlow()
  const showUnknownLabelsInput = usePreparedDataInput('UnknownLabels')
  const resumable = getResumable(`wrapName-${name}`)

  const handleWrapClick = () => {
    if (!hasOwnerData) return
    if (resumable) return resumeTransactionFlow(`wrapName-${name}`)

    const isManagerAndShouldMigrate = isManager && shouldMigrate
    const isRegistrantAndShouldMigrate = !isManager && isRegistrant && shouldMigrate
    const needsApproval = isManager && isSubname && !approvedForAll

    const transactions: GenericTransaction[] = [
      ...(needsApproval
        ? [
          createTransactionItem('approveNameWrapper', {
            address: address!,
          } as any),
        ]
        : []),
      ...(isManagerAndShouldMigrate
        ? [
          createTransactionItem('migrateProfile', {
            name,
          } as any),
        ]
        : []),
      createTransactionItem('wrapName', {
        name,
      } as any),
      ...(isRegistrantAndShouldMigrate
        ? [createTransactionItem('migrateProfile', { name, resolverAddress } as any)]
        : []),
    ]

    const transactionFlowItem: TransactionFlowItem = {
      transactions,
      resumable: true,
      intro: {
        title: ['details.wrap.startTitle', { ns: 'profile' }],
        content: makeIntroItem('WrapName', { name }),
      },
    }

    const key = `wrapName-${name}`
    if (!checkIsDecrypted(name))
      return showUnknownLabelsInput(key, {
        name,
        key,
        transactionFlowItem,
      })
    return createTransactionFlow(key, transactionFlowItem)
  }

  const isLoading = isApprovalLoading || resolverStatus.isLoading || hasGraphErrorLoading

  if (!_canBeWrapped || hasGraphError) return null

  return (
    <BaseWrapButton
      data-testid="wrap-name-btn"
      disabled={isLoading}
      loading={isLoading}
      onClick={handleWrapClick}
    >
      {t('tabs.metadata.token.wrapName')}
    </BaseWrapButton>
  )
}

export default WrapButton
