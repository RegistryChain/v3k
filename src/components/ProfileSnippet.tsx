import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  Address,
  createPublicClient,
  createWalletClient,
  custom,
  getContract,
  http,
  isAddressEqual,
  namehash,
  zeroAddress,
} from 'viem'
import { sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'
import { useAccount } from 'wagmi'
import v3kLogo from '../assets/v3k_logo.png'

import { Button, mq, NametagSVG, Tag, Typography } from '@ensdomains/thorin'

import { ExclamationSymbol } from './ExclamationSymbol'
import StarRating from './StarRating'
import { useGetRating } from '@app/hooks/useGetRating'
import contractAddresses from '../constants/contractAddresses.json'

import { FaPencilAlt, FaTrashAlt } from 'react-icons/fa'
import { Link } from '@mui/material'
import { getContractInstance, getPrivyWalletClient, uploadIpfsImageSaveToResolver } from '@app/utils/utils'
import { useConnectOrCreateWallet, useLoginWithEmail, useWallets } from '@privy-io/react-auth'
import Image from 'next/image'
import { logFrontendError } from '@app/hooks/useExecuteWriteToResolver'
import { ErrorModal } from './ErrorModal'
import { SuccessModal } from './SuccessModal'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { useEthBalance } from '@app/hooks/useEthBalance'
import { infuraUrl } from '@app/utils/query/wagmi'

const ThumbnailWrapper = styled.div`
  position: relative;
  flex: 1;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;

  &:hover .overlay {
    opacity: 1;
  }
`

const Thumbnail = styled.img`
  width: 100%;
  height: 88px;
  object-fit: cover;
  display: block;
`

const ThumbnailOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  color: white;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`


const Container = styled.div<{}>(
  ({ theme }) => css`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 6px;
    flex-gap: ${theme.space['4']};
    margin-bottom: 12px;
  `,
)

const SectionTitleContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: ${theme.space['4']};
    flex-gap: ${theme.space['4']};
  `,
)

const SectionTitle = styled(Typography)(
  ({ theme }) => css`
    color: black;
  `,
)

// const Image = styled.img`
//   width: ${({ height }) => height}px;
//   height: ${({ height }) => height}px;
//   object-fit: cover;
//   border-radius: 8px;
//   margin-right: 16px;
// `

const NameRecord = styled(Typography)(
  ({ theme }) => css`
    color: black;
    margin-top: -${theme.space['0.5']};
  `,
)

export const getUserDefinedUrl = (url?: string) => {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return ``
}
interface ProfileSnippetProps {
  name: string
  multisigAddress: string
  records: any
  status?: string
  domainName?: string
  makeAmendment: any
  owner: Address
}

export const ProfileSnippet = ({
  name,
  multisigAddress,
  records,
  status,
  domainName,
  owner,
  makeAmendment
}: ProfileSnippetProps) => {
  const { t } = useTranslation('common')
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [avatarSrc, setAvatarSrc] = useState(v3kLogo.src)
  const [ratingSuccess, setRatingSuccess] = useState(false)
  const { ratings, recipientAverages, loading, fetchRatings } = useGetRating(namehash(domainName as string))

  const { wallets } = useWallets();      // Privy hook
  const address = useMemo(() => wallets[0]?.address, [wallets]) as Address
  const [errorMessage, setErrorMessage] = useState<string | null>("")
  const breakpoints = useBreakpoint()
  const { connectOrCreateWallet } = useConnectOrCreateWallet()
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )
  const isAdmin = useMemo(() => {
    if (address) {
      return isAddressEqual(address || zeroAddress, "0x1CA2b10c61D0d92f2096209385c6cB33E3691b5E") || isAddressEqual(address, "0xd873FaFd02351e6474906CD9233B454117b834DF") || isAddressEqual(address, "0x3Af9EB97d58212f0CF88B43Cf6f78434FEbbFCec") || isAddressEqual(address, "0xA72Ab9C4B2828aC2CB6c9C617D3e81BFEe23C0b6") || isAddressEqual(address, "0x761662d41f60A48Cf94af6f9e626D36963493767")
    }
    return false
  }, [address])


  const ethBalance = useEthBalance(address)

  const sendRating = async (stars: number) => {
    try {

    } catch (err) {
      console.log(err)
      await logFrontendError({
        error: err,
        message: "1 - issue adding ORIMMO tokens to wallet",
        functionName: 'addTokenToWallet',
        address,
        args: { address, orimmoContract: contractAddresses?.ORIMMO },
      });

    }
    try {
      if (!wallets || wallets.length === 0) {
        connectOrCreateWallet()
        return
      }
      const wallet = await getPrivyWalletClient(wallets.find(w => w.walletClientType === 'embedded') || wallets[0])
      const recipientHash = "0x" + records.nodehash.slice(-40)
      if (!ethBalance.balance || ethBalance.balance === "0") throw Error("Rating requires Sepolia gas! (for now)")
      const orimmoToken: any = getContractInstance(wallet, 'ORIMMO')
      try {
        const tx = await orimmoToken.write.transfer([recipientHash, stars + "000000000000000000"], { gas: 6000000n })
        const txRes = await publicClient?.waitForTransactionReceipt({
          hash: tx,
        })

        if (txRes.status === 'success') {
          // await fetchRatings()
          setRatingSuccess(true)
        }
      } catch (err: any) {
        setErrorMessage("Failed to rate: " + err.message)
        console.log(err, 'Failure')
      }

    } catch (err: any) {
      setErrorMessage(err.message)
      await logFrontendError({
        error: err,
        message: "2 - issue sending ORIMMO rating",
        functionName: 'addTokenToWallet',
        address,
        args: { address, nodehash: records.nodeHash, orimmoContract: contractAddresses?.ORIMMO },
      });
    }
  }

  let entityUnavailable = null
  if (records.length > 0) {
    entityUnavailable = (
      <NameRecord fontVariant="headingThree" data-testid="profile-snippet-nickname">
        Entity Not Found
      </NameRecord>
    )
  }

  let statusSection = null
  if (status) {
    statusSection = (
      <SectionTitleContainer>
        <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
          Entity Status:{' '}
          <span
            style={
              status === 'APPROVED' || status === 'ACTIVE'
                ? { color: 'rgb(56, 136, 255)' }
                : { color: '#e9d228' }
            }
          >
            {status}
          </span>
        </SectionTitle>
        {records.registrar?.oldValue !== 'public' &&
          records.sourceActive &&
          records.sourceActive === false ? (
          <ExclamationSymbol
            tooltipText={
              'This entity is not active according to the jurisdictional registrar source.'
            }
          />
        ) : null}
      </SectionTitleContainer>
    )
  }
  return (
    <>
      <ErrorModal
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
        breakpoints={breakpoints}
      />
      <SuccessModal
        open={ratingSuccess}
        message={"Rating was successful"}
        setMessage={async () => {
          setRatingSuccess(false)

          // wait 12 000 ms
          await new Promise((resolve) => setTimeout(resolve, 12_000))
          await fetchRatings()
        }}
        breakpoints={breakpoints}
      />
      <Container>
        {!multisigAddress && !name ? (
          entityUnavailable
        ) : (
          <>
            <div style={{ display: 'flex' }}>
              <div style={{ padding: "8px" }}>
                <ThumbnailWrapper>
                  <Image
                    alt={domainName || "Agent"}
                    onError={() => setAvatarSrc(v3kLogo.src)}
                    onLoad={() => setAvatarSrc(records.avatar)}
                    src={avatarSrc}
                    width={88}
                    height={88}
                    style={{ opacity: v3kLogo.src === avatarSrc ? .2 : 1, ...{ width: "100%", objectFit: "cover", display: "block" } }} />
                  {owner === address && (
                    <ThumbnailOverlay className="overlay">
                      <div style={{ cursor: "pointer", padding: "15px" }} onClick={() => {
                        avatarInputRef.current?.click()
                      }} >
                        <FaPencilAlt style={{ color: "gold" }} />
                      </div>
                      <input
                        type="file"
                        ref={avatarInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={async (e) => {
                          await uploadIpfsImageSaveToResolver(e.target.files?.[0] as any, "avatar", wallets, domainName as any)
                          window.location.reload()
                        }}
                      />
                    </ThumbnailOverlay>
                  )}
                </ThumbnailWrapper>
              </div>
              <div>
                <NameRecord fontVariant="headingThree" data-testid="profile-snippet-nickname">
                  <div style={{ display: "flex", gap: "5px" }}>
                    <span>{name}</span>
                    {owner === address || isAdmin ? <FaPencilAlt style={{ fontSize: "20px", cursor: "pointer" }} onClick={makeAmendment} /> : null}
                  </div>
                </NameRecord>
                {domainName && (
                  <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                    <Typography>
                      <Link target="_blank" href={'https://app.ens.domains/' + domainName}>
                        <i>{normalize(domainName)}</i>
                      </Link>
                    </Typography>
                  </SectionTitle>
                )}

                {/* {statusSection} */}

                <StarRating
                  rating={recipientAverages["0X" + namehash(domainName as string)?.toUpperCase()?.slice(-40)]}
                  onRate={(val: any) => sendRating(val)}
                />

              </div>
            </div>
          </>
        )}
      </Container></>
  )
}
