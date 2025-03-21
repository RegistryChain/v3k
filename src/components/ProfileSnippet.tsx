import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  Address,
  createPublicClient,
  createWalletClient,
  custom,
  getContract,
  http,
  zeroAddress,
} from 'viem'
import { sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'
import { useAccount } from 'wagmi'

import { Button, mq, NametagSVG, Tag, Typography } from '@ensdomains/thorin'

import { ExclamationSymbol } from './ExclamationSymbol'
import StarRating from './StarRating'
import { useGetRating } from '@app/hooks/useGetRating'
import { FaPencilAlt } from 'react-icons/fa'
import { Link } from '@mui/material'

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
  withRating?: boolean
  makeAmendment: any
  owner: Address
}

export const ProfileSnippet = ({
  name,
  multisigAddress,
  records,
  status,
  domainName,
  withRating = true,
  owner,
  makeAmendment
}: ProfileSnippetProps) => {
  const { t } = useTranslation('common')

  const { rating, getRating, sendStars } = useGetRating()

  const { address } = useAccount()

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

  useEffect(() => {
    if (records?.address) {
      getRating(records?.addres)
    }
  }, [records])

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
        {records.entity__registrar?.oldValue !== 'public' &&
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
            <Image src={records.avatar} alt="e" height={88} />
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

              {withRating && (
                <StarRating
                  rating={rating}
                  onRate={(val: any) => sendStars(records?.address, records?.address || zeroAddress, val + 1, wallet)}
                />
              )}

            </div>
          </div>
        </>
      )}
    </Container>
  )
}
