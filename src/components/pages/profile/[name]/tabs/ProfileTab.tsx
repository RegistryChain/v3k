import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { useAccount } from 'wagmi'

import { Helper } from '@ensdomains/thorin'

import { Outlink } from '@app/components/Outlink'
import { ProfileSnippet } from '@app/components/ProfileSnippet'
import { useAbilities } from '@app/hooks/abilities/useAbilities'
import { useIsOffchainName } from '@app/hooks/ensjs/dns/useIsOffchainName'
import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import { useNameDetails } from '@app/hooks/useNameDetails'
import { getSupportLink } from '@app/utils/supportLinks'

const DetailsWrapper = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: ${theme.space['2']};
    flex-gap: ${theme.space['2']};
    width: 100%;
  `,
)

const OutlinkWithMargin = styled(Outlink)`
  margin-left: auto;
  padding-right: 0;
`

type Props = {
  nameDetails: ReturnType<typeof useNameDetails>
  name: string
}

const ProfileTab = ({ nameDetails, name }: Props) => {
  const { t } = useTranslation('profile')

  const { address } = useAccount()

  const { profile, normalisedName, isWrapped, gracePeriodEndDate } = nameDetails

  const abilities = useAbilities({ name })

  const { data: primaryData } = usePrimaryName({ address })

  const isOffchainImport = useIsOffchainName({
    name,
    enabled: nameDetails.registrationStatus === 'imported',
  })

  const isExpired = useMemo(
    () => gracePeriodEndDate && gracePeriodEndDate < new Date(),
    [gracePeriodEndDate],
  )
  const snippetButton = useMemo(() => {
    if (isExpired) return 'register'
    if (abilities.data?.canExtend) return 'extend'
  }, [isExpired, abilities.data?.canExtend])

  const getTextRecord = (key: string) => profile?.texts?.find((x) => x.key === key)

  return (
    <DetailsWrapper>
      <ProfileSnippet
        name={name}
        getTextRecord={getTextRecord}
        button={snippetButton}
        isPrimary={name === primaryData?.name}
      >
        {isOffchainImport && (
          <Helper alignment="horizontal">
            <Trans
              i18nKey="tabs.entity.warnings.offchain"
              ns="profile"
              components={{
                a: (
                  <OutlinkWithMargin href={getSupportLink('offchain-not-in-names')}>
                    {t('action.learnMore', { ns: 'common' })}
                  </OutlinkWithMargin>
                ),
              }}
            />
          </Helper>
        )}
        {nameDetails.isNonASCII && (
          <Helper type="warning" alignment="horizontal">
            <Trans
              i18nKey="tabs.entity.warnings.homoglyph"
              ns="profile"
              components={{
                a: <Outlink href={getSupportLink('homoglyphs')} />,
              }}
            />
          </Helper>
        )}
        {isWrapped && !normalisedName.endsWith('.eth') && (
          <Helper type="warning" alignment="horizontal">
            {t('tabs.entity.warnings.wrappedDNS')}
          </Helper>
        )}
      </ProfileSnippet>
    </DetailsWrapper>
  )
}

export default ProfileTab
