import { Box } from '@mui/material'
import Head from 'next/head'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { match } from 'ts-pattern'
import {
  Address,
  createPublicClient,
  getContract,
  http,
  isAddress,
  namehash,
  parseAbi,
  zeroAddress,
} from 'viem'
import { sepolia, baseSepolia, bsc } from 'viem/chains'

import { normalise } from '@ensdomains/ensjs/utils'
import { Banner, CheckCircleSVG, Spinner, Typography } from '@ensdomains/thorin'

import BaseLink from '@app/components/@atoms/BaseLink'
import { LegacyDropdown } from '@app/components/@molecules/LegacyDropdown/LegacyDropdown'
import { useProtectedRoute } from '@app/hooks/useProtectedRoute'
import { useQueryParameterState } from '@app/hooks/useQueryParameterState'
import { ModalContext } from '@app/layouts/Basic'
import { Content, ContentWarning } from '@app/layouts/Content'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { formatFullExpiry, makeEtherscanLink } from '@app/utils/utils'

import contractAddresses from '../../../../constants/contractAddresses.json'
import registrarsObj from '../../../../constants/registrars.json'
import { RecordsSection } from '../../../RecordsSection'
import SubgraphResults from '../../../SubgraphQuery'
import ActionsTab from './tabs/ActionsTab/ActionsTab'
import EntityViewTab from './tabs/EntityViewTab'
import PluginsTab from './tabs/PluginsTab'
import RegulatoryTab from './tabs/Regulatory'

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
    border-bottom: 1px solid ${$selected ? theme.colors.accent : 'transparent'};

    &:hover {
      color: ${$selected ? theme.colors.accentBright : theme.colors.text};
    }
  `,
)

const tabs = ['entity', 'actions', 'regulatory', 'plugins'] as const
type Tab = (typeof tabs)[number]

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

const ProfileContent = ({
  isSelf,
  isLoading: parentIsLoading,
  loadingRecords,
  domain,
  router,
  address,
  owner,
  setOwner,
  claimEntity,
  isClaiming,
  records,
  setRecords,
  getRecords,
  wallet,
  setWallet,
  setErrorMessage,
}: any) => {
  const { t } = useTranslation('profile')
  const [multisigAddress, setMultisigAddress] = useState('')
  const [entityMemberManager, setEntityMemberManager] = useState('')
  const [status, setStatus] = useState('')
  const [subgraphResults, setSubgraphResults] = useState<any>([])
  const [onChainOwner, setOnChainOwner] = useState(zeroAddress)
  const { setIsModalOpen, setAgentModalPrepopulate } = useContext<any>(ModalContext)
  const [recordsRequestPending, setRecordsRequestPending] = useState<any>(true)
  const breakpoints = useBreakpoint()
  const [verification, setVerification] = useState<string | undefined>()

  const registrars: any = registrarsObj

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
  const basePublicClient = useMemo(
    () =>
      createPublicClient({
        chain: baseSepolia,
        transport: http(),
      }),
    [],
  )
  const binancePublicClient = useMemo(
    () =>
      createPublicClient({
        chain: bsc,
        transport: http(),
      }),
    [],
  )
  const makeAmendment = async () => {
    const recordsToPopulate: any = {}
    Object.keys(records).forEach((field) => {
      recordsToPopulate[field] = records[field]
    })
    setAgentModalPrepopulate(recordsToPopulate)
    setIsModalOpen(true)
  }
  const checkAddressVerification = async (_ownerAddress: string) => {

    const coinbaseContract = getContract({
      address: contractAddresses.BaseSepoliaCoinbaseIndexer as Address,
      abi: parseAbi(['function getAttestationUid(address,bytes32) view returns (bytes32)']),
      client: basePublicClient,
    })

    const binanceContract = getContract({
      address: contractAddresses.BinanceMainnetContract as Address,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      client: binancePublicClient,
    })
    const verification = await getVerificationStatus(coinbaseContract, binanceContract, _ownerAddress)

    setVerification(verification)
    console.log("verification " + verification)
  }
  useEffect(() => {
    if (isSelf && domain) {
      router.replace(`/profile/${domain}`)
    }
  }, [isSelf, domain])

  useEffect(() => {
    const registry: any = getContract({
      address: contractAddresses.ENSRegistry as Address,
      abi: parseAbi(['function owner(bytes32) view returns (address)']),
      client: publicClient,
    })
    getMultisigAddr(registry)
  }, [publicClient, domain])

  useEffect(() => {
    if (domain) {
      setRecordsRequestPending(true)
      getRecords()
    }
  }, [domain])

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
        status,
      }))
    } catch (e) { }
  }

  useEffect(() => {
    try {
      // if (resolver === 'textResolver') {
      //   const encodes = await useTextResolverReadBytes(namehash(name))
      //   const records = await useTextResolverResultsDecoded(publicClient, zeroAddress, encodes)
      //   const fields = await useConvertFlatResolverToFull(records)
      // }
      checkAddressVerification(records.owner)
      if (
        isAddress(records?.owner) &&
        records?.owner !== zeroAddress &&
        (!owner || owner === zeroAddress)
      ) {
        checkAddressVerification(records.owner)
        setOwner(records.owner)
      }

      if (Object.keys(records)?.length > 0) {
        setRecordsRequestPending(false)
        if (!status) {
          if (records.sourceActive === true) {
            setStatus('ACTIVE')
          } else {
            setStatus('INACTIVE')
          }
        }
      }
    } catch (err) {
      console.log('AXIOS CATCH ERROR', err)
    }
  }, [records, domain])

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
    if (domain) {
      let ownerAddress = zeroAddress
      try {
        ownerAddress = await registry.read.owner([namehash(normalise(domain))])
        setOnChainOwner(ownerAddress)
        setOwner(ownerAddress)
      } catch (e) {
        console.log(e)
      }
      try {
        const multisig = await getMultisig(ownerAddress)
        const memberManagerAddress = await multisig.read.entityMemberManager()
        setEntityMemberManager(memberManagerAddress)
        setMultisigAddress(ownerAddress)
      } catch (err) {
        console.log(err)
      }
    }
  }





  const getVerificationStatus = async (coinbaseIndexerContract: any, binanceContract: any, _ownerAddress: string): Promise<string> => {
    const passportApiKey = '5pj9ZGxE.mtiUDEnwYkvTpExwwYvaaF5of3qQ2OFD'
    const scorerId = '11196'
    //  _ownerAddress = "0xa4d5877767a2221f22f6d15254a0e951f1c40a7d"
    console.log("ownerAddress" + _ownerAddress)
    // Check GitCoin Passport

    // const passportResponse = await fetch(`https://api.passport.xyz/v2/stamps/${scorerId}/score/${_ownerAddress}`, {
    //   method: 'GET',
    //   headers: {
    //     'X-API-KEY': passportApiKey,
    //   },
    // })

    // const passportData = await passportResponse.json()
    const isGitcoinVerified = '0.00000' !== '0.00000'

    let attestationUid = zeroAddress
    try {
      attestationUid = await coinbaseIndexerContract.read.getAttestationUid([_ownerAddress as Address, contractAddresses.BaseSepoliaCoinbaseAccountVerifiedSchema])
    } catch (e) {
      console.log(e)
    }
    const isCoinbaseVerified = BigInt(attestationUid) !== 0n

    let balance = 0
    try {
      balance = await binanceContract.read.balanceOf([_ownerAddress as Address])
    } catch (e) {
      console.log(e)
    }
    const isBinanceVerified = balance !== 0

    // Construct verification status
    const statuses: string[] = []

    if (isGitcoinVerified) {
      statuses.push('GitCoin Passport')
    }
    if (isCoinbaseVerified) {
      statuses.push('Coinbase')
    }
    if (isBinanceVerified) {
      statuses.push('Binance')
    }

    if (statuses.length === 0) {
      return 'not verified'
    }

    return `verified on ${statuses.join(', ')}`
  }

  useProtectedRoute(
    '/',
    // When anything is loading, return true
    parentIsLoading
      ? true
      : // if is self, user must be connected
      (isSelf ? address : true) && typeof domain === 'string' && domain.length > 0,
  )

  const suffixIndex = domain?.split('.')?.length - 1
  const registrarKey = domain?.split('.')?.slice(1, suffixIndex)?.join('.')

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
          <title>{records?.entity__name}</title>
          <meta name="description" content={domain + ' RegistryChain'} />
          <meta property="og:title" content={domain} />
          <meta property="og:description" content={domain + ' RegistryChain'} />
          <meta property="twitter:title" content={domain} />
          <meta property="twitter:description" content={domain + ' RegistryChain'} />
        </Head>
        <Typography fontVariant="extraLargeBold" color="inherit">
          Entity {domain} is not registered on RegistryChain
        </Typography>
      </>
    )
  }

  let title = 'V3K'
  if (domain) {
    title = domain + ' on V3K'
  }

  let nameRecord = title
  if (Object.keys(records)?.length > 0) {
    nameRecord = records?.entity__name
    if (nameRecord) {
      title = nameRecord + ' on V3K'
    }
  }
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={title} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={domain} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={title} />
      </Head>
      {/* <SubgraphResults
        tokenAddresses={[records.address, records.entity__token__address]}
        onResults={() => setSubgraphResults([...subgraphResults])}
      /> */}
      {
        <Content noTitle={true} title={nameRecord} loading={parentIsLoading} copyValue={domain}>
          {{
            header: (
              <>
                <EntityViewTab
                  domainName={domain}
                  multisigAddress={multisigAddress}
                  records={{ ...records, subgraph: subgraphResults }}
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
              .with('entity', () => {
                if (loadingRecords)
                  return (
                    <Box>
                      <Spinner color="accent" size="medium" />
                    </Box>
                  )

                return (
                  <>
                    <RecordsSection
                      fields={records}
                      compareToOldValues={false}
                      domainName={domain}
                      owner={owner}
                      addressesObj={[
                        {
                          key: 'Agent Treasury',
                          value: records?.address || zeroAddress,
                        },
                        { key: `Owner Address ( ${verification} )`, value: owner }, // TODO: change placeholder address
                        {
                          key: 'Token Address',
                          value: records?.entity__token__address || zeroAddress,
                        },
                      ]}
                    />
                  </>
                )
              })
              .with('actions', () => {
                if (records) {
                  return (
                    <ActionsTab
                      refreshRecords={() => getRecords()}
                      registrar={records?.entity__registrar || 'public'}
                      claimEntity={claimEntity}
                      partners={records.partners}
                      onChainOwner={onChainOwner}
                      owner={owner}
                      multisigAddress={multisigAddress}
                      entityMemberManager={entityMemberManager}
                      client={publicClient}
                      name={domain}
                      makeAmendment={makeAmendment}
                      checkEntityStatus={() => checkEntityStatus()}
                      wallet={wallet}
                      setWallet={setWallet}
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
              .with('plugins', () => (
                <>
                  <PluginsTab
                    registrarType={registrarType}
                    name={normalise(domain)}
                    nameDetails={{}}
                    breakpoints={breakpoints}
                  />
                </>
              ))
              .with('regulatory', () => (
                <>
                  <RegulatoryTab
                    registrarType={registrarType}
                    domain={normalise(domain)}
                    setErrorMessage={setErrorMessage}
                    nameDetails={{}}
                    partners={records.partners}
                    breakpoints={breakpoints}
                    wallet={wallet}
                    setWallet={setWallet}
                  />
                </>
              ))
              .exhaustive(),
          }}
        </Content>
      }
    </>
  )
}

export default ProfileContent
