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
import { getContractInstance, uploadIpfsImageSaveToResolver } from '@app/utils/utils'
import { CachedImage } from '@app/hooks/CachedImage'
import { useWallets } from '@privy-io/react-auth'

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

const Image = styled.img`
  width: ${({ height }) => height}px;
  height: ${({ height }) => height}px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 16px;
`

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

  const { ratings, recipientAverages, loading } = useGetRating(namehash(domainName as string))

  const sendRating = async (stars: number) => {
    try {
      const LOCAL_STORAGE_KEY = 'orimmo_token_added-' + address;

      if (localStorage.getItem(LOCAL_STORAGE_KEY) !== 'true') {
        const wasAdded = await window.ethereum?.request({
          method: 'wallet_watchAsset',
          params: {
            type: 'ERC20',
            options: {
              address: contractAddresses.ORIMMO,
              symbol: 'OR',
              decimals: 18,

            },
          },
        });
        if (wasAdded) {
          localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
        }
      }

    } catch (err) {
      console.log(err)
    }
    try {
      const recipientHash = "0x" + records.nodehash.slice(-40)
      const orimmoToken: any = getContractInstance(wallet, 'ORIMMO')
      const txHash = await orimmoToken.write.transfer([recipientHash, stars + "000000000000000000"])
    } catch (err) {
      console.log(err)
    }
  }

  const { wallets } = useWallets();      // Privy hook
  const address = useMemo(() => wallets[0]?.address, [wallets]) as Address

  const [wallet, setWallet] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum && !wallet) {
      const newWallet = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum, {
          retryCount: 0,
        }),
        account: address,
      })
      setWallet(newWallet)
    } else {
      console.error('Ethereum object not found on window')
    }
  }, [address])


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
    <Container>
      {!multisigAddress && !name ? (
        entityUnavailable
      ) : (
        <>
          <div style={{ display: 'flex' }}>
            <div style={{ padding: "8px" }}>
              <ThumbnailWrapper>
                <Thumbnail src={records.avatar ? records.avatar : v3kLogo} />
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
                  {owner === address ? <FaPencilAlt style={{ fontSize: "20px", cursor: "pointer" }} onClick={makeAmendment} /> : null}
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
    </Container>
  )
}
