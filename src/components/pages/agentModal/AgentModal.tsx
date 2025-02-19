// components/AgentModal.tsx (updated)
import { useConnectModal } from '@rainbow-me/rainbowkit'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Address,
  encodeAbiParameters,
  isAddressEqual,
  labelhash,
  namehash,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem'
import { normalize, packetToBytes } from 'viem/ens'
import { useAccount } from 'wagmi'

import { Button } from '@ensdomains/thorin'

import { checkOwner } from '@app/hooks/useCheckOwner'
import { executeWriteToResolver } from '@app/hooks/useExecuteWriteToResolver'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import {
  getContractInstance,
  getPublicClient,
  getWalletClient,
  normalizeLabel,
} from '@app/utils/utils'

import contractAddressesObj from '../../../constants/contractAddresses.json'
import l1abi from '../../../constants/l1abi.json'
import { AdvancedConfiguration } from './AdvancedConfiguration'
import { CloseButton, ModalContent, Overlay } from './AgentModalStyles'
import { FormInput } from './FormInput'
import { ParentEntitySection } from './ParentEntitySection'

const tld = 'entity.id'
const contractAddresses = contractAddressesObj as Record<string, Address>
const actions = ['Register Agent', 'Add Agent Information', 'Deploy Agent Contract']

const AgentModal = ({ isOpen, onClose }: any) => {
  const { address } = useAccount()
  const router = useRouterWithHistory()
  const { openConnectModal } = useConnectModal()
  const modalRef = useRef(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [actionStep, setActionStep] = useState(0)

  // Complete form state
  const originalForm = {
    name: '',
    imageUrl: '',
    category: '',
    platform: '',
    purpose: '',
    github: '',
    endpoint: '',
    parentEntityId: '',
    parentName: '',
    description: '',
    twitterHandle: '',
    tokenAddress: '',
    telegramHandle: '',
  }
  const [formState, setFormState] = useState(originalForm)
  const publicClient = useMemo(getPublicClient, [])

  const registerEntity = async (entityDomain: string) => {
    const registrarContract: any = getContractInstance(
      getWalletClient(address as Address),
      `ai.${tld}`,
    )
    let owner = await checkOwner(publicClient, namehash(entityDomain))

    if (!owner || owner === zeroAddress) {
      const tx = await registrarContract.write.registerEntity([
        labelhash(normalize(formState.name)),
        address,
      ])
      const txReceipt = await publicClient.waitForTransactionReceipt({ hash: tx })

      if (txReceipt?.status === 'reverted') {
        throw Error('Transaction failed - contract error')
      }
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

  // Close modal when clicking outside of it
  const handleClickOutside = (event: any) => {
    const cur: any = modalRef.current
    if (modalRef.current && !cur.contains(event.target)) {
      onClose()
    }
  }

  const createTextRecords = () => {
    const baseRecords = [
      { key: 'entity__name', value: formState.name },
      { key: 'avatar', value: formState.imageUrl },
      { key: 'entity__type', value: formState.category },
      { key: 'entity__registrar', value: 'AI' },
      { key: 'entity__code', value: '0002' },
    ]

    return isExpanded
      ? [
          ...baseRecords,
          ...Object.entries(formState)
            .filter(([key]) => !['name', 'imageUrl', 'category'].includes(key))
            .map(([key, value]) => ({ key: mapKeyToRecord(key), value })),
        ]
      : baseRecords
  }

  const submitEntityData = async (entityDomain: string) => {
    const texts = createTextRecords()
    const owner = await checkOwner(publicClient, namehash(entityDomain))

    if (
      !isAddressEqual(owner, address as Address) &&
      !isAddressEqual(owner, contractAddresses[`ai.${tld}`])
    ) {
      throw Error('Permission denied for domain registration')
    }

    const formationPrep = createFormationPrep(texts)

    await executeWriteToResolver(getWalletClient(address as Address), formationPrep, null)
  }

  const handleFieldChange = (field: keyof typeof formState) => (value: string) =>
    setFormState((prev) => ({ ...prev, [field]: value }))

  const handleRegistration = async () => {
    const entityRegistrarDomain = `${formState.name}.ai.${tld}`

    try {
      if (openConnectModal && !address) return openConnectModal()

      let currentEntityOwner = await checkOwner(publicClient, namehash(entityRegistrarDomain))

      // If there is no owner to the domain, make the register
      if (!currentEntityOwner || currentEntityOwner === zeroAddress) {
        await registerEntity(entityRegistrarDomain)
      }
    } catch (err) {
      console.log(err, 'error in registering entity name')
      return
    }

    try {
      await submitEntityData(entityRegistrarDomain)
    } catch (err) {
      console.log(err, 'error in submitting agent data')
      return
    }
    setFormState(originalForm)
    router.push(`/agent/${formState.name}.ai.${tld}`)
    onClose()
  }

  // Text record key mapping
  const mapKeyToRecord = (formKey: string) => {
    const mapping: Record<string, string> = {
      platform: 'location',
      description: 'description',
      twitterHandle: 'entity__twitter',
      tokenAddress: 'entity__token__address',
      telegramHandle: 'entity__telegram',
      purpose: 'entity__purpose',
      github: 'entity__github',
      endpoint: 'entity__endpoint',
      parentEntityId: 'partner__[0]__domain',
      parentName: 'partner__[0]__name',
    }
    return mapping[formKey] || formKey
  }

  const createFormationPrep = (texts: any[]) => ({
    functionName: 'register',
    args: [
      toHex(packetToBytes(formState.name)),
      address,
      0,
      zeroHash,
      zeroAddress,
      texts.map((x) =>
        encodeAbiParameters([{ type: 'string' }, { type: 'string' }], [x.key, x.value]),
      ),
      false,
      0,
      zeroHash,
    ],
    abi: l1abi,
    address: contractAddresses['DatabaseResolver'],
  })

  // const createFormationCallback = () => ({
  //   functionName: 'deployEntityContracts',
  //   abi: [
  //     {
  //       inputs: [
  //         { internalType: 'bytes', name: 'responseBytes', type: 'bytes' },
  //         { internalType: 'bytes', name: 'extraData', type: 'bytes' },
  //       ],
  //       name: 'deployEntityContracts',
  //       outputs: [],
  //       stateMutability: 'nonpayable',
  //       type: 'function',
  //     },
  //   ],
  //   address: contractAddresses[`ai.${tld}`],
  //   args: [],
  // })

  if (!isOpen) return null

  return (
    <Overlay>
      <ModalContent ref={modalRef} isExpanded={isExpanded}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2 style={{ textAlign: 'center', fontSize: '24px' }}>
          Creating Agent{formState.name ? ': ' : ''}
          <span style={{ fontWeight: '900', color: 'red' }}>
            {formState.name ? `${formState.name.toLowerCase()}.ai.entity.id` : ''}
          </span>
        </h2>

        {/* Core Inputs */}
        <FormInput
          label="Name"
          value={formState.name}
          onChange={handleFieldChange('name')}
          placeholder="Enter agent name"
        />

        <FormInput
          label="Image URL"
          value={formState.imageUrl}
          onChange={handleFieldChange('imageUrl')}
          placeholder="Enter image URL"
        />

        <FormInput
          label="Category"
          type="select"
          value={formState.category}
          onChange={handleFieldChange('category')}
          options={['Social Media', 'Trading', 'Scraper', 'Assistant']}
          placeholder="Select a category"
        />

        <AdvancedConfiguration isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)}>
          {/* Advanced Inputs */}
          <FormInput
            label="Token Address"
            value={formState.tokenAddress}
            onChange={handleFieldChange('tokenAddress')}
            placeholder="Enter Token Address"
          />

          <FormInput
            label="Platform"
            value={formState.platform}
            onChange={handleFieldChange('platform')}
            placeholder="Enter platform"
          />

          <FormInput
            label="Purpose"
            value={formState.purpose}
            onChange={handleFieldChange('purpose')}
            placeholder="Enter Purpose"
          />

          <FormInput
            label="Github"
            value={formState.github}
            onChange={handleFieldChange('github')}
            placeholder="Github"
          />

          <FormInput
            label="Endpoint"
            value={formState.endpoint}
            onChange={handleFieldChange('endpoint')}
            placeholder="Enter Endpoint"
          />

          <FormInput
            label="X (Twitter) Handle"
            value={formState.twitterHandle}
            onChange={handleFieldChange('twitterHandle')}
            placeholder="Enter Twitter Handle"
          />

          <FormInput
            label="Telegram Handle"
            value={formState.telegramHandle}
            onChange={handleFieldChange('telegramHandle')}
            placeholder="Enter Telegram Handle"
          />

          <FormInput
            label="Description"
            value={formState.description}
            onChange={handleFieldChange('description')}
            placeholder="Enter description"
          />

          <ParentEntitySection
            parentName={formState.parentName}
            setParentName={handleFieldChange('parentName')}
            parentEntityId={formState.parentEntityId}
            setParentEntityId={handleFieldChange('parentEntityId')}
          />
        </AdvancedConfiguration>

        <div style={{ width: '100%' }}>
          <Button
            style={{ width: '220px', height: '48px', margin: '0 auto', display: 'block' }}
            onClick={handleRegistration}
          >
            {actions[actionStep]}
          </Button>
        </div>
      </ModalContent>
    </Overlay>
  )
}
export default AgentModal
