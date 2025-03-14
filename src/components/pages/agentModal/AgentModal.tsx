// components/AgentModal.tsx (updated)
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { TextField, Select, FormControl, InputLabel, MenuItem } from '@mui/material'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

import { PinataSDK } from 'pinata'
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  isAddressEqual,
  labelhash,
  namehash,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem'
import { normalize, packetToBytes } from 'viem/ens'
import { useAccount } from 'wagmi'

import { checkOwner } from '@app/hooks/useCheckOwner'
import { executeWriteToResolver } from '@app/hooks/useExecuteWriteToResolver'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import {
  getChangedRecords,
  getContractInstance,
  getPublicClient,
  getWalletClient,
  normalizeLabel,
} from '@app/utils/utils'

import contractAddressesObj from '../../../constants/contractAddresses.json'
import l1abi from '../../../constants/l1abi.json'
import { AdvancedConfiguration } from './AdvancedConfiguration'
import {
  CloseButton,
  ModalContent,
  Overlay,
  StepContainer,
  StepWrapper,
  SubmitButton,
  ButtonWrapper,
} from './AgentModalStyles'
import { FormInput } from './FormInput'
import { ParentEntitySection } from './ParentEntitySection'
import { CustomizedSteppers } from './Stepper'
import { lightGreen } from '@mui/material/colors'

type FormState = {
  name: string
  avatar: string
  category: string
  platform: string
  purpose: string
  github: string
  endpoint: string
  parentEntityId: string
  parentName: string
  description: string
  twitterHandle: string
  tokenAddress: string
  telegramHandle: string
  imageFile: File | undefined
}

interface StepProps {
  isVisible: boolean
  formState: FormState
  handleFieldChange: (field: keyof FormState) => (value: string | File | undefined) => void
}
export const pinata = new PinataSDK({
  pinataJwt: `${process.env.NEXT_PUBLIC_PINATA_JWT}`,
  pinataGateway: `${process.env.NEXT_PUBLIC_GATEWAY_URL}`
})
const Step1 = ({ isVisible, formState, handleFieldChange }: StepProps) => {
  return (
    <StepWrapper isVisible={isVisible}>
      {/* Core Inputs */}
      <FormInput
        label="Name"
        value={formState.name}
        onChange={handleFieldChange('name')}
        placeholder="Enter agent name"
        required
      />

      <label htmlFor="file-upload" style={{ 
          color: '#666666',
          display: "inline - block",
          paddingLeft: "12px",
          paddingTop: "10px",
          paddingBottom: "10px",
          outline: "10px",
          border: "1px solid #ccc",
          cursor: "pointer",
         }}>
        <input
          id="file-upload"
          required
          type="file"
          accept="image/*"
          name='Upload Image'
          onChange={(e) => {
            const file = e.target.files?.[0];
            handleFieldChange('imageFile')(file)
          }}
          style={{
            display: 'none'
          }}
        />
        <span>Upload Image: {formState.imageFile?.name || 'No File Chosen'}</span>
      </label>

      <FormInput
        label="Category"
        type="select"
        value={formState.category}
        onChange={handleFieldChange('category')}
        options={['Social Media', 'Trading', 'Scraper', 'Assistant']}
        placeholder="Select a category"
        required
      />
    </StepWrapper>
  )
}

const Step2 = ({ isVisible, formState, handleFieldChange }: StepProps) => {
  return (
    <StepWrapper isVisible={isVisible}>
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
    </StepWrapper>
  )
}

const Step3 = ({ isVisible, formState, handleFieldChange }: StepProps) => {
  return (
    <StepWrapper isVisible={isVisible}>
      <FormInput
        label="Name"
        value={formState.parentName}
        onChange={handleFieldChange('parentName')}
        placeholder="Enter Developer Name"
      />
      <FormInput
        label="Entity ID"
        value={formState.parentEntityId}
        onChange={handleFieldChange('parentEntityId')}
        placeholder="Enter an entity.id domain"
      />
    </StepWrapper>
  )
}

const tld = 'entity.id'
const contractAddresses = contractAddressesObj as Record<string, Address>
const actions = ['Register Agent', 'Add Agent Information', 'Deploy Agent Contract']

const AgentModal = ({ isOpen, onClose, agentModalPrepopulate, setAgentModalPrepopulate }: any) => {
  const { address } = useAccount()
  const router = useRouterWithHistory()
  const { openConnectModal } = useConnectModal()
  const modalRef = useRef(null)
  const [actionStep, setActionStep] = useState(0)

  // Complete form state
  const originalForm: FormState = {
    name: '',
    avatar: '',
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
    imageFile: undefined
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
      category: 'entity__type',
    }
    return mapping[formKey] || formKey
  }

  const originalFormToSet: any = originalForm
  useMemo(() => {
    if (agentModalPrepopulate) {
      if (Object.keys(agentModalPrepopulate)?.length > 0) {
        Object.keys(originalForm).forEach((field: any) => {
          const prepopField = mapKeyToRecord(field)
          originalFormToSet[field] = agentModalPrepopulate[prepopField]
        })
      }
    }
  }, [agentModalPrepopulate])

  const [formState, setFormState] = useState(originalFormToSet)
  const publicClient = useMemo(getPublicClient, [])

  const uploadFile = async () => {
    try {
      if (!formState.imageFile) {
        alert("No file selected");
        return;
      }
      const { cid } = await pinata.upload.public.file(formState.imageFile)
      const url = await pinata.gateways.public.convert(cid);
      console.log("url")
      console.log(url)
      formState.avatar = url
      // setFormState(formState)
    } catch (e) {
      console.log(e);
      alert("Trouble uploading file");
    }
  };
  const registerEntity = async (entityDomain: string) => {
    // This function is for on chain ownership registration. The system currently uses gasless off chain ownership
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
      } else {
        owner = contractAddresses['ai.' + tld]
      }
    }
    return owner
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
    // Select elements are part of the select dropdown and should not close the modal
    const selectElements = document.querySelectorAll(
      '.MuiSelect-root, .MuiSelect-root, .MuiList-root, .MuiMenu-root *',
    )
    if (
      modalRef.current &&
      !cur.contains(event.target) &&
      !Array.from(selectElements).some((el) => el.contains(event.target))
    ) {
      onClose()
    }
  }

  const createTextRecords = () => {
    const baseRecords = [
      { key: 'entity__name', value: formState.name },
      { key: 'entity__registrar', value: 'ai' },
      { key: 'entity__code', value: '0002' },
    ]
    let stateCopy = { ...formState }

    if (formState.parentEntityId) {
      const label = normalizeLabel(formState.parentEntityId.split('.')[0])
      stateCopy.parentEntityId =
        label + '.' + stateCopy.parentEntityId.split('.').slice(1).join('.')?.toLowerCase()
    }

    return [
      ...baseRecords,
      ...Object.entries(formState)
        .filter(([key, value]) => value)
        .map(([key, value]) => ({ key: mapKeyToRecord(key), value })),
    ]
  }

  const submitEntityData = async (entityDomain: string, currentEntityOwner: Address) => {
    const texts = createTextRecords()

    if (
      !isAddressEqual(currentEntityOwner, address as Address) &&
      !isAddressEqual(currentEntityOwner, contractAddresses[`ai.${tld}`]) &&
      !isAddressEqual(currentEntityOwner, zeroAddress as Address) //IN CASES OF OFFCHAIN REGISTRATION, THE ON CHAIN OWNER IS 0x0. THE GATEWAY THEN CHECKS IF 'OWNED' OFFCHAIN
    ) {
      throw Error('Permission denied for domain registration')
    }

    const formationPrep = createFormationPrep(texts)

    // Pass in amendment formationPrep as multicall(setText())

    await executeWriteToResolver(getWalletClient(address as Address), formationPrep, null)
  }

  const handleFieldChange = (field: keyof typeof formState) => (value: string | File | undefined) =>
    setFormState((prev: any) => ({ ...prev, [field]: value }))

  const handleRegistration = async () => {

    try {
      await uploadFile()
    } catch (err) {
      console.log(err, 'error in submitting agent data, uploading ipfs image')
      return
    }

    const entityRegistrarDomain = `${formState.name}.ai.${tld}`

    let currentEntityOwner = await checkOwner(publicClient, namehash(entityRegistrarDomain))
    try {
      if (openConnectModal && !address) return openConnectModal()

      // If there is no owner to the domain, make the register
      // if (!currentEntityOwner || currentEntityOwner === zeroAddress) {
      //   currentEntityOwner = await registerEntity(entityRegistrarDomain)
      // }
    } catch (err) {
      console.log(err, 'error in registering entity name')
      return
    }

    try {
      await submitEntityData(entityRegistrarDomain, currentEntityOwner)
    } catch (err) {
      console.log(err, 'error in submitting agent data')
      return
    }
    setFormState(originalForm)
    router.push(`/agent/${formState.name}.ai.${tld}`)
    onClose()
  }

  const createFormationPrep = (texts: any[]) => {
    if (agentModalPrepopulate) {
      if (Object.keys(agentModalPrepopulate)?.length > 0) {
        const nodeHash = namehash(agentModalPrepopulate.domain)
        const changedRecords = getChangedRecords(agentModalPrepopulate, formState, mapKeyToRecord)
        const multicalls: string[] = []
        changedRecords.forEach((x: any) => {
          multicalls.push(
            encodeFunctionData({
              abi: l1abi,
              functionName: 'setText',
              args: [nodeHash, x.key, x.value],
            }),
          )
        })
        // Use Resolver multicall(setText[])
        const formationPrep: any = {
          functionName: 'multicall',
          args: [multicalls],
          abi: l1abi,
          address: contractAddresses['DatabaseResolver'],
        }
        return formationPrep
      }
    }
    return {
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
    }
  }

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
      <ModalContent ref={modalRef} isExpanded={false}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '24px',
            marginBottom: '24px',
            fontWeight: 'bold',
          }}
        >
          Add Agent{formState.name ? ': ' : ''}
          <span style={{ fontWeight: '900', color: 'var(--color-accent)' }}>
            {formState.name ? `${formState.name.toLowerCase()}.ai.entity.id` : ''}
          </span>
        </h2>

        <CustomizedSteppers activeStep={actionStep} setActiveStep={setActionStep} />

        <StepContainer>
          <>
            {actionStep === 0 && (
              <Step1
                isVisible={actionStep === 0}
                formState={formState}
                handleFieldChange={handleFieldChange}
              />
            )}
            {actionStep === 1 && (
              <Step2
                isVisible={actionStep === 1}
                formState={formState}
                handleFieldChange={handleFieldChange}
              />
            )}
            {actionStep === 2 && (
              <Step3
                isVisible={actionStep === 2}
                formState={formState}
                handleFieldChange={handleFieldChange}
              />
            )}
          </>
        </StepContainer>

        <ButtonWrapper>
          <SubmitButton
            disabled={!formState.name || !formState.imageFile || !formState.category}
            onClick={handleRegistration}
          >
            {actions[0]}
          </SubmitButton>
        </ButtonWrapper>
      </ModalContent>
    </Overlay>
  )
}
export default AgentModal

/* Add this CSS to your styles */
export const sds = `::file-selector-button{
  border: 2px solid black;
  padding: 5px 10px;
  border-radius: 5px;
  background-color: lightgreen;
}`