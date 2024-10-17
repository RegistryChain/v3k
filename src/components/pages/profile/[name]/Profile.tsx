import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { match } from 'ts-pattern'
import {
  Address,
  createPublicClient,
  decodeAbiParameters,
  encodeFunctionData,
  getContract,
  http,
  namehash,
  parseAbi,
} from 'viem'
import { sepolia } from 'viem/chains'
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
import { infuraUrl } from '@app/utils/query/wagmi'
import { formatFullExpiry, makeEtherscanLink } from '@app/utils/utils'

import contractAddresses from '../../../../constants/contractAddresses.json'
import registrarsObj from '../../../../constants/registrars.json'
import { RecordsSection } from '../../../RecordsSection'
import Constitution from '../../entityCreation/Constitution'
import ActionsTab from './tabs/ActionTab/ActionsTab'
import AppsTab from './tabs/AppsTab'
import LicenseTab from './tabs/LicenseTab'
import ProfileTab from './tabs/ProfileTab'

const MessageContainer = styled.div(
  ({ theme }) => css`
    background-color: ${theme.colors.yellowSurface};
    color: ${theme.colors.textPrimary};
    font-size: ${theme.fontSizes.small};
    padding: ${theme.space['2']} ${theme.space['4']};
    text-align: center;
    font-weight: ${theme.fontWeights.bold};
    margin-bottom: 12px;
    border-radius: 16px;
  `,
)

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

const tabs = ['entity', 'constitution', 'actions', 'licenses', 'apps'] as const
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
  const [multisigAddress, setMultisigAddress] = useState('')
  const [entityManagementTokens, setEntityManagementTokens] = useState('')
  const [status, setStatus] = useState('')
  const [records, setRecords] = useState<any>([])
  const [template, setTemplate] = useState<any>('default')

  const registrars: any = registrarsObj
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
    if (isSelf && name) {
      router.replace(`/profile/${name}`)
    }
  }, [isSelf, name, router])

  useEffect(() => {
    const registry: any = getContract({
      address: contractAddresses.RegistryChain as Address,
      abi: parseAbi(['function owner(bytes32) view returns (address)']),
      client: publicClient,
    })
    getMultisigAddr(registry)
  }, [publicClient, name])

  useEffect(() => {
    if (name) {
      getRecords()
    }
  }, [name])

  useEffect(() => {
    const templateObj = records.find((x: any) => x.key === 'company__selected__template')
    if (templateObj?.value) {
      setTemplate(templateObj?.value)
    }
  }, [records])

  useEffect(() => {
    if (multisigAddress) {
      checkEntityStatus()
    }
  }, [multisigAddress])

  const checkEntityStatus = async () => {
    const multisig: any = await getMultisig(multisigAddress)

    // get localApproval from mutlisig
    // get entityToTransactionNonce from multisig state

    const multisigState: any = getContract({
      address: contractAddresses.MultisigState as Address,
      abi: parseAbi(['function entityToTransactionNonce(address) view returns (uint256)']),
      client: publicClient,
    })

    try {
      const localApproval = await multisig.read.localApproval()
      const entityNonce = await multisigState.read.entityToTransactionNonce([multisigAddress])
      const operationApprovedByRegistrar = await multisig.read.checkEntityOperational([])
      // if localApproval is false and txNonce = 1, drafted
      if (localApproval && operationApprovedByRegistrar) {
        setStatus('approved')
      } else if (localApproval) {
        setStatus('submitted')
      } else {
        setStatus('draft')
      }
    } catch (e) {}
  }

  const getRecords = async () => {
    try {
      const resolver: any = await getContract({
        client: publicClient,
        abi: parseAbi([
          'function multicallView(address contract, bytes[] memory data) view returns (bytes[] memory)',
          'function text(bytes32,string memory) view returns (string memory)',
        ]),
        address: contractAddresses.PublicResolver as Address,
      })

      const keys = [
        'name',
        'partner__[0]__name',
        'partner__[0]__type',
        'partner__[0]__wallet__address',
        'partner__[0]__physical__address',
        'partner__[0]__DOB',
        'partner__[0]__is__manager',
        'partner__[0]__lockup',
        'partner__[0]__shares',
        'partner__[1]__name',
        'partner__[1]__type',
        'partner__[1]__wallet__address',
        'partner__[1]__physical__address',
        'partner__[1]__DOB',
        'partner__[1]__is__signer',
        'partner__[1]__lockup',
        'partner__[1]__shares',
        'partner__[2]__name',
        'partner__[2]__type',
        'partner__[2]__wallet__address',
        'partner__[2]__physical__address',
        'partner__[2]__DOB',
        'partner__[2]__is__signer',
        'partner__[2]__lockup',
        'partner__[2]__shares',
        'partner__[3]__name',
        'partner__[3]__type',
        'partner__[3]__wallet__address',
        'partner__[3]__physical__address',
        'partner__[3]__DOB',
        'partner__[3]__is__signer',
        'partner__[3]__lockup',
        'partner__[3]__shares',
        'partner__[4]__name',
        'partner__[4]__type',
        'partner__[4]__wallet__address',
        'partner__[4]__physical__address',
        'partner__[4]__DOB',
        'partner__[4]__is__signer',
        'partner__[4]__lockup',
        'partner__[4]__shares',
        'partner__[5]__name',
        'partner__[5]__type',
        'partner__[5]__wallet__address',
        'partner__[5]__physical__address',
        'partner__[5]__DOB',
        'partner__[5]__is__signer',
        'partner__[5]__lockup',
        'partner__[5]__shares',
        'company__name',
        'company__entity__code',
        'company__registrar',
        'company__type',
        'company__description',
        'company__address',
        'company__purpose',
        'company__formation__date',
        'company__lockup__days',
        'company__additional__terms',
        'company__selected__template',
      ]

      const encodes = keys.map((text) => {
        return encodeFunctionData({
          abi: [
            {
              inputs: [
                {
                  internalType: 'bytes32',
                  name: 'node',
                  type: 'bytes32',
                },
                {
                  internalType: 'string',
                  name: 'key',
                  type: 'string',
                },
              ],
              name: 'text',
              outputs: [
                {
                  internalType: 'string',
                  name: '',
                  type: 'string',
                },
              ],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'text',
          args: [namehash(name), text],
        })
      })

      const recordsBuilt: any[] = []
      let encResArr: any[] = []
      try {
        encResArr = await resolver.read.multicallView([contractAddresses.PublicResolver, encodes])
      } catch (e) {}

      encResArr.forEach((x: any, idx: any) => {
        try {
          recordsBuilt.push({
            key: keys[idx],
            value: decodeAbiParameters([{ type: 'string' }], x)[0],
          })
        } catch (e) {}
      })
      setRecords(recordsBuilt)
    } catch (err) {
      console.log('AXIOS CATCH ERROR', err)
    }
  }

  const getMultisig = async (multisig: any) => {
    return getContract({
      address: multisig as Address,
      abi: parseAbi([
        'function entityManagementTokens() view returns (address)',
        'function localApproval() view returns (bool)',
        'function multisigState() view returns (address)',
        'function checkEntityOperational() view returns (bool)',
      ]),
      client: publicClient,
    })
  }

  const getMultisigAddr = async (registry: any) => {
    if (name) {
      try {
        const multisigAddress = await registry.read.owner([namehash(name)])
        const multisig = await getMultisig(multisigAddress)
        const tokenAddr = await multisig.read.entityManagementTokens()

        setEntityManagementTokens(tokenAddr)
        setMultisigAddress(multisigAddress)
      } catch (e) {}
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

  const suffixIndex = name?.split('.')?.length - 1
  const registrarKey = name?.split('.')?.slice(1, suffixIndex)?.join('.')

  const registrarType = registrars[registrarKey || '']?.type

  const [titleContent, descriptionContent] = useMemo(() => {
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

  const demoMessage = (
    <MessageContainer>
      This tab is for demonstration only. Eventually, services listed here will be integrated for
      use by your entity.
    </MessageContainer>
  )

  if (!records) {
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
                <ProfileTab
                  name={name}
                  nameDetails={nameDetails}
                  multisigAddress={multisigAddress}
                  records={records}
                />
                <RecordsSection status={status} texts={records || []} />
              </>
            ))
            .with('constitution', () => {
              if (records && multisigAddress) {
                return (
                  <Constitution
                    formationData={records}
                    template={template}
                    setTemplate={null}
                    canDownload={true}
                  />
                )
              } else {
                return (
                  <MessageContainer>
                    Entity not found. Constitution is available for entities with drafted or
                    submitted data.
                  </MessageContainer>
                )
              }
            })
            .with('actions', () => {
              if (records && multisigAddress) {
                return (
                  <ActionsTab
                    refreshRecords={() => getRecords()}
                    multisigAddress={multisigAddress}
                    entityTokensAddress={entityManagementTokens}
                    client={publicClient}
                    name={name}
                  />
                )
              } else {
                return (
                  <MessageContainer>
                    Entity not found. Actions are available for entities with drafted or submitted
                    data.
                  </MessageContainer>
                )
              }
            })
            .with('apps', () => (
              <>
                {demoMessage}
                <AppsTab
                  registrarType={registrarType}
                  name={normalisedName}
                  nameDetails={nameDetails}
                  abilities={abilities.data}
                />
              </>
            ))
            .with('licenses', () => (
              <>
                {demoMessage}
                <LicenseTab
                  registrarType={registrarType}
                  name={normalisedName}
                  nameDetails={nameDetails}
                  abilities={abilities.data}
                />
              </>
            ))
            .exhaustive(),
        }}
      </Content>
    </>
  )
}

export default ProfileContent
