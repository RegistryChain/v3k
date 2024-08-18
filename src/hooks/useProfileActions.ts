import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { checkIsDecrypted } from '@ensdomains/ensjs/utils'

import { makeIntroItem } from '@app/transaction-flow/intro'
import { createTransactionItem } from '@app/transaction-flow/transaction'
import { useTransactionFlow } from '@app/transaction-flow/TransactionFlowProvider'
import { GenericTransaction } from '@app/transaction-flow/types'
import { checkAvailablePrimaryName } from '@app/utils/checkAvailablePrimaryName'
import { nameParts } from '@app/utils/name'
import { useHasGraphError } from '@app/utils/SyncProvider/SyncProvider'

import { useAbilities } from './abilities/useAbilities'
import { useAccountSafely } from './account/useAccountSafely'
import { useExpiry } from './ensjs/public/useExpiry'
import { useOwner } from './ensjs/public/useOwner'
import { usePrimaryName } from './ensjs/public/usePrimaryName'
import { useWrapperData } from './ensjs/public/useWrapperData'
import { useGetPrimaryNameTransactionFlowItem } from './primary/useGetPrimaryNameTransactionFlowItem'
import { useResolverStatus } from './resolver/useResolverStatus'
import { useProfile } from './useProfile'

type Action = {
  onClick: () => void
  label: string
  red?: boolean
  disabled?: boolean
  tooltipContent?: string
  tooltipPlacement?: 'left' | 'right'
  skip2LDEth?: boolean
  warning?: string
  fullMobileWidth?: boolean
  loading?: boolean
}

type Props = {
  name: string
  enabled?: boolean
}

export const useProfileActions = ({ name, enabled: enabled_ = true }: Props) => {
  const { t } = useTranslation('profile')
  const { createTransactionFlow, usePreparedDataInput } = useTransactionFlow()

  const { address } = useAccountSafely()

  const enabled = enabled_ && !!address

  const { data: abilities, isLoading: isAbilitiesLoading } = useAbilities({ name, enabled })

  const { data: profile, isLoading: isProfileLoading } = useProfile({ name, enabled })
  const { data: ownerData, isLoading: isOwnerLoading } = useOwner({ name, enabled })
  const { data: wrapperData, isLoading: isWrapperDataLoading } = useWrapperData({ name, enabled })
  const { data: expiryData, isLoading: isExpiryLoading } = useExpiry({ name, enabled })
  const expiryDate = expiryData?.expiry?.date

  const { data: resolverStatus, isLoading: isResolverStatusLoading } = useResolverStatus({
    name,
    migratedRecordsMatch: address
      ? { type: 'address', match: { id: 60, value: address } }
      : undefined,
    enabled: enabled && !!ownerData,
  })

  const { data: primaryData, isLoading: isPrimaryNameLoading } = usePrimaryName({
    address,
    enabled,
  })

  const isAvailablePrimaryName = checkAvailablePrimaryName(
    primaryData?.name,
    resolverStatus,
  )({
    name,
    relation: {
      owner: ownerData?.owner === address,
      registrant: ownerData?.registrant === address,
      resolvedAddress: profile?.address === address,
      wrappedOwner: wrapperData?.owner === address,
    },
    expiryDate,
    fuses: wrapperData?.fuses || null,
    isMigrated: profile?.isMigrated !== false,
  })

  const isWrapped = !!wrapperData

  const getPrimaryNameTransactionFlowItem = useGetPrimaryNameTransactionFlowItem({
    address,
    isWrapped,
    profileAddress: profile?.address,
    resolverAddress: profile?.resolverAddress,
    resolverStatus,
  })

  const { data: hasGraphError, isLoading: hasGraphErrorLoading } = useHasGraphError()

  const showUnknownLabelsInput = usePreparedDataInput('UnknownLabels')
  const showProfileEditorInput = usePreparedDataInput('ProfileEditor')
  const showDeleteEmancipatedSubnameWarningInput = usePreparedDataInput(
    'DeleteEmancipatedSubnameWarning',
  )
  const showDeleteSubnameNotParentWarningInput = usePreparedDataInput(
    'DeleteSubnameNotParentWarning',
  )

  const isLoading =
    isAbilitiesLoading ||
    isProfileLoading ||
    isOwnerLoading ||
    isWrapperDataLoading ||
    isExpiryLoading ||
    isPrimaryNameLoading ||
    isResolverStatusLoading ||
    getPrimaryNameTransactionFlowItem.isLoading

  const profileActions = useMemo(() => {
    const actions: Action[] = []
    if (!address || isLoading) return actions

    if (abilities.canEdit && (abilities.canEditRecords || abilities.canEditResolver)) {
      actions.push({
        label: t('tabs.entity.actions.constitutionAmendment.label'),
        tooltipContent: hasGraphError
          ? t('errors.networkError.blurb', { ns: 'common' })
          : undefined,
        tooltipPlacement: 'left',
        loading: hasGraphErrorLoading,
        onClick: () =>
          showProfileEditorInput(
            `amend-consitution-${name}`,
            { name },
            { disableBackgroundClick: true },
          ),
      })
    }

    if (abilities.canDelete && abilities.canDeleteContract) {
      const base = {
        label: t('tabs.entity.actions.deleteSubname.label'),
        tooltipContent: hasGraphError
          ? t('errors.networkError.blurb', { ns: 'common' })
          : undefined,
        red: true,
        skip2LDEth: true,
        loading: hasGraphErrorLoading,
      }
      if (abilities.canDeleteRequiresWrap) {
        const transactions: GenericTransaction[] = [
          createTransactionItem('transferSubname', {
            name,
            contract: 'nameWrapper',
            newOwnerAddress: address,
          }),
          createTransactionItem('deleteSubname', {
            contract: 'nameWrapper',
            name,
            method: 'setRecord',
          }),
        ]
      }

    } else if (abilities.canDeleteError) {
      actions.push({
        label: t('tabs.entity.actions.deleteSubname.label'),
        onClick: () => {},
        disabled: true,
        red: true,
        loading: hasGraphErrorLoading,
        skip2LDEth: true,
        tooltipContent: abilities.canDeleteError,
      })
    }

    if (abilities.canReclaim) {
      const { label, parent } = nameParts(name)
      actions.push({
        label: t('tabs.entity.actions.reclaim.label'),
        warning: t('tabs.entity.actions.reclaim.warning'),
        fullMobileWidth: true,
        loading: hasGraphErrorLoading,
        onClick: () => {
          createTransactionFlow(`reclaim-${name}`, {
            transactions: [
              createTransactionItem('createSubname', {
                contract: 'nameWrapper',
                label,
                parent,
              }),
            ],
          })
        },
      })
    }

    if (actions.length === 0) return undefined
    return actions
  }, [
    address,
    isLoading,
    getPrimaryNameTransactionFlowItem,
    name,
    isAvailablePrimaryName,
    abilities.canEdit,
    abilities.canEditRecords,
    abilities.canEditResolver,
    abilities.canDelete,
    abilities.canDeleteContract,
    abilities.canDeleteError,
    abilities.canReclaim,
    abilities.canDeleteRequiresWrap,
    abilities.isPCCBurned,
    abilities.isParentOwner,
    abilities.canDeleteMethod,
    t,
    hasGraphError,
    hasGraphErrorLoading,
    showUnknownLabelsInput,
    createTransactionFlow,
    showProfileEditorInput,
    showDeleteEmancipatedSubnameWarningInput,
    showDeleteSubnameNotParentWarningInput,
  ])

  return {
    profileActions,
    isLoading,
  }
}
