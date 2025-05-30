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
import { Spinner, Tooltip, Typography } from '@ensdomains/thorin'

import { useProtectedRoute } from '@app/hooks/useProtectedRoute'
import { ModalContext } from '@app/layouts/Basic'
import contractAddresses from '../../../../constants/contractAddresses.json'
import registrarsObj from '../../../../constants/registrars.json'
import ActionsTab from './tabs/ActionsTab/ActionsTab'
import { truncateEthAddress } from '@app/utils/truncateAddress'
import ReviewsPlaceholder from '@app/components/ReviewsPlaceholder'
import { HistoryBox } from '@app/components/HistoryBox'
import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import l1abi from '../../../../constants/l1abi.json'
import { useVerificationStatus } from '@app/hooks/useVerificationStatus'
import Coinbase from '../../../../assets/Coinbase.svg'
import EmailModal from '../EmailModal'
import { handleEmail, logFrontendError } from '@app/hooks/useExecuteWriteToResolver'
import DeveloperRegisterModal from '../DeveloperModal'
import MediaGallery from './MediaGallery'
import { ProfileSnippet } from '@app/components/ProfileSnippet'



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


// Styled components
const Section = styled.div`
  width: 100%;
  padding: 16px 0;
  border-bottom: 1px solid #E5E5E5;
`

const LabelRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  width: 100%;
  align-items: flex-start;
  justify-content: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const Label = styled.div`
  min-width: 200px;
  font-weight: 700;

  @media (max-width: 768px) {
    min-width: unset;
  }
`

const Content = styled.div`
  flex: 1;
  word-break: break-word;
  overflow-wrap: break-word;
`

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
  const { setIsAgentModalOpen, setAgentModalPrepopulate } = useContext<any>(ModalContext)
  const [recordsRequestPending, setRecordsRequestPending] = useState<any>(true)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showDevelopersModal, setShowDevelopersModal] = useState(false)
  const EMAIL_SUBMITTED_KEY = 'v3k_user_email_submitted'

  const [verifications, setVerifications] = useState<string[]>([])

  const { getVerificationStatus } = useVerificationStatus()

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

  const makeAmendment = async () => {
    const recordsToPopulate: any = {}
    Object.keys(records).forEach((field) => {
      recordsToPopulate[field] = records[field]
    })
    setAgentModalPrepopulate(recordsToPopulate)
    setIsAgentModalOpen(true)
  }

  // const checkOwnerIsMultisig = async () => {
  //   try {
  //     // Check if the address is a contract (EOAs have code size 0)
  //     const code = await publicClient.getBytecode({ address: onChainOwner });
  //     if (!code || code === '0x') return false; // It's an EOA

  //     // Try calling `getOwners()`, which only exists on Safe contracts
  //     const safeContract = getContract({
  //       address: onChainOwner,
  //       abi: l1abi,
  //       client: publicClient,
  //     });

  //     const owners: any = (await safeContract.read.getOwners()) || [];
  //     setMultisigAddress(onChainOwner)
  //     setMultisigOwners(owners)
  //   } catch (err: any) {
  //     console.log(err.message)
  //   }
  // }

  const getVerifications = async () => {
    const vers = await getVerificationStatus(owner)
    setVerifications(vers)
  }

  useEffect(() => {
    const hasSubmittedEmail = localStorage.getItem(EMAIL_SUBMITTED_KEY)
    const hasSubmittedEmailConnectedAddress = localStorage.getItem(EMAIL_SUBMITTED_KEY + '-' + address)

    if (!hasSubmittedEmail) {
      setShowEmailModal(true)
    }

    if (hasSubmittedEmail && !hasSubmittedEmailConnectedAddress && isAddress(address)) {
      pushEmailToList(hasSubmittedEmail)
    }
  }, [address])

  useEffect(() => {
    if (isAddress(owner) && owner !== zeroAddress) {
      getVerifications()
    }
  }, [owner])

  useEffect(() => {
    if (onChainOwner) {
      // checkOwnerIsMultisig()
    }
  }, [address, onChainOwner])


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


  useEffect(() => {
    if (records?.partners?.length === 0 && primary && !primary.data && address === owner) {
      setShowDevelopersModal(true)
    }
  }, [records, owner])

  useEffect(() => {
    try {
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
      logFrontendError({
        error: err,
        message: "2 - UseEffect in ProfileContent throw an error setting state from records",
        functionName: 'useEffect',
        address,
        args: { owner: records?.owner },
      });
    }
  }, [records, domain])

  const pushEmailToList = async (email: string) => {
    // Send email and connected account to DB
    localStorage.setItem(EMAIL_SUBMITTED_KEY + '-' + address, email)
    await handleEmail({ email, address })
    // direct/handleEmail/email=michaeltest@gmail.com&address=0x456.json
  }

  const getOwner = async (registry: any) => {
    if (domain) {
      let ownerAddress = zeroAddress
      try {
        ownerAddress = await registry.read.owner([namehash(normalise(domain))])
        setOnChainOwner(ownerAddress)
        if (owner === zeroAddress || ownerAddress !== zeroAddress) {
          setOwner(ownerAddress)
        }
      } catch (err) {
        console.log(err)
        await logFrontendError({
          error: err,
          message: "1 - Failed to read the owner of domain from the registry contract",
          functionName: 'getOwner',
          address,
          args: { address, ownerAddress, domain },
        });
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
    tabContent = (
      <>
        <Section>
          <div style={{ marginBottom: '16px' }}>
            <MediaGallery
              isOwner={owner === address as any}
              address={address}
              entityId={records.entityid}
              video={records.video}
              images={records.image || []}
              onUploadClick={() => console.log("open file input")}
            />
          </div>
          <Typography color="greyDim">{records.description}</Typography>
        </Section>

        {records["url"] ? <Section>
          <LabelRow>
            <Label>Website</Label>
            <Content><u><a href={records["url"]}>{records["url"]}</a></u></Content>
          </LabelRow>
        </Section> : null}

        {records["com.github"] ? <Section>
          <LabelRow>
            <Label>Github Repo</Label>
            <Content><u><a href={"https://github.com/" + records["com.github"]}>{records["com.github"]}</a></u></Content>
          </LabelRow>
        </Section> : null}

        {records["com.twitter"] ? <Section>
          <LabelRow>
            <Label>X (Twitter)</Label>
            <Content><u><a href={"https://x.com/" + records["com.twitter"]}>{records["com.twitter"]}</a></u></Content>
          </LabelRow>
        </Section> : null}

        {records["org.telegram"] ? <Section>
          <LabelRow>
            <Label>Telegram</Label>
            <Content><u><a href={"https://t.me/" + records["org.telegram"]}>{records["org.telegram"]}</a></u></Content>
          </LabelRow>
        </Section> : null}

        {records["com.youtube"] ? <Section>
          <LabelRow>
            <Label>Youtube Channel</Label>
            <Content><u><a href={"https://youtube.com/@" + records["com.youtube"]}>{records["com.youtube"]}</a></u></Content>
          </LabelRow>
        </Section> : null}

        {records["aiagent__entrypoint__url"] ? <Section>
          <LabelRow>
            <Label>API Endpoint</Label>
            <Content><u><a href={records["aiagent__entrypoint__url"]}>{records["aiagent__entrypoint__url"]}</a></u></Content>
          </LabelRow>
        </Section> : null}

        {records.keywords ? <Section>
          <LabelRow>
            <Label>Categories</Label>
            <Content>{records.keywords}</Content>
          </LabelRow>
        </Section> : null}
      </>
    )
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
      checkEntityStatus={() => null}
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
      {/* <EmailModal
        isOpen={showEmailModal && isAddress(address) && address !== zeroAddress}
        onClose={() => setShowEmailModal(false)}
        onSubmit={(email) => {
          console.log('Email submitted:', email)
          localStorage.setItem(EMAIL_SUBMITTED_KEY, email)

          pushEmailToList(email)
          setShowEmailModal(false)
        }}
      /> */}
      {/* <DeveloperRegisterModal
        isOpen={showDevelopersModal}
        onClose={() => setShowDevelopersModal(false)}
        wallet={wallet}
        domain={domain}
        partners={records.partners}
        setErrorMessage={setErrorMessage}
      /> */}

      {loadingRecords ? (
        null
      ) : (
        match(records).with(undefined, () => (
          <MessageContainer>
            Entity not found. Actions are available for entities with drafted or submitted data.
          </MessageContainer>
        )).otherwise(() => (
          <Box style={{ width: "85vw" }}>
            <Grid container spacing={8} maxWidth={"100%"} minHeight={'calc(100vh - 350px)'}>
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

                  <DetailsWrapper>
                    <ProfileSnippet
                      name={records?.name}
                      records={{ ...records, subgraph: subgraphResults }}
                      multisigAddress={multisigAddress}
                      status={status}
                      domainName={domain}
                      makeAmendment={makeAmendment}
                      owner={owner}
                    />
                  </DetailsWrapper>
                </Box>
                <Box py={2}>
                  <dl>
                    <Box py={1}>
                      <dt>
                        <Typography weight='bold'>Agent Type</Typography>
                      </dt>
                      <dd>
                        {records.category}
                      </dd>
                    </Box>
                    <Box py={1}>
                      <dt>
                        <Typography weight='bold'>Framework</Typography>
                      </dt>
                      <dd>
                        {records.aiagent__runtimeplatform}
                      </dd>
                    </Box>
                    <Box py={1}>
                      <dt>
                        <Typography weight='bold'>Tags</Typography>
                      </dt>
                      <dd>
                        {records.keywords}
                      </dd>
                    </Box>
                    {isAddress(records.token__utility) ? <Box py={1}>
                      <dt>
                        <Typography weight='bold'>Agent Token</Typography>
                      </dt>
                      {(
                        <Link title="tooltip" href={`https://etherscan.io/address/` + records.token__utility} target='_blank' style={{
                          textDecoration: 'none',
                        }}>
                          {truncateEthAddress(records.token__utility)}
                        </Link>
                      )}
                    </Box> : null}
                    <Box py={1}>
                      <dt>
                        <Typography weight='bold'>Developer</Typography>
                      </dt>
                      <dd style={{ display: "flex" }}>
                        {/* if owner has no primary, use addr and etherscan */}
                        {/* if owner has primary, link to dev profile and show */}
                        {primary?.data?.name ? (
                          <Link title="tooltip" href={`/developer/` + primary?.data?.name} target='_blank' style={{
                            textDecoration: 'none',
                          }}>
                            {primary?.data?.name}
                          </Link>
                        ) : (
                          <Link title="tooltip" href={`/developer/` + owner} target='_blank' style={{
                            textDecoration: 'none',
                          }}>
                            {truncateEthAddress(owner)}
                          </Link>
                        )}
                        {verifications.includes("Coinbase") ? <div style={{ marginLeft: "6px", marginTop: "2px" }}><Tooltip content={"Developer has Coinbase KYC attestation"}><div><Coinbase height={20} width={20} /></div></Tooltip></div> : null}

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


            <Box>
              {/* TODO: use reviews from the database */}
              {/* <ReviewsPlaceholder /> */}

              <StyledBox py={3}></StyledBox>

              <Grid container spacing={6} mb={2}>
              </Grid>
              <HistoryBox record={records} />

            </Box>
          </Box >)
        ))}

    </>
  )
}

export default ProfileContent
