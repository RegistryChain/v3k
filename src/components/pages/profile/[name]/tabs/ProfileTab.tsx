import { Trans, useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { Helper } from '@ensdomains/thorin'

import { Outlink } from '@app/components/Outlink'
import { ProfileSnippet } from '@app/components/ProfileSnippet'
import { useIsOffchainName } from '@app/hooks/ensjs/dns/useIsOffchainName'
import { getSupportLink } from '@app/utils/supportLinks'

import contractAddresses from '../../../../../constants/contractAddresses.json'

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

const ProfileTab = ({ nameDetails, name, multisigAddress }: any) => {
  const { t } = useTranslation('profile')

  const { normalisedName, isWrapped } = nameDetails

  const isOffchainImport = useIsOffchainName({
    name,
    enabled: nameDetails.registrationStatus === 'imported',
  })

  return (
    <DetailsWrapper>
      <ProfileSnippet name={name + 'sid'} multisigAddress={multisigAddress}>
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
