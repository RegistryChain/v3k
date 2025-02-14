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

import { infuraUrl } from '@app/utils/query/wagmi'

import contractAddressesObj from '../constants/contractAddresses.json'
import { ExclamationSymbol } from './ExclamationSymbol'
import StarRating from './StarRating'

const RepTokenABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'target',
        type: 'address',
      },
    ],
    name: 'getSenderRatingsListForTarget',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]',
      },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'transfer',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const BasicABI = [
  {
    inputs: [],
    name: 'mintFromFaucet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    name: 'faucetMinted',
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

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

export const ProfileSnippet = ({
  name,
  multisigAddress,
  records,
  status,
  domainName,
  children,
}: any) => {
  const { t } = useTranslation('common')

  const [rating, setRating] = useState<any>(0)
  const { address } = useAccount()

  const [wallet, setWallet] = useState<any>(null)

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )

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

  const getRating = async () => {
    const rate = await repTokenBalance(records.address.setValue)
    setRating(rate)
  }

  const mintOrimmoTokens = async () => {
    if (address && wallet) {
      try {
        const orimmoController: any = getContract({
          abi: BasicABI,
          address: contractAddressesObj.orimmoController as Address,
          client: wallet,
        })

        const tx = await orimmoController.write.mintFromFaucet([])
        const txReceipt = await publicClient?.waitForTransactionReceipt({
          hash: tx,
        })
      } catch (err) {
        console.log('mint err', err)
      }
    }
  }

  const sendStars = async (to: any, amount: any) => {
    console.log(address, to)
    try {
      const contract: any = getContract({
        address: contractAddressesObj.starToken as Address,
        abi: RepTokenABI,
        client: wallet,
      })

      const bal = await contract.read.balanceOf([address])
      console.log('user balance', address, bal)
      if (bal === 0n) {
        await mintOrimmoTokens()
      }

      const tx = await contract.write.transfer([to, amount * 10 ** 18])
      await publicClient?.waitForTransactionReceipt({
        hash: tx,
      })
    } catch (err) {
      console.log('error sending stars', err)
    }
    return
  }

  const repTokenBalance = async (addressToCheck: any) => {
    const contract = getContract({
      address: contractAddressesObj.starToken as any,
      abi: RepTokenABI,
      client: publicClient,
    })

    const result: any = await contract.read.getSenderRatingsListForTarget([addressToCheck])
    let ratingScore = 0
    result?.[1]?.forEach((rating: any) => (ratingScore += Number(rating)))
    ratingScore /= result?.[1]?.length
    ratingScore = ratingScore / 1000000000000000000 || 0
    console.log(ratingScore)
    return ratingScore
  }

  useEffect(() => {
    if (records?.address?.setValue) {
      console.log(records)
      getRating()
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
        records.sourceActive?.setValue === false ? (
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
            <Image src={records.avatar.setValue} alt="e" height={88} />
            <div>
              <NameRecord fontVariant="headingTwo" data-testid="profile-snippet-nickname">
                {name}
              </NameRecord>
              <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                <Typography>
                  <a href={'https://app.ens.domains/' + domainName}>
                    <i>{normalize(domainName)}</i>
                  </a>
                </Typography>
              </SectionTitle>
              {/* {statusSection} */}
              <StarRating
                rating={rating}
                onRate={(val: any) => sendStars(records?.address?.setValue || zeroAddress, val + 1)}
              />
            </div>
          </div>
        </>
      )}
    </Container>
  )
}
