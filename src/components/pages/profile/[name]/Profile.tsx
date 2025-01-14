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
  isAddress,
  namehash,
  parseAbi,
  zeroAddress,
} from 'viem'
import { sepolia } from 'viem/chains'

import { normalise } from '@ensdomains/ensjs/utils'
import { Banner, CheckCircleSVG, Typography } from '@ensdomains/thorin'

import BaseLink from '@app/components/@atoms/BaseLink'
import { LegacyDropdown } from '@app/components/@molecules/LegacyDropdown/LegacyDropdown'
import { useConvertFlatResolverToFull } from '@app/hooks/useConvertFlatResolverToFull'
import { getRecordData } from '@app/hooks/useExecuteWriteToResolver'
import { useNameDetails } from '@app/hooks/useNameDetails'
import { useProtectedRoute } from '@app/hooks/useProtectedRoute'
import { useQueryParameterState } from '@app/hooks/useQueryParameterState'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useTextResolverReadBytes } from '@app/hooks/useTextResolverReadBytes'
import { useTextResolverResultsDecoded } from '@app/hooks/useTextResolverResultsDecoded'
import { Content, ContentWarning } from '@app/layouts/Content'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { OG_IMAGE_URL } from '@app/utils/constants'
import { infuraUrl } from '@app/utils/query/wagmi'
import { formatFullExpiry, makeEtherscanLink } from '@app/utils/utils'

import contractAddresses from '../../../../constants/contractAddresses.json'
import registrarsObj from '../../../../constants/registrars.json'
import { RecordsSection } from '../../../RecordsSection'
import Constitution from '../../entityCreation/Constitution'
import ActionsTab from './tabs/ActionsTab/ActionsTab'
import AppsTab from './tabs/AppsTab'
import EntityViewTab from './tabs/EntityViewTab'
import LicenseTab from './tabs/LicenseTab'

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

const ProfileContent = ({ isSelf, isLoading: parentIsLoading, name, router, address }: any) => {
  const { t } = useTranslation('profile')
  const [multisigAddress, setMultisigAddress] = useState('')
  const [entityMemberManager, setEntityMemberManager] = useState('')
  const [status, setStatus] = useState('')
  const [records, setRecords] = useState<any>({})
  const [recordsRequestPending, setRecordsRequestPending] = useState<any>(true)
  const breakpoints = useBreakpoint()

  const registrars: any = registrarsObj
  let nameToQuery = name

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http('https://gateway.tenderly.co/public/sepolia', {
          retryCount: 0,
          timeout: 10000,
        }),
      }),
    [],
  )

  useEffect(() => {
    if (isSelf && name) {
      router.replace(`/profile/${name}`)
    }
  }, [isSelf, name])

  useEffect(() => {
    const registry: any = getContract({
      address: contractAddresses.ENSRegistry as Address,
      abi: parseAbi(['function owner(bytes32) view returns (address)']),
      client: publicClient,
    })
    getMultisigAddr(registry)
  }, [publicClient, name])

  useEffect(() => {
    if (name) {
      setRecordsRequestPending(true)
      getRecords()
    }
  }, [name])

  useEffect(() => {
    if (multisigAddress) {
      checkEntityStatus()
    }
  }, [multisigAddress])

  const checkEntityStatus = async () => {
    const multisig: any = await getMultisig(multisigAddress)

    const multisigState: any = getContract({
      address: contractAddresses.MultisigState as Address,
      abi: parseAbi(['function entityToTransactionNonce(address) view returns (uint256)']),
      client: publicClient,
    })

    try {
      const localApproval = await multisig.read.localApproval()
      const operationApprovedByRegistrar = await multisig.read.checkEntityOperational([])
      // if localApproval is false and txNonce = 1, drafted
      let status = 'DRAFT'
      if (localApproval && operationApprovedByRegistrar) {
        status = 'APPROVED'
      } else if (localApproval) {
        status = 'SUBMITTED'
      }
      setStatus(status)
      setRecords((prev: { [x: string]: any }) => ({
        ...prev,
        status: { ...prev.status, setValue: status },
      }))
    } catch (e) {}
  }

  const getRecords = async () => {
    try {
      // if (resolver === 'textResolver') {
      //   const encodes = await useTextResolverReadBytes(namehash(name))
      //   const records = await useTextResolverResultsDecoded(publicClient, zeroAddress, encodes)
      //   const fields = await useConvertFlatResolverToFull(records)
      // }
      const fields = await getRecordData({ nodeHash: namehash(normalise(name)) })
      fields.partners = fields.partners.filter(
        (partner: any) => partner?.wallet__address?.setValue || partner?.name?.setValue,
      )
      setRecords(fields)
      setRecordsRequestPending(false)
      if (!status) {
        if (fields.sourceActive?.setValue === true) {
          setStatus('ACTIVE')
        } else {
          setStatus('INACTIVE')
        }
      }
    } catch (err) {
      console.log('AXIOS CATCH ERROR', err)
    }
  }

  const getMultisig = async (multisig: any) => {
    return getContract({
      address: multisig as Address,
      abi: parseAbi([
        'function entityMemberManager() view returns (address)',
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
        const multisigAddress = await registry.read.owner([namehash(normalise(name))])
        const multisig = await getMultisig(multisigAddress)
        const memberManagerAddress = await multisig.read.entityMemberManager()
        setEntityMemberManager(memberManagerAddress)
        setMultisigAddress(multisigAddress)
      } catch (e) {}
    }
  }

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

  const [tab, setTab_] = useQueryParameterState<Tab>('tab', 'entity')
  const setTab: typeof setTab_ = (value) => {
    setTab_(value)
  }

  const demoMessage = (
    <MessageContainer>
      This tab is for demonstration only. Eventually, services listed here will be integrated for
      use by your entity.
    </MessageContainer>
  )

  if (Object.keys(records)?.length === 0 && !recordsRequestPending) {
    return (
      <>
        <Head>
          <title>{records?.company__name?.setValue}</title>
          <meta name="description" content={name + ' RegistryChain'} />
          <meta property="og:title" content={name} />
          <meta property="og:description" content={name + ' RegistryChain'} />
          <meta property="twitter:title" content={name} />
          <meta property="twitter:description" content={name + ' RegistryChain'} />
        </Head>
        <Typography fontVariant="extraLargeBold" color="inherit">
          Entity {name} is not registered on RegistryChain
        </Typography>
      </>
    )
  }

  let title = 'RegistryChain'
  if (name) {
    title = name + ' on RegistryChain'
  }

  let nameRecord = title
  if (Object.keys(records)?.length > 0) {
    nameRecord = records?.company__name?.setValue
    if (nameRecord) {
      title = nameRecord + ' on RegistryChain'
    }
  }
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={title} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={name} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={title} />
      </Head>
      <Content noTitle={true} title={nameRecord} loading={parentIsLoading} copyValue={name}>
        {{
          header: (
            <>
              <EntityViewTab
                domainName={name}
                multisigAddress={multisigAddress}
                records={records}
                status={status}
              />
              {breakpoints.xs && !breakpoints.sm ? (
                <LegacyDropdown
                  style={{ maxWidth: '50%', textAlign: 'left' }}
                  inheritContentWidth={true}
                  size={'medium'}
                  label={tab}
                  items={tabs.map((tabItem: any) => ({
                    key: tabItem,
                    label: tabItem,
                    color: 'blue',
                    onClick: () => setTab(tabItem),
                  }))}
                />
              ) : (
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
              )}
            </>
          ),
          trailing: match(tab)
            .with('entity', () => (
              <>
                {isAddress(multisigAddress) && multisigAddress !== zeroAddress ? (
                  <MessageContainer>
                    This entity has not deployed its Contract Account. This means it is not
                    currently active on RegistryChain.
                  </MessageContainer>
                ) : null}
                <RecordsSection
                  fields={records}
                  compareToOldValues={false}
                  addressesObj={[
                    { key: 'Multisig Address', value: multisigAddress },
                    { key: 'Member Manager Address', value: entityMemberManager },
                  ]}
                />
              </>
            ))
            .with('constitution', () => {
              if (records && multisigAddress) {
                return (
                  <Constitution
                    breakpoints={breakpoints}
                    formationData={records}
                    multisigAddress={multisigAddress}
                    model={records.company__selected__model}
                    setModel={null}
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
                    entityMemberManager={entityMemberManager}
                    client={publicClient}
                    name={name}
                    checkEntityStatus={() => checkEntityStatus()}
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
                  name={normalise(name)}
                  nameDetails={{}}
                  breakpoints={breakpoints}
                />
              </>
            ))
            .with('licenses', () => (
              <>
                {demoMessage}
                <LicenseTab
                  registrarType={registrarType}
                  name={normalise(name)}
                  nameDetails={{}}
                  breakpoints={breakpoints}
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
