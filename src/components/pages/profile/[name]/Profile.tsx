import { Box, Grid2 as Grid, Link } from '@mui/material'
import Head from 'next/head'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
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

import { CheckmarkSymbol } from '@app/components/CheckmarkSymbol'

import { normalise } from '@ensdomains/ensjs/utils'
import { Spinner, Typography } from '@ensdomains/thorin'
import StarIcon from '@mui/icons-material/Star';
import StarHalfIcon from '@mui/icons-material/StarHalf';

import { useProtectedRoute } from '@app/hooks/useProtectedRoute'
import { ModalContext } from '@app/layouts/Basic'
import contractAddresses from '../../../../constants/contractAddresses.json'
import registrarsObj from '../../../../constants/registrars.json'
import ActionsTab from './tabs/ActionsTab/ActionsTab'
import EntityViewTab from './tabs/EntityViewTab'
import { useGetRating } from '@app/hooks/useGetRating'
import { truncateEthAddress } from '@app/utils/truncateAddress'
import ReviewsPlaceholder from '@app/components/ReviewsPlaceholder'
import { useEnsHistory } from '@app/hooks/useEnsHistory'
import { Outlink } from '@app/components/Outlink'
import { Card } from '@app/components/Card'
import { HistoryBox } from '@app/components/HistoryBox'
import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import l1abi from '../../../../constants/l1abi.json'


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


const VideoEmbed = ({ videoId = "" }: {
  videoId: string
}) => {
  const [isLoading, setIsLoading] = useState(false);
  // const [videoId, setVideoId] = useState(null);
  const API_KEY = "AIzaSyCMBV3jBclsfPq7ZDHqOfg59fJFU0cLRd8";

  useEffect(() => {
    const fetchVideo = async () => {
      // setIsLoading(true);
      // try {
      //   const response = await axios.get(
      //     `https://www.googleapis.com/youtube/v3/search`,
      //     {
      //       params: {
      //         part: "snippet",
      //         q: searchQuery,
      //         maxResults: 1,
      //         type: "video",
      //         key: API_KEY,
      //       },
      //     }
      //   );

      //   if (response.data.items.length > 0) {
      //     setVideoId(response.data.items[0].id.videoId);
      //   }
      // } catch (error) {
      //   console.error("Error fetching video:", error);
      // } finally {
      //   setIsLoading(false);
      // }
    };

    fetchVideo();
  }, []);

  if (isLoading) return <p>Loading video...</p>;
  if (!videoId) return null

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
  &::after {
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
  &::after {
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

const tabs = ['entity', 'actions', 'regulatory', 'plugins'] as const


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
  const [multisigOwners, setMultisigOwners] = useState<any[]>([])
  const [status, setStatus] = useState('')
  const [subgraphResults, setSubgraphResults] = useState<any>([])
  const [onChainOwner, setOnChainOwner] = useState(zeroAddress)
  const [tab, setTab] = useState("details")
  const { setIsModalOpen, setAgentModalPrepopulate } = useContext<any>(ModalContext)
  const [recordsRequestPending, setRecordsRequestPending] = useState<any>(true)
  const { rating, getRating } = useGetRating()
  const { history, fetchEnsHistory } = useEnsHistory()
  const [verification, setVerification] = useState<string | undefined>()
  const ref = useRef<HTMLDivElement>(null)

  const primary = usePrimaryName({ address: owner })

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

  const checkOwnerIsMultisig = async () => {
    try {
      // Check if the address is a contract (EOAs have code size 0)
      const code = await publicClient.getBytecode({ address: onChainOwner });
      if (!code || code === '0x') return false; // It's an EOA

      // Try calling `getOwners()`, which only exists on Safe contracts
      const safeContract = getContract({
        address: onChainOwner,
        abi: l1abi,
        client: publicClient,
      });

      const owners: any = (await safeContract.read.getOwners()) || [];
      setMultisigAddress(onChainOwner)
      setMultisigOwners(owners)
    } catch (err: any) {
      console.log(err.message)
    }
  }


  useEffect(() => {
    if (onChainOwner) {
      checkOwnerIsMultisig()
    }
  }, [address, onChainOwner])


  useEffect(() => {
    fetchEnsHistory(namehash(domain))
  }, [])

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
    getOwner(registry)
  }, [publicClient, domain])

  useEffect(() => {
    if (domain) {
      setRecordsRequestPending(true)
      getRecords()
    }
  }, [domain])


  const checkEntityStatus = async () => {
    // const multisig: any = await getMultisig(multisigAddress)

    // const multisigState: any = getContract({
    //   address: contractAddresses.MultisigState as Address,
    //   abi: parseAbi(['function entityToTransactionNonce(address) view returns (uint256)']),
    //   client: publicClient,
    // })

    // try {
    //   const localApproval = await multisig.read.localApproval()
    //   const operationApprovedByRegistrar = await multisig.read.checkEntityOperational([])
    //   // if localApproval is false and txNonce = 1, drafted
    //   let status = 'DRAFT'
    //   if (localApproval && operationApprovedByRegistrar) {
    //     status = 'APPROVED'
    //   } else if (localApproval) {
    //     status = 'SUBMITTED'
    //   }
    //   setStatus(status)
    //   setRecords((prev: { [x: string]: any }) => ({
    //     ...prev,
    //     status,
    //   }))
    // } catch (e) { }
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

  const getOwner = async (registry: any) => {
    if (domain) {
      let ownerAddress = zeroAddress
      try {
        ownerAddress = await registry.read.owner([namehash(normalise(domain))])
        setOnChainOwner(ownerAddress)
        if (owner === zeroAddress || ownerAddress !== zeroAddress) {
          setOwner(ownerAddress)
        }
      } catch (e) {
        console.log(e)
      }
    }
  }





  const getVerificationStatus = async (coinbaseIndexerContract: any, binanceContract: any, _ownerAddress: string): Promise<string> => {
    // _ownerAddress = "0xa4d5877767a2221f22f6d15254a0e951f1c40a7d"
    console.log("ownerAddress" + _ownerAddress)
    // Check GitCoin Passport

    // const passportResponse = await fetch(`https://api.passport.xyz/v2/stamps/${process.env.NEXT_PUBLIC_SCORE_ID_API_KEY}/score/${_ownerAddress}`, {
    //   method: 'GET',
    //   headers: {
    //     'X-API-KEY': process.env.NEXT_PUBLIC_PASSPORT_API_KEY,
    //   },
    // })

    // const passportData = await passportResponse.json()
    const isGitcoinVerified = false
    //'0.00000' !== '0.00000'

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
          <title>{records?.name}</title>
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
    nameRecord = records?.name
    if (nameRecord) {
      title = nameRecord + ' on V3K'
    }
  }

  let tabContent: any = null
  if (tab === "details") {
    tabContent = <>
      <Box
        py={2}
        style={{ borderBottom: '1px solid #E5E5E5' }}>
        <Box py={1} mb={2}>
          <VideoEmbed videoId={records.video} />
        </Box>
        <Typography color="greyDim">{records.description}</Typography>
      </Box>
      <Box
        display='flex'
        gap={2}
        py={2} style={{
          borderBottom: '1px solid #E5E5E5',
        }}>
        <Box minWidth={200}>
          <Typography weight='bold'>Capabilities</Typography>
        </Box>
        <Box>
          <ul>
            <li>iOS</li>
            <li>Android</li>
            <li>Desktop</li>
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
          <Typography>{records.keywords}</Typography>
        </Box>
      </Box></>
  } else if (tab === "actions" && records && domain && address) {
    tabContent = <ActionsTab
      refreshRecords={getRecords}
      registrar={records?.registrar || 'public'}
      claimEntity={claimEntity}
      partners={records.partners}
      onChainOwner={onChainOwner}
      owner={owner}
      multisigAddress={multisigAddress}
      entityMemberManager={zeroAddress}
      client={publicClient}
      name={domain}
      makeAmendment={makeAmendment}
      checkEntityStatus={() => checkEntityStatus()}
      wallet={wallet}
      setWallet={setWallet}
    />
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
        tokenAddresses={[records.address, records.token__utility]}
        onResults={() => setSubgraphResults([...subgraphResults])}
      /> */}

      {loadingRecords ? (
        <Grid size={12} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} minHeight='50vh'>
          <Spinner color="accent" size="medium" />
        </Grid>
      ) : (
        match(records).with(undefined, () => (
          <MessageContainer>
            Entity not found. Actions are available for entities with drafted or submitted data.
          </MessageContainer>
        )).otherwise(() => (
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
                    owner={owner}
                    makeAmendment={makeAmendment}
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
                        {records.keywords}
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
                        {/* if owner has no primary, use addr and etherscan */}
                        {/* if owner has primary, link to dev profile and show */}
                        {owner ? (
                          <Link title="tooltip" href={`/developer/` + owner} target='_blank' style={{
                            textDecoration: 'none',
                          }}>
                            {primary?.data?.name ?? truncateEthAddress(owner)}
                          </Link>
                        ) : null}
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
                  {owner === address || multisigAddress && (multisigOwners.includes(address)) ?
                    <Box display='flex'>
                      <div onClick={() => setTab("details")} style={tab === "details" ? { borderBottom: "black 1px solid", marginRight: "16px" } : { marginRight: "16px", cursor: "pointer" }}><span>Details</span></div>
                      <div onClick={() => setTab("actions")} style={tab === "actions" ? { borderBottom: "black 1px solid" } : { cursor: "pointer" }}><span>Actions</span></div>
                    </Box> : null
                  }
                  {tabContent}


                </Box>
              </Grid>
            </Grid>

            <BgBox py={3}>
              <Box style={{ position: 'relative', zIndex: 1 }}>
                <Typography>
                  {records.name} is a {records.keywords} agent on the {records.aiagent__runtimeplatform} platform. It is an agent with the following features:
                </Typography>
                {/* <Box py={2}>
                  <ul>
                    <li>Feature 1</li>
                    <li>Feature 2</li>
                    <li>Feature 3</li>
                  </ul>
                </Box> */}
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
                        <Link href={records.url} target='_blank'>
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
                      <Typography weight='bold'>Registrar</Typography>
                    </Box>
                    <Box>
                      <Typography>{records.registrar}</Typography>
                    </Box>
                  </Box>

                  <Box
                    display='flex'
                    gap={2}
                    py={2}
                    style={{
                      borderBottom: '1px solid #E5E5E5',
                    }}>
                    <Box minWidth={200}>
                      <Typography weight='bold'>Agent token address</Typography>
                    </Box>
                    <Box>
                      {/* TODO: add real categories */}
                      <Typography>{records.token__utility}</Typography>
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
                    <Box display={'flex'} gap={0.5}>
                      {verification !== 'not verified' ? <CheckmarkSymbol tooltipText={verification} /> : null}
                      <Typography>
                        {owner}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <HistoryBox record={records} />
              </Grid>

            </Box>
          </Box >)
        ))}

    </>
  )
}

export default ProfileContent
