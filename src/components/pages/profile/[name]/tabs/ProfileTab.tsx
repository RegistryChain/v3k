import { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { Address, createPublicClient, getContract, http, namehash, parseAbi } from 'viem'
import { sepolia } from 'viem/chains'
import { useAccount } from 'wagmi'

import { Helper } from '@ensdomains/thorin'

import { Outlink } from '@app/components/Outlink'
import { ProfileSnippet } from '@app/components/ProfileSnippet'
import { useAbilities } from '@app/hooks/abilities/useAbilities'
import { useIsOffchainName } from '@app/hooks/ensjs/dns/useIsOffchainName'
import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import { useNameDetails } from '@app/hooks/useNameDetails'
import { infuraUrl } from '@app/utils/query/wagmi'
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

type Props = {
  nameDetails: ReturnType<typeof useNameDetails>
  name: string
  texts: any
}

const ProfileTab = ({ nameDetails, name, texts }: Props) => {
  const [multisigAddress, setMultisigAddress] = useState('')
  const { t } = useTranslation('profile')

  const { profile, normalisedName, isWrapped, gracePeriodEndDate } = nameDetails

  const abilities = useAbilities({ name })

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

  const readOwner = async (registry: any) => {
    const multisigAddress = await registry.read.owner([namehash(name)])
    setMultisigAddress(multisigAddress)
  }
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )

  useEffect(() => {
    const registry: any = getContract({
      address: contractAddresses.RegistryChain as Address,
      abi: parseAbi(['function owner(bytes32) view returns (address)']),
      client: publicClient,
    })
    readOwner(registry)
  }, [publicClient])

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
