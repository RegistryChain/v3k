import Head from 'next/head'
import { useEffect, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { match } from 'ts-pattern'
import { useAccount } from 'wagmi'

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
import { formatFullExpiry, getEncodedLabelAmount, makeEtherscanLink } from '@app/utils/utils'

import ProfileTab from './tabs/ProfileTab'
import { RecordsTab } from './tabs/RecordsTab'
import { infuraUrl } from '@app/utils/query/wagmi'
import { sepolia } from 'viem/chains'
import { createPublicClient, http, namehash } from 'viem'
import AppComponent from './tabs/AppComponent'
import AppsTab from './tabs/AppsTab'
import LicenseTab from './tabs/LicenseTab'

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

const registrarNameToKey: {[x: string]: string} = {
  "Public Registry": "PUB",
  "Delaware USA": "DL",
  "Wyoming USA": "WY",
  "British Virgin Islands": "BVI",
  "Civil Registry USA": "CIV-US"
}

const registrarKeyToType: any = {
  PUB: "corp",
  DL:"corp",
  WY:"corp",
  BVI:"corp",
  "CIV-US": "civil"
}

const tabs = ['entity', 'records', 'licenses', 'apps'] as const
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
  const { address } = useAccount()


  const publicClient = useMemo(() => createPublicClient({
    chain: sepolia,
    transport: http(infuraUrl('sepolia'))
    }), [])

    // if (name?.includes(".registry")) {
    //   name = name.split(".registry")[0] + ".publicregistry.eth"
    // }


    // useEffect(() => {
    //   console.log('res', namehash(name), namehash("publicregistry.eth"))
    //   if (publicClient) {
    //     testReadRecord()
    //   }
    // }, [publicClient])

  // const testReadRecord = async () => {
    // const result = await getRecords(publicClient, {
    //   name,
    //   records: {
    //     texts: ['Type', 'DID'],
    //     coins: ['ETH'],
    //     contentHash: true,
    //   },
    // })
    // console.log('RES', result)
  // }

  let nameToQuery = name
    if (name?.includes(".registry")) {
      nameToQuery = name.split(".")[0] + ".publicregistry.eth"
    }
  const nameDetailsRes: any = useNameDetails({ name: nameToQuery })

  const nameDetails: any = {}
  Object.keys(nameDetailsRes).forEach(key => {
    let val: any = nameDetailsRes[key]
    if (typeof val === "string") {
      if (val?.includes(".publicregistry.eth")) {
        val = val.split(".")[0] + ".registry"
      }
    }

    nameDetails[key] = val
  })

  const {
    error,
    errorTitle,
    profile,
    gracePeriodEndDate,
    expiryDate,
    normalisedName,
    beautifiedName,
    isValid,
    isCachedData,
    isWrapped,
    wrapperData,
    registrationStatus,
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
    return (profile?.texts?.find((x: any) => x.key === "registrar"))?.value
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

  // hook for redirecting to the correct profile url
  // profile.decryptedName fetches labels from NW/subgraph
  // normalisedName fetches labels from localStorage
  useEffect(() => {
    // if (
    //   name !== profile?.decodedName &&
    //   profile?.decodedName &&
    //   !isSelf &&
    //   getEncodedLabelAmount(normalisedName) > getEncodedLabelAmount(profile.decodedName)
    // ) {
    //   // if the fetched decrypted name is different to the current name
    //   // and the decrypted name has less encrypted labels than the normalised name
    //   // direct to the fetched decrypted name
    //   router.replace(`/profile/${profile.decodedName}`, { shallow: true, maintainHistory: true })
    // } else if (
    //   name !== normalisedName &&
    //   normalisedName &&
    //   !isSelf &&
    //   (!profile?.decodedName ||
    //     getEncodedLabelAmount(profile.decodedName) > getEncodedLabelAmount(normalisedName)) &&
    //   decodeURIComponent(name) !== normalisedName
    // ) {
    //   // if the normalised name is different to the current name
    //   // and the normalised name has less encrypted labels than the decrypted name
    //   // direct to normalised name
    //   router.replace(`/profile/${normalisedName}`, { shallow: true, maintainHistory: true })
    // }
  }, [profile?.decodedName, normalisedName, name, isSelf, router])

  useEffect(() => {
    if (isSelf && name) {
      router.replace(`/profile/${name}`)
    }
  }, [isSelf, name, router])

  // useEffect(() => {
  //   if (shouldShowSuccessPage(transactions)) {
  //     router.push(`/import/${name}`)
  //   }
  // }, [name, router, transactions])

  const infoBanner = useMemo(() => {
    if (
      registrationStatus !== 'gracePeriod' &&
      gracePeriodEndDate &&
      gracePeriodEndDate < new Date()
    ) {
      return <NameAvailableBanner {...{ normalisedName, expiryDate }} />
    }
    return undefined
  }, [registrationStatus, gracePeriodEndDate, normalisedName, expiryDate])

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

  if (registrationStatus === "notOwned") {
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
          Name {name} is not registered on RegistryChain
        </Typography>
      </>)
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
      <Content
        noTitle
        title={name}
        loading={!isCachedData && parentIsLoading}
        copyValue={name}
      >
        {{
          info: infoBanner,
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
            .with('entity', () => <ProfileTab name={name} nameDetails={nameDetails} />)
            .with('records', () => (
              <RecordsTab
                name={normalisedName}
                texts={profile?.texts || []}
                addresses={profile?.coins || []}
                contentHash={profile?.contentHash}
                abi={profile?.abi}
                resolverAddress={profile?.resolverAddress}
                canEdit={abilities.data?.canEdit}
                canEditRecords={abilities.data?.canEditRecords}
                isCached={isCachedData}
              />
            ))
            .with('apps', () => (
              <AppsTab registrarType={registrarType} name={normalisedName} nameDetails={nameDetails} abilities={abilities.data} />
            ))
            .with('licenses', () => (
              <LicenseTab registrarType={registrarType} name={normalisedName} nameDetails={nameDetails} abilities={abilities.data} />
            ))
            .exhaustive(),
        }}
      </Content>
    </>
  )
}

export default ProfileContent
