import { Box, Grid2 as Grid, Link } from '@mui/material'
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
import { sepolia } from 'viem/chains'

import { normalise } from '@ensdomains/ensjs/utils'
import { Banner, CheckCircleSVG, Spinner, Typography } from '@ensdomains/thorin'
import StarIcon from '@mui/icons-material/Star';
import StarHalfIcon from '@mui/icons-material/StarHalf';

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
import StarRating from '@app/components/StarRating'
import { useGetRating } from '@app/hooks/useGetRating'
import { ST } from 'next/dist/shared/lib/utils'
import { truncateEthAddress } from '@app/utils/truncateAddress'
import axios from "axios";
import ReviewsPlaceholder from '@app/components/ReviewsPlaceholder'
import G from 'glob'


const VideoContainer = styled.div`
  width: 100%;
  height: 50vh;
  overflow: hidden;
  position: relative;
  background: #000;
  border-radius: 16px;
`;

const Iframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

// If we want to use youtube API key, we need to increase the quotas for the project

// AIzaSyCMBV3jBclsfPq7ZDHqOfg59fJFU0cLRd8
// AIzaSyBbOljkviE9BZD9KNSyh4QD2EIvUNem3is


const VideoEmbed = ({ searchQuery = "" }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [videoId, setVideoId] = useState(null);
  const API_KEY = "AIzaSyBbOljkviE9BZD9KNSyh4QD2EIvUNem3is";

  useEffect(() => {
    const fetchVideo = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/search`,
          {
            params: {
              part: "snippet",
              q: searchQuery,
              maxResults: 1,
              type: "video",
              key: API_KEY,
            },
          }
        );

        if (response.data.items.length > 0) {
          setVideoId(response.data.items[0].id.videoId);
        }
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideo();
  }, [searchQuery]);

  if (isLoading) return <p>Loading video...</p>;
  if (!videoId) return <p>No video for this agent was found</p>;

  return (
    <VideoContainer>
      <Iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        allowFullScreen
      ></Iframe>
    </VideoContainer>
  );
};

const BgBox = styled(Box)`
  position: relative;
  margin-bottom: 46px;
  &:after {
    content: '';
    top: 0;
    left: -50vw;
    right: -50vw;
    height: 100%;
    position: absolute;
    background-color: #fafafa;
  }
  `


const StyledBox = styled(Box)`
  position: relative;
  margin-bottom: 46px;
  &:after {
    content: '';
    top: 0;
    left: -50vw;
    right: -50vw;
    height: 100%;
    position: absolute;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #f3f3f3 100%);
  }
`;

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
  const { rating, getRating } = useGetRating()

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

  const makeAmendment = async () => {
    const recordsToPopulate: any = {}
    Object.keys(records).forEach((field) => {
      recordsToPopulate[field] = records[field]
    })
    setAgentModalPrepopulate(recordsToPopulate)
    setIsModalOpen(true)
  }

  useEffect(() => {
    if (records?.address) {
      getRating(records?.address)
    }
  }, [records])

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
      if (
        isAddress(records?.owner) &&
        records?.owner !== zeroAddress &&
        (!owner || owner === zeroAddress)
      ) {
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

      {loadingRecords ? (
        <Grid size={12} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} minHeight='50vh'>
          <Spinner color="accent" size="medium" />
        </Grid>
      ) : (
        records ? (
          <Box>
            <Grid container spacing={8} minHeight={'calc(100vh - 350px)'}>
              {/* Sidebar */}
              <Grid
                size={{
                  xs: 12,
                  sm: 4
                }}
                style={{
                  position: 'sticky',
                  top: '100px',
                  alignSelf: 'flex-start',
                }}>
                <Box
                  style={{
                    borderBottom: '1px solid #E5E5E5',
                  }} py={2}>
                  <EntityViewTab
                    domainName={domain}
                    multisigAddress={multisigAddress}
                    records={{ ...records, subgraph: subgraphResults }}
                    status={status}
                    withRating={false}
                  />
                </Box>
                <Box py={2}>
                  <dl>
                    <Box py={1}>
                      <dt>
                        <Typography weight='bold'>Pricing</Typography>
                      </dt>
                      <dd>
                        Free to install. Additional charges may apply.
                      </dd>
                    </Box>
                    <Box py={1}>
                      <dt>
                        <Typography weight='bold'>Agent type</Typography>
                      </dt>
                      <dd>
                        {records.entity__type}
                      </dd>
                    </Box>
                    <Box py={1}>
                      <dt>
                        <Typography weight='bold'>Rating</Typography>
                      </dt>
                      <dd style={{ display: 'flex', alignItems: 'center' }}>
                        {rating.toFixed(2)}&nbsp;
                        {
                          rating > 4 ? (<StarIcon style={{ fontSize: '15px' }} />) : (
                            <StarHalfIcon style={{ fontSize: '15px' }} />
                          )
                        }
                      </dd>
                    </Box>
                    <Box py={1}>
                      <dt>
                        <Typography weight='bold'>Developer</Typography>
                      </dt>
                      <dd>
                        {records.address && (
                          <Link title="tooltip" href={`https://etherscan.io/address/${records.address}`} target='_blank' style={{
                            textDecoration: 'none',
                          }}>
                            {truncateEthAddress(records.address)}
                          </Link>
                        )}
                      </dd>
                    </Box>
                  </dl>
                </Box>
              </Grid>

              {/* Main Content */}
              <Grid
                size={{ xs: 12, sm: 7 }}
                container
                spacing={6}>
                <Box py={2}>
                  <Box
                    py={2}
                    style={{ borderBottom: '1px solid #E5E5E5' }}>
                    <Box py={1} mb={2}>
                      <VideoEmbed searchQuery={nameRecord} />
                    </Box>
                    <Typography color="greyDim">{records.description}</Typography>
                    {records.entity__purpose}

                  </Box>

                  <Box
                    display='flex'
                    gap={2}
                    py={2} style={{
                      borderBottom: '1px solid #E5E5E5',
                    }}>
                    <Box minWidth={200}>
                      <Typography weight='bold'>Features</Typography>
                    </Box>
                    <Box>
                      <ul>
                        <li>Feature 1</li>
                        <li>Feature 2</li>
                        <li>Feature 3</li>
                      </ul>
                    </Box>
                  </Box>

                  <Box
                    display='flex'
                    gap={2}
                    py={2} style={{
                      borderBottom: '1px solid #E5E5E5',
                    }}>
                    <Box minWidth={200}>
                      <Typography weight='bold'>Languages</Typography>
                    </Box>
                    <Box>
                      <Typography>English</Typography>
                    </Box>
                  </Box>

                  <Box
                    display='flex'
                    gap={2}
                    py={2} style={{
                      borderBottom: '1px solid #E5E5E5',
                    }}>
                    <Box minWidth={200}>
                      <Typography weight='bold'>Categories</Typography>
                    </Box>
                    <Box>
                      {/* TODO: add real categories */}
                      <Typography>{records.entity__type}, {records.entity__platform}</Typography>
                    </Box>
                  </Box>

                  <Box
                    display='flex'
                    gap={2}
                    py={2}>
                    <Box minWidth={200}>
                      <Typography weight='bold'>Agent token address</Typography>
                    </Box>
                    <Box>
                      {/* TODO: add real categories */}
                      <Typography>{records.entity__token__address}</Typography>
                    </Box>
                  </Box>

                </Box>
              </Grid>
            </Grid>

            <BgBox py={3}>
              <Box style={{ position: 'relative', zIndex: 1 }}>
                <Typography>
                  {records.entity__name} is a {records.entity__type} agent on the {records.entity__platform} platform. It is a {records.entity__purpose} agent with the following features:
                </Typography>
                <Box py={2}>
                  <ul>
                    <li>Feature 1</li>
                    <li>Feature 2</li>
                    <li>Feature 3</li>
                  </ul>
                </Box>
              </Box>
            </BgBox>

            <Box>
              {/* TODO: use reviews from the database */}
              <ReviewsPlaceholder />

              <StyledBox py={3}></StyledBox>

              <Grid container spacing={6} mb={2}>
                <Grid size={{
                  xs: 12,
                  sm: 4
                }}>
                  <Box py={2}>
                    <Typography weight='bold'>Additional Information</Typography>
                  </Box>
                </Grid>

                <Grid size={{
                  xs: 12,
                  sm: 6
                }}>
                  <Box
                    display='flex'
                    gap={2}
                    py={2} style={{
                      borderBottom: '1px solid #E5E5E5',
                    }}>
                    <Box minWidth={200}>
                      <Typography weight='bold'>Agent endpoint</Typography>
                    </Box>
                    <Box>
                      <Typography>
                        <Link href={records.entity__endpoint} target='_blank'>
                          Link to agent
                        </Link>
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    display='flex'
                    gap={2}
                    py={2} style={{
                      borderBottom: '1px solid #E5E5E5',
                    }}>
                    <Box minWidth={200}>
                      <Typography weight='bold'>Agent code</Typography>
                    </Box>
                    <Box>

                      <Typography>{records.entity__code}</Typography>
                    </Box>
                  </Box>

                  <Box
                    display='flex'
                    gap={2}
                    py={2} style={{
                      borderBottom: '1px solid #E5E5E5',
                    }}>
                    <Box minWidth={200}>
                      <Typography weight='bold'>Registrar</Typography>
                    </Box>
                    <Box>
                      <Typography>{records.entity__registrar}</Typography>
                    </Box>
                  </Box>
                  <Box
                    display='flex'
                    gap={2}
                    py={2} style={{
                      borderBottom: '1px solid #E5E5E5',
                    }}>
                    <Box minWidth={200}>
                      <Typography weight='bold'>Owner address</Typography>
                    </Box>
                    <Box>
                      <Typography>{records.owner}</Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/*TODO: Possible actions, double check what should be displayed for owner only */}
              <Grid container spacing={6}>
                <Grid size={{
                  xs: 12,
                  sm: 4
                }}>
                  <Box py={2}>
                    <Typography weight='bold'>Actions</Typography>
                  </Box>

                </Grid>
                <Grid size={{
                  xs: 12,
                  sm: 7
                }}>
                  {domain && records ? (
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
                  ) : null}
                </Grid>
              </Grid>
            </Box>
          </Box >) : (
          <MessageContainer>
            Entity not found. Actions are available for entities with drafted or submitted data.
          </MessageContainer>
        )
      )}

      {/* <Content noTitle={true} title={nameRecord} loading={parentIsLoading} copyValue={domain}>
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
                      { key: 'Owner Address', value: owner }, // TODO: change placeholder address
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
      </Content> */}
    </>
  )
}

export default ProfileContent
