import { useEffect, useMemo, useState } from 'react'
import { FaStar } from 'react-icons/fa'
import styled from 'styled-components'
import { Address, createPublicClient, createWalletClient, custom, getContract, http } from 'viem'
import { sepolia } from 'viem/chains'
import { useAccount } from 'wagmi'

import { Button } from '@ensdomains/thorin'

import { getEntitiesList } from '@app/hooks/useExecuteWriteToResolver'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { infuraUrl } from '@app/utils/query/wagmi'
import { normalizeLabel } from '@app/utils/utils'

import contractAddressesObj from '../constants/contractAddresses.json'
import StarRating from './StarRating'
import AppPlaceholderImage from '@app/assets/app-2.svg'

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

// Breakpoints for responsive design
const breakpoints = {
  xs: '@media (max-width: 576px)', // Mobile breakpoint
}
// Styled components
const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
`

const Row = styled.div`
  display: flex;
  width: 100%;
  gap: 16px;
  margin-bottom: 16px;

  ${breakpoints.xs} {
    flex-direction: column;
    gap: 8px;
  }
`

const Box = styled.div<any>`
  flex: 1 1 calc(33.333% - 16px); // 3 boxes per row by default
  display: flex;
  cursor: pointer;
  align-items: center;
  background-color: ${({ isPlaceholder }: any) => (isPlaceholder ? 'transparent' : '#f0f0f0')};
  border-radius: 8px;
  padding: 16px;
  box-shadow: ${({ isPlaceholder }: any) =>
    isPlaceholder ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.1)'};
  visibility: ${({ isPlaceholder }: any) => (isPlaceholder ? 'hidden' : 'visible')};

  ${breakpoints.xs} {
    flex: 1 1 100%; // 1 box per row on mobile
  }

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    background-color: ${({ isPlaceholder }: any) => (isPlaceholder ? 'transparent' : '#f8f8f8')};
  }
`

const Index = styled.div`
  font-size: 24px;
  font-weight: bold;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: #333;
  color: white;
  border-radius: 50%;
`

const Image = styled.img`
  width: ${({ height }) => height}px;
  height: ${({ height }) => height}px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 16px;
`

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const Title = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
`

const Category = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
`

const Location = styled.div`
  font-size: 12px;
  color: #888;
`

const ImgContainer = styled.div<{ height: number }>`
  width: ${({ height }) => height}px;
  height: ${({ height }) => height}px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #666;
  `

// Box component
const ContentBox = ({
  onRate,
  index,
  rowHeight,
  imageUrl,
  agentName,
  agentDesc,
  rating,
  location,
  isPlaceholder,
}: any) => {
  const router = useRouterWithHistory()
  const [imgSrcValid, setImgSrcValid] = useState(true);

  return (
    <Box
      onClick={() => router.push('/agent/' + normalizeLabel(agentName) + '.ai.entity.id')}
      isPlaceholder={isPlaceholder}
    >
      {!isPlaceholder && (
        <>
          {imgSrcValid ? (
            <Image src={imageUrl} height={rowHeight - 32} alt="Placeholder" onError={() => setImgSrcValid(false)} />
          ) : <ImgContainer height={rowHeight - 32}><AppPlaceholderImage /></ImgContainer>}
          <TextContainer>
            <Title>{agentName}</Title>
            <Category>{agentDesc}</Category>
            <Location>{location}</Location>
            <div style={{ display: 'flex' }}>
              <FaStar
                key={index}
                style={{
                  fontSize: '17px',
                  margin: '0 2px',
                  color: 'rgb(231, 215, 71)',
                  transition: 'color 0.2s ease, transform 0.2s ease',
                }}
              />
              <span style={{ fontSize: '15px' }}>{rating.toFixed(2)}</span>
            </div>
          </TextContainer>
        </>
      )}
    </Box>
  )
}

// Main component
const BoxGrid = ({ rowHeight = 120, boxes, onRate }: any) => {
  // Calculate the number of rows needed
  const rows = []
  for (let i = 0; i < boxes.length; i += 3) {
    const rowBoxes = boxes.slice(i, i + 3)
    // Add placeholders if the row has less than 3 boxes
    while (rowBoxes.length < 3) {
      rowBoxes.push({ isPlaceholder: true })
    }
    rows.push(rowBoxes)
  }

  return (
    <Container>
      {rows.map((row, rowIndex) => (
        <Row key={rowIndex}>
          {row.map((box: any, boxIndex: any) => {
            return (
              <ContentBox
                key={boxIndex}
                onRate={(x: any) => onRate(box.address, x + 1)}
                index={rowIndex * 3 + boxIndex + 1}
                rowHeight={rowHeight}
                imageUrl={box.avatar}
                agentName={box.name}
                agentDesc={
                  box.description?.slice(0, 50) + (box.description?.length > 50 ? '...' : '')
                }
                location={box.location}
                rating={box.rating}
                isPlaceholder={box.isPlaceholder}
              />
            )
          })}
        </Row>
      ))}
    </Container>
  )
}

// Example usage
const Apps = () => {
  const [agents, setAgents] = useState([])
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

  const sendStars = async (to: any, amount: any) => {
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

  const repTokenBalance = async (addressesToCheck: any[]) => {
    const contract = {
      address: contractAddressesObj.starToken,
      abi: RepTokenABI,
    }

    const results = await publicClient.multicall({
      contracts: addressesToCheck.map((x) => ({
        ...contract,
        functionName: 'getSenderRatingsListForTarget',
        args: [x],
      })) as any[],
    })
    const addressToRate: any = {}
    results.forEach((x: any, idx: any) => {
      let ratingScore = 0
      x?.result?.[1]?.forEach((rating: any) => (ratingScore += Number(rating)))
      ratingScore /= x?.result?.[1]?.length
      addressToRate[addressesToCheck[idx]] = ratingScore / 1000000000000000000 || 0
    })
    return addressToRate
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

  const getAgents = async () => {
    const entities = await getEntitiesList({
      registrar: 'AI',
      nameSubstring: '',
      page: 0,
      sortDirection: 'desc',
      sortType: 'entity__formation__date',
    })

    const ratings = await repTokenBalance(entities.map((x: any) => x.address))

    const agentsToSet = entities.map((x: any) => ({ ...x, rating: ratings[x.address] }))
    setAgents(agentsToSet)
  }

  useEffect(() => {
    try {
      getAgents()
    } catch (err) { }
  }, [])

  return (
    <div>
      <BoxGrid boxes={agents} onRate={(addr: Address, val: any) => sendStars(addr, val)} />
    </div>
  )
}

export default Apps
