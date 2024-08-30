import axios from 'axios'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { match } from 'ts-pattern'
import { createPublicClient, getContract, http, namehash, parseAbi } from 'viem'
import { sepolia } from 'viem/chains'
import { useAccount } from 'wagmi'

import { decodeContentHash } from '@ensdomains/ensjs/utils'
import { Banner, CheckCircleSVG, Typography } from '@ensdomains/thorin'

import BaseLink from '@app/components/@atoms/BaseLink'
import { Outlink } from '@app/components/Outlink'
import { useAbilities } from '@app/hooks/abilities/useAbilities'
import { useChainName } from '@app/hooks/chain/useChainName'
import { useNameDetails } from '@app/hooks/useNameDetails'
import { useProtectedRoute } from '@app/hooks/useProtectedRoute'
import { useQueryParameterState } from '@app/hooks/useQueryParameterState'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { Content, ContentWarning } from '@app/layouts/Content'
import { OG_IMAGE_URL } from '@app/utils/constants'
import { infuraUrl } from '@app/utils/query/wagmi'
import { formatFullExpiry, getEncodedLabelAmount, makeEtherscanLink } from '@app/utils/utils'

import { RecordsSection } from '../../../RecordsSection'
import AppsTab from './tabs/AppsTab'
import LicenseTab from './tabs/LicenseTab'
import ProfileTab from './tabs/ProfileTab'

const TabButtonContainer = styled.div(
  ({ theme }) => css`
    margin-left: -${theme.radii.extraLarge};
    margin-right: -${theme.radii.extraLarge};
    padding: 0 calc(${theme.radii.extraLarge} * 2);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: ${theme.space['6']};
    flex-gap: ${theme.space['6']};
    overflow: auto;

    &::-webkit-scrollbar {
      display: none;
    }
  `,
)

const TabButton = styled.button<{ $selected: boolean }>(
  ({ theme, $selected }) => css`
    display: block;
    outline: none;
    border: none;
    padding: 0;
    margin: 0;
    background: none;
    color: ${$selected ? theme.colors.accent : theme.colors.greyPrimary};
    font-size: ${theme.fontSizes.extraLarge};
    transition: all 0.15s ease-in-out;
    cursor: pointer;

    &:hover {
      color: ${$selected ? theme.colors.accentBright : theme.colors.text};
    }
  `,
)

const regKeyToRegistrarAddress: any = {
  'DL.US': {
    entityRegistrar: '0x32e9266eb5b61ba355dc22bb50828e3bbfef115d',
    resolver: '0x649d82b9c969ed5f1b899c3440f41a6b24f16f16',
  },
  'WY.US': {
    entityRegistrar: '0x71ed14654c85609c444a0c56b1580acd24e20c04',
    resolver: '0x649d82b9c969ed5f1b899c3440f41a6b24f16f16',
  },
  'BVI.UK': {
    entityRegistrar: '0xf940054296c0de06ac0d5163eb0240f98c7b1074',
    resolver: '0x649d82b9c969ed5f1b899c3440f41a6b24f16f16',
  },
  'CORP.PUB': {
    entityRegistrar: '0x123ac088458a15dc162f160c396f764288742b26',
    resolver: '0x649d82b9c969ed5f1b899c3440f41a6b24f16f16',
  },
  'CIV.PUB': {
    entityRegistrar: '0x7b5ca5d3c9b1dc921bd5f37d593407cf3d789d6a',
    resolver: '0x649d82b9c969ed5f1b899c3440f41a6b24f16f16',
  },
}

const registrarNameToKey: { [x: string]: string } = {
  'Public Registry': 'PUB',
  'Delaware USA': 'DL',
  'Wyoming USA': 'WY',
  'British Virgin Islands': 'BVI',
  'Civil Registry USA': 'CIV',
}

const registrarKeyToType: any = {
  PUB: 'corp',
  DL: 'corp',
  WY: 'corp',
  BVI: 'corp',
  CIV: 'civil',
}

const tabs = ['entity', 'licenses', 'apps'] as const
type Tab = (typeof tabs)[number]

type Props = {
  isSelf: boolean
  isLoading: boolean
  name: string
}

export const NameAvailableBanner = ({
  normalisedName,
  expiryDate,
}: {
  normalisedName: string
  expiryDate?: Date
}) => {
  const { t } = useTranslation('profile')
  return (
    <BaseLink href={`/register/${normalisedName}`} passHref legacyBehavior>
      <Banner
        alert="info"
        as="a"
        icon={<CheckCircleSVG />}
        title={t('banner.available.title', { name: normalisedName })}
      >
        <Trans
          ns="profile"
          i18nKey="banner.available.description"
          values={{
            date: formatFullExpiry(expiryDate),
          }}
          components={{ strong: <strong /> }}
        />
      </Banner>
    </BaseLink>
  )
}

const ProfileContent = ({ isSelf, isLoading: parentIsLoading, name }: Props) => {
  const router = useRouterWithHistory()
  const { t } = useTranslation('profile')
  const { address, isConnected } = useAccount()
  const [records, setRecords] = useState<any>([])
  const [contentHash, setContentHash] = useState<any>('')

  let nameToQuery = name
  const nameDetailsRes: any = useNameDetails({ name: nameToQuery })
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )
  useEffect(() => {
    //Attempt to use the subregistrars to get the resolver
    //Using node, query the record from the registry contract

    //Get the resolver address from this record
    //Query the contentHash from the resolver
    if (name) {
      getContent()
    }
  }, [name])

  const getContent = async () => {
    const registrarKey = name.split('.').slice(1, 3).join('.')
    const resolver: any = getContract({
      address: regKeyToRegistrarAddress[registrarKey].resolver,
      abi: parseAbi(['function contenthash(bytes32) external view returns (bytes memory)']),
      client: publicClient,
    })

    try {
      const hash = await resolver.read.contenthash([namehash(nameToQuery)])
      const decodedHash = decodeContentHash(hash)?.decoded || hash
      setContentHash(decodedHash)
    } catch (err) {
      setContentHash(null)
    }
  }

  useEffect(() => {
    getRecords()
  }, [contentHash])

  const getRecords = async () => {
    try {
      const jsonRes = await axios.get('https://gateway.pinata.cloud/ipfs/' + contentHash)
      setRecords(jsonRes.data)
    } catch (err) {
      console.log('AXIOS CATCH ERROR', err)
    }
  }

  const nameDetails: any = {}
  Object.keys(nameDetailsRes).forEach((key) => {
    let val: any = nameDetailsRes[key]

    nameDetails[key] = val
  })

  const {
    error,
    errorTitle,
    profile,
    normalisedName,
    beautifiedName,
    isValid,
    isCachedData,
    refetchIfEnabled,
  } = nameDetails

  useProtectedRoute(
    '/',
    // When anything is loading, return true
    parentIsLoading
      ? true
      : // if is self, user must be connected
        (isSelf ? address : true) && typeof name === 'string' && name.length > 0,
  )

  const registrarName = useMemo(() => {
    return profile?.texts?.find((x: any) => x.key === 'registrar')?.value
  }, [profile])

  const registrarKey = registrarNameToKey[registrarName]
  const registrarType = registrarKeyToType[registrarKey]

  const [titleContent, descriptionContent] = useMemo(() => {
    if (isSelf) {
      return [t('yourProfile'), '']
    }
    if (beautifiedName) {
      return [
        t('meta.title', {
          name: beautifiedName,
        }),
        t('meta.description', {
          name: beautifiedName,
        }),
      ]
    }
    if (typeof isValid === 'boolean' && isValid === false) {
      return [t('errors.invalidName'), t('errors.invalidName')]
    }
    return [
      t('meta.title', {
        name,
      }),
      t('meta.description', {
        name,
      }),
    ]
  }, [isSelf, beautifiedName, isValid, name, t])

  const [tab, setTab_] = useQueryParameterState<Tab>('tab', 'entity')
  const setTab: typeof setTab_ = (value) => {
    refetchIfEnabled()
    setTab_(value)
  }

  const abilities = useAbilities({ name: normalisedName })

  useEffect(() => {
    if (isSelf && name) {
      router.replace(`/profile/${name}`)
    }
  }, [isSelf, name, router])

  const warning: ContentWarning = useMemo(() => {
    if (error)
      return {
        type: 'warning',
        message: error,
        title: errorTitle,
      }
    return undefined
  }, [error, errorTitle])

  const ogImageUrl = `${OG_IMAGE_URL}/name/${normalisedName || name}`

  const chainName = useChainName()

  if (contentHash === null) {
    return (
      <>
        <Head>
          <title>{titleContent}</title>
          <meta name="description" content={descriptionContent} />
          <meta property="og:image" content={ogImageUrl} />
          <meta property="og:title" content={titleContent} />
          <meta property="og:description" content={descriptionContent} />
          <meta property="twitter:image" content={ogImageUrl} />
          <meta property="twitter:title" content={titleContent} />
          <meta property="twitter:description" content={descriptionContent} />
        </Head>
        <Typography fontVariant="extraLargeBold" color="inherit">
          Entity {name} is not registered on RegistryChain
        </Typography>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{titleContent}</title>
        <meta name="description" content={descriptionContent} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:title" content={titleContent} />
        <meta property="og:description" content={descriptionContent} />
        <meta property="twitter:image" content={ogImageUrl} />
        <meta property="twitter:title" content={titleContent} />
        <meta property="twitter:description" content={descriptionContent} />
      </Head>
      <Content noTitle title={name} loading={!isCachedData && parentIsLoading} copyValue={name}>
        {{
          warning,
          header: (
            <TabButtonContainer>
              {tabs.map((tabItem: any) => (
                <TabButton
                  key={tabItem}
                  data-testid={`${tabItem}-tab`}
                  $selected={tabItem === tab}
                  onClick={() => setTab(tabItem)}
                >
                  <Typography fontVariant="extraLargeBold" color="inherit">
                    {t(`tabs.${tabItem}.name`)}
                  </Typography>
                </TabButton>
              ))}
            </TabButtonContainer>
          ),
          titleExtra: profile?.address ? (
            <Outlink
              fontVariant="bodyBold"
              href={makeEtherscanLink(profile.address!, chainName, 'address')}
            >
              {t('etherscan', { ns: 'common' })}
            </Outlink>
          ) : null,
          trailing: match(tab)
            .with('entity', () => (
              <>
                <ProfileTab name={name} nameDetails={nameDetails} />
                <RecordsSection texts={records || []} />
              </>
            ))
            .with('apps', () => (
              <AppsTab
                registrarType={registrarType}
                name={normalisedName}
                nameDetails={nameDetails}
                abilities={abilities.data}
              />
            ))
            .with('licenses', () => (
              <LicenseTab
                registrarType={registrarType}
                name={normalisedName}
                nameDetails={nameDetails}
                abilities={abilities.data}
              />
            ))
            .exhaustive(),
        }}
      </Content>
    </>
  )
}

export default ProfileContent
