import React, { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import {
  Address,
  createPublicClient,
  createWalletClient,
  custom,
  encodeAbiParameters,
  getContract,
  http,
  isAddressEqual,
  labelhash,
  namehash,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem'
import { sepolia } from 'viem/chains'
import { normalize, packetToBytes } from 'viem/ens'
import { useAccount } from 'wagmi'

import { Button } from '@ensdomains/thorin'

import { checkOwner } from '@app/hooks/useCheckOwner'
import { executeWriteToResolver } from '@app/hooks/useExecuteWriteToResolver'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { infuraUrl } from '@app/utils/query/wagmi'

import contractAddressesObj from '../constants/contractAddresses.json'
import l1abi from '../constants/l1abi.json'

// Styled components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); // Semi-transparent black overlay
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; // Ensure it's above other content
`

const ModalContent = styled.div<any>`
  position: relative;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  padding: 24px;
  width: ${({ isExpanded }) =>
    isExpanded ? '90%' : '60%'}; // 60% width by default, 90% when expanded
  max-height: ${({ isExpanded }) =>
    isExpanded ? '90%' : '50%'}; // 50% height by default, 90% when expanded
  overflow-y: auto; // Scrollable content if it overflows
  transition:
    width 0.3s ease,
    max-height 0.3s ease;

  @media (max-width: 768px) {
    width: 90%; // More width on smaller screens
    max-height: 80%; // More height on smaller screens
  }
`

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #333;

  &:hover {
    color: #000;
  }
`

const InputGroup = styled.div`
  margin-bottom: 16px;
  text-align: center;
`

const Label = styled.label`
  font-size: 16px;
  font-weight: bold;
  display: block;
  padding: 2px;
  width: 68%;
  margin: 0 auto;

  text-align: left;
`

const Input = styled.input`
  width: 68%;

  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  margin: 0 auto;
  display: block;
`

const TextArea = styled.textarea`
  width: 68%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  margin: 0 auto;
  display: block;
  resize: vertical;
`

const Select = styled.select`
  width: 68%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  margin: 0 auto;
  display: block;
`

const AdvancedSection = styled.div`
  margin: 18px 0;
  padding-top: 16px;
  border-top: 1px solid #eee;
`

const AdvancedHeader = styled.div<any>`
  font-size: 14px;
  color: #666;
  cursor: pointer;
  text-align: center;
  margin-bottom: ${({ isExpanded }: any) => (isExpanded ? '16px' : '0')};
  transition: margin-bottom 0.3s ease;

  &:hover {
    color: #333;
  }
`

// PopupModal component
const DeployerModal = ({ isOpen, onClose }: any) => {
  const contractAddresses: any = contractAddressesObj
  const tld = 'entity.id'
  const modalRef = useRef(null)
  const { address } = useAccount()
  const router = useRouterWithHistory()

  const [isExpanded, setIsExpanded] = useState(false)

  // State for input fields
  const [name, setName] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [category, setCategory] = useState('')
  const [platform, setPlatform] = useState('')
  const [description, setDescription] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [tokenAddress, setTokenAddress] = useState('')
  const [telegramHandle, setTelegramHandle] = useState('')
  const [actionStep, setActionStep] = useState(0)
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

  // Close modal when clicking outside of it
  const handleClickOutside = (event: any) => {
    const cur: any = modalRef.current
    if (modalRef.current && !cur.contains(event.target)) {
      onClose()
    }
  }

  const advance = async () => {
    const entityRegistrarDomain = name + '.ai.' + tld

    if (actionStep === 0) {
      try {
        console.log(entityRegistrarDomain)
        let currentEntityOwner = await checkOwner(publicClient, namehash(entityRegistrarDomain))
        //register name
        const registrarContract: any = getContract({
          abi: [
            {
              inputs: [
                {
                  internalType: 'bytes32',
                  name: '',
                  type: 'bytes32',
                },
                {
                  internalType: 'address',
                  name: '',
                  type: 'address',
                },
              ],
              name: 'registerEntity',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          address: contractAddresses['ai.' + tld],
          client: wallet,
        })

        // If there is no owner to the domain, make the register. If there is an owner skip register
        console.log(currentEntityOwner)
        if (!currentEntityOwner || currentEntityOwner === zeroAddress) {
          const tx = await registrarContract.write.registerEntity([
            labelhash(normalize(name)),
            address,
          ])
          const txReceipt = await publicClient?.waitForTransactionReceipt({
            hash: tx,
          })
          if (txReceipt?.status === 'reverted') {
            throw Error('Transaction failed - contract error')
          } else {
            currentEntityOwner = contractAddresses['ai.' + tld]
          }
        }
        setActionStep(1)
      } catch (err) {
        console.log(err, 'error in registering entity name')
      }
    } else if (actionStep === 1) {
      // send signature  and data to resolver
      // Should check if EITHER public reg is the domain owner OR connect addr is owner and has approved
      // If false, prevent the registration
      try {
        let currentEntityOwner = await checkOwner(publicClient, namehash(entityRegistrarDomain))
        const texts: any[] = [
          { key: 'entity__name', value: name },
          { key: 'entity__image', value: imageUrl },
          { key: 'entity__type', value: category },
          { key: 'entity__registrar', value: 'AI' },
          { key: 'entity__code', value: '0002' },
        ]

        if (isExpanded) {
          if (platform) {
            texts.push({ key: 'entity__platform', value: platform })
          }
          if (description) {
            texts.push({ key: 'entity__description', value: description })
          }
          if (twitterHandle) {
            texts.push({ key: 'entity__twitter', value: twitterHandle })
          }
          if (tokenAddress) {
            texts.push({ key: 'entity__token__address', value: tokenAddress })
          }
          if (telegramHandle) {
            texts.push({ key: 'entity__telegram', value: telegramHandle })
          }
        }

        if (
          !isAddressEqual(currentEntityOwner, address as Address) &&
          !isAddressEqual(currentEntityOwner, contractAddresses['ai.' + tld])
        ) {
          throw Error('The user does not have permission to deploy contracts for this domain')
        }

        const constitutionData = texts.map((x) =>
          encodeAbiParameters([{ type: 'string' }, { type: 'string' }], [x.key, x.value]),
        )

        const formationPrep: any = {
          functionName: 'register',
          args: [
            toHex(packetToBytes(name)),
            address,
            0 /* duration */,
            zeroHash /* secret */,
            zeroAddress /* resolver */,
            constitutionData /* data */,
            false /* reverseRecord */,
            0 /* fuses */,
            zeroHash /* extraData */,
          ],
          abi: l1abi,
          address: contractAddresses['DatabaseResolver'],
        }

        const formationCallback: any = {
          functionName: 'deployEntityContracts',
          abi: [
            {
              inputs: [
                {
                  internalType: 'bytes',
                  name: 'responseBytes',
                  type: 'bytes',
                },
                {
                  internalType: 'bytes',
                  name: 'extraData',
                  type: 'bytes',
                },
              ],
              name: 'deployEntityContracts',
              outputs: [],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          address: contractAddresses['ai.' + tld],
          args: [],
        }
        const registerChaserTx = await executeWriteToResolver(
          wallet,
          formationPrep,
          formationCallback,
        )
        const transactionRes = await publicClient?.waitForTransactionReceipt({
          hash: registerChaserTx,
        })
        if (transactionRes?.status === 'reverted') {
          throw Error('Transaction failed - contract error')
        }
        router.push('/agent/' + name + '.ai.' + tld)
      } catch (err) {
        console.log(err)
      }
    } else if (actionStep === 2) {
      // deploy token
    }
  }

  // Attach event listener when the modal is open
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const actions = ['Register Agent', 'Add Agent Information', 'Deploy Agent Contract']

  const action = actions[actionStep]

  if (!isOpen) return null

  return (
    <Overlay>
      <ModalContent ref={modalRef} isExpanded={isExpanded}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2 style={{ textAlign: 'center', fontSize: '24px' }}>
          Creating Agent{name ? ': ' : ''}
          <span style={{ fontWeight: '900', color: 'red' }}>
            {name ? name?.toLowerCase() + '.ai.entity.id' : ''}
          </span>
        </h2>

        {/* Always visible inputs */}
        <InputGroup>
          <Label>Name</Label>
          <Input
            type="text"
            placeholder="Enter agent name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </InputGroup>

        <InputGroup>
          <Label>Image URL</Label>
          <Input
            type="text"
            placeholder="Enter image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </InputGroup>

        <InputGroup>
          <Label>Category</Label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select a category</option>
            <option value="Social Media">Social Media</option>
            <option value="Trading">Trading</option>
            <option value="Scraper">Scraper</option>
            <option value="Assistant">Assistant</option>
          </Select>
        </InputGroup>

        {/* Advanced Configuration Section */}
        <AdvancedSection>
          <AdvancedHeader isExpanded={isExpanded} onClick={() => setIsExpanded(!isExpanded)}>
            Advanced Configuration {isExpanded ? '▲' : '▼'}
          </AdvancedHeader>

          {isExpanded && (
            <>
              <InputGroup>
                <Label>Token Address</Label>
                <Input
                  type="text"
                  placeholder="Enter Token Address"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                />
              </InputGroup>
              <InputGroup>
                <Label>Platform</Label>
                <Input
                  type="text"
                  placeholder="Enter platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                />
              </InputGroup>

              <InputGroup>
                <Label>Description</Label>
                <TextArea
                  placeholder="Enter description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </InputGroup>

              <InputGroup>
                <Label>Twitter Handle</Label>
                <Input
                  type="text"
                  placeholder="Enter Twitter handle"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                />
              </InputGroup>

              <InputGroup>
                <Label>Telegram Handle</Label>
                <Input
                  type="text"
                  placeholder="Enter Telegram handle"
                  value={telegramHandle}
                  onChange={(e) => setTelegramHandle(e.target.value)}
                />
              </InputGroup>
            </>
          )}
        </AdvancedSection>
        <div style={{ width: '100%' }}>
          <Button
            style={{ width: '220px', height: '48px', margin: '0 auto', display: 'block' }}
            shape="square"
            size="small"
            onClick={() => advance()}
          >
            {action}
          </Button>
        </div>
      </ModalContent>
    </Overlay>
  )
}

export default DeployerModal
