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

import { normalise } from '@ensdomains/ensjs/utils'
import { Banner, CheckCircleSVG, Typography } from '@ensdomains/thorin'

import BaseLink from '@app/components/@atoms/BaseLink'
import { LegacyDropdown } from '@app/components/@molecules/LegacyDropdown/LegacyDropdown'
import { Outlink } from '@app/components/Outlink'
import { ccipRequest, getRevertErrorData } from '@app/hooks/useExecuteWriteToResolver'
import { useNameDetails } from '@app/hooks/useNameDetails'
import { useProtectedRoute } from '@app/hooks/useProtectedRoute'
import { useQueryParameterState } from '@app/hooks/useQueryParameterState'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { Content, ContentWarning } from '@app/layouts/Content'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { OG_IMAGE_URL } from '@app/utils/constants'
import { infuraUrl } from '@app/utils/query/wagmi'
import { formatFullExpiry, makeEtherscanLink } from '@app/utils/utils'

import contractAddresses from '../../../../constants/contractAddresses.json'
import l1abi from '../../../../constants/l1abi.json'
import registrarsObj from '../../../../constants/registrars.json'
import { RecordsSection } from '../../../RecordsSection'
import Constitution from '../../entityCreation/Constitution'
import ActionsTab from './tabs/ActionTab/ActionsTab'
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
  const [records, setRecords] = useState<any>([])
  const [model, setModel] = useState<any>('')
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
    const modelObj = records.find((x: any) => x.key === 'company__selected__model')
    if (modelObj?.value) {
      setModel(modelObj?.value)
    }
  }, [records])

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
      setRecords((prev: { [x: string]: any }[]) => [...prev, { key: 'status', value: status }])
    } catch (e) {}
  }

  const getRecords = async () => {
    try {
      const resolver: any = await getContract({
        client: publicClient,
        abi: [
          ...parseAbi([
            'function multicall(bytes[] memory data) view returns (bytes[] memory)',
            'function text(bytes32,string memory) view returns (string memory)',
          ]),
          ...l1abi,
        ],
        address: contractAddresses.DatabaseResolver as Address,
      })

      const keys = [
        'LEI',
        'name',
        'partner__[0]__name',
        'partner__[0]__type',
        'partner__[0]__wallet__address',
        'partner__[0]__physical__address',
        'partner__[0]__DOB',
        'partner__[0]__is__manager',
        'partner__[0]__is__signer',
        'partner__[0]__lockup',
        'partner__[0]__shares',
        'partner__[1]__name',
        'partner__[1]__type',
        'partner__[1]__wallet__address',
        'partner__[1]__physical__address',
        'partner__[1]__DOB',
        'partner__[1]__is__manager',
        'partner__[1]__is__signer',
        'partner__[1]__lockup',
        'partner__[1]__shares',
        'partner__[2]__name',
        'partner__[2]__type',
        'partner__[2]__wallet__address',
        'partner__[2]__physical__address',
        'partner__[2]__DOB',
        'partner__[2]__is__manager',
        'partner__[2]__is__signer',
        'partner__[2]__lockup',
        'partner__[2]__shares',
        'partner__[3]__name',
        'partner__[3]__type',
        'partner__[3]__wallet__address',
        'partner__[3]__physical__address',
        'partner__[3]__DOB',
        'partner__[3]__is__manager',
        'partner__[3]__is__signer',
        'partner__[3]__lockup',
        'partner__[3]__shares',
        'partner__[4]__name',
        'partner__[4]__type',
        'partner__[4]__wallet__address',
        'partner__[4]__physical__address',
        'partner__[4]__DOB',
        'partner__[4]__is__manager',
        'partner__[4]__is__signer',
        'partner__[4]__lockup',
        'partner__[4]__shares',
        'partner__[5]__name',
        'partner__[5]__type',
        'partner__[5]__wallet__address',
        'partner__[5]__physical__address',
        'partner__[5]__DOB',
        'partner__[5]__is__manager',
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
        'company__selected__model',
      ]

      // const encodes = keys.map((text) => {
      //   return encodeFunctionData({
      //     abi: [
      //       {
      //         inputs: [
      //           {
      //             internalType: 'bytes32',
      //             name: 'node',
      //             type: 'bytes32',
      //           },
      //           {
      //             internalType: 'string',
      //             name: 'key',
      //             type: 'string',
      //           },
      //         ],
      //         name: 'text',
      //         outputs: [
      //           {
      //             internalType: 'string',
      //             name: '',
      //             type: 'string',
      //           },
      //         ],
      //         stateMutability: 'view',
      //         type: 'function',
      //       },
      //     ],
      //     functionName: 'text',
      //     args: [namehash(name), text],
      //   })
      // })
      const recordsBuilt: any[] = [{ key: 'domain', value: name }]
      let encResArr: any[] = []
      try {
        encResArr = await resolver.read.multicall([[]])
      } catch (err) {
        const data = getRevertErrorData(err)
        const [domain, url, message] = data.args as any[]

        const getRecord = encodeFunctionData({
          abi: [
            {
              inputs: [
                {
                  internalType: 'bytes32',
                  name: '',
                  type: 'bytes32',
                },
              ],
              name: 'getRecord',
              outputs: [
                {
                  internalType: 'string[] memory',
                  name: '',
                  type: 'string[] memory',
                },
              ],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'getRecord',
          args: [namehash(name)],
        })
        const res = await ccipRequest({
          body: {
            data: getRecord,
            signature: { message, domain },
            sender: message.sender,
          },
          url,
        })
        const recordResponse = (await res.text()) as any
        const dec1 = decodeAbiParameters(
          [{ type: 'bytes' }, { type: 'uint64' }, { type: 'bytes' }],
          recordResponse,
        )
        const records = decodeAbiParameters([{ type: 'string[]' }], dec1[0])[0]

        records.forEach((text) => {
          recordsBuilt.push({
            key: text.split('//')[0],
            value: text.split('//')[1],
          })
        })
      }
      setRecords((prev: { [x: string]: any }[]) => [...prev, ...recordsBuilt])
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
        const multisigAddress = await registry.read.owner([namehash(name)])
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

  const ogImageUrl = `${OG_IMAGE_URL}/name/${normalise(name) || name}`

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
          <title>{name}</title>
          <meta name="description" content={name + ' RegistryChain'} />
          <meta property="og:image" content={ogImageUrl} />
          <meta property="og:title" content={name} />
          <meta property="og:description" content={name + ' RegistryChain'} />
          <meta property="twitter:image" content={ogImageUrl} />
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
  if (records) {
    nameRecord = records?.find((x: any) => x.key === 'name')?.value
    if (nameRecord) {
      title = nameRecord + ' on RegistryChain'
    }
  }
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={title} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={name} />
        <meta property="twitter:image" content={ogImageUrl} />
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
                <RecordsSection
                  texts={records || []}
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
                    model={model}
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
