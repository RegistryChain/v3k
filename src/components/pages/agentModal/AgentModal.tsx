// components/AgentModal.tsx (updated)
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { FormControl } from '@mui/material'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import styled, { css } from 'styled-components'

import { PinataSDK } from 'pinata'
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  getContract,
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
import { executeWriteToResolver, getResolverAddress } from '@app/hooks/useExecuteWriteToResolver'
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
import { CustomizedSteppers } from './Stepper'
import { Tooltip } from '@ensdomains/thorin'
import { ErrorModal } from '@app/components/ErrorModal'
import { useBreakpoint } from '@app/utils/BreakpointProvider'

type FormState = {
  name: string
  avatar: string
  category: string
  platform: string
  github: string
  endpoint: string
  parentEntityId: string
  parentName: string
  description: string
  twitterHandle: string
  tokenAddress: string
  telegramHandle: string
  imageFile: File | undefined
  video: string
  youtubeChannel: string
}

interface StepProps {
  isVisible: boolean
  prepopulate: { [x: string]: any }
  formState: FormState
  handleFieldChange: (field: keyof FormState) => (value: string | File | undefined) => void
}
export const pinata = new PinataSDK({
  pinataJwt: `${process.env.NEXT_PUBLIC_PINATA_JWT}`,
  pinataGateway: `${process.env.NEXT_PUBLIC_GATEWAY_URL}`
})
const Step1 = ({ isVisible, formState, prepopulate, handleFieldChange }: StepProps) => {
  return (
    <StepWrapper isVisible={isVisible}>
      {/* Core Inputs */}
      {prepopulate.name ? null :
        <FormInput
          label="Name"
          value={formState.name}
          onChange={handleFieldChange('name')}
          placeholder="Enter agent name"
          required
        />}
      <FormInput
        label="Category"
        type="select"
        value={formState.category}
        onChange={handleFieldChange('category')}
        options={['Social Media', 'Trading', 'Scraper', 'Assistant']}
        placeholder="Select a category"
        required
      />
      <FormControl required>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            handleFieldChange('imageFile')(file)
          }}
          style={{
            color: '#616661',
            display: "inline - block",
            cursor: "pointer",
            paddingLeft: "12px",
            paddingTop: "10px",
            paddingBottom: "10px",
            outline: "10px",
            border: "1px solid #ccc",
          }}
        />
      </FormControl>
      <FormInput
        label="Description"
        value={formState.description}
        onChange={handleFieldChange('description')}
        placeholder="Enter description"
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
        label="Agent Framework"
        value={formState.platform}
        onChange={handleFieldChange('platform')}
        placeholder="Enter Agent Framework"
      />

      <FormInput
        label="Chat Endpoint"
        value={formState.endpoint}
        onChange={handleFieldChange('endpoint')}
        placeholder="Enter Chatbot Endpoint"
      />
      <FormInput
        label="Github Repo"
        value={formState.github}
        onChange={handleFieldChange('github')}
        placeholder="Github Repo"
      />
    </StepWrapper>
  )
}
const Step3 = ({ isVisible, formState, handleFieldChange }: StepProps) => {
  return (
    <StepWrapper isVisible={isVisible}>

      <FormInput
        label="Explainer Video"
        value={formState.video}
        onChange={handleFieldChange('video')}
        placeholder="Add URL to Youtube Video"
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
        label="Youtube Channel"
        value={formState.youtubeChannel}
        onChange={handleFieldChange('youtubeChannel')}
        placeholder="Enter Agent Youtube Channel"
      />
    </StepWrapper>
  )
}

const Step4 = ({ isVisible, formState, handleFieldChange }: StepProps) => {
  return (
    <StepWrapper isVisible={isVisible}>
      <FormInput
        label="Entity ID"
        value={formState.parentEntityId}
        onChange={handleFieldChange('parentEntityId')}
        placeholder="Enter a entity.id domain"
      />
      <FormInput
        label="Name"
        value={formState.parentName}
        onChange={handleFieldChange('parentName')}
        placeholder="Enter Developer Name"
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
  const [errorMessage, setErrorMessage] = useState<string>('')
  const breakpoints = useBreakpoint()

  // Complete form state
  const originalForm: FormState = {
    name: '',
    avatar: '',
    category: '',
    platform: '',
    github: '',
    endpoint: '',
    parentEntityId: '',
    parentName: '',
    description: '',
    twitterHandle: '',
    tokenAddress: '',
    telegramHandle: '',
    youtubeChannel: '',
    video: '',
    imageFile: undefined
  }
  // Text record key mapping
  const mapKeyToRecord = (formKey: string) => {
    const mapping: Record<string, string> = {
      platform: 'aiagent__runtimeplatform',
      description: 'description',
      twitterHandle: 'com.twitter',
      tokenAddress: 'token__utility',
      telegramHandle: 'org.telegram',
      github: 'com.github',
      endpoint: 'aiagent__entrypoint__url',
      parentEntityId: 'partner__[0]__domain',
      parentName: 'partner__[0]__name',
      category: 'keywords',
      video: 'video',
      youtubeChannel: 'com.youtube'
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
        return;
      }
      const { cid } = await pinata.upload.public.file(formState.imageFile)
      const url = await pinata.gateways.public.convert(cid);
      formState.avatar = url
      // setFormState(formState)
    } catch (e) {
      console.log(e);
      if (!formState.avatar) {
        alert("Trouble uploading file");
      }
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
      { key: 'registrar', value: 'ai' },
    ]
    let stateCopy = { ...formState }
    delete stateCopy.imageFile

    if (formState.parentEntityId) {
      const label = normalizeLabel(formState.parentEntityId.split('.')[0])
      stateCopy.parentEntityId =
        label + '.' + stateCopy.parentEntityId.split('.').slice(1).join('.')?.toLowerCase()
    }

    return [
      ...baseRecords,
      ...Object.entries(stateCopy)
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

    const formationPrep = await createFormationPrep(texts)

    // Pass in amendment formationPrep as multicall(setText())
    const wallet = getWalletClient(address as Address)
    if (isAddressEqual(formationPrep.address, contractAddressesObj["DatabaseResolver"] as Address)) {
      await executeWriteToResolver(wallet, formationPrep, null)
    } else {
      try {
        const contract: any = getContract({ client: wallet, ...formationPrep })
        await contract.write?.[formationPrep.functionName]([...formationPrep.args])
      } catch (err: any) {
        if (err.shortMessage === 'User rejected the request.') return
        let errMsg = err?.details
        if (!errMsg) errMsg = err?.shortMessage 
        if (!errMsg) errMsg = err.message
        setErrorMessage(errMsg)
      }
    }


  }

  const handleFieldChange = (field: keyof typeof formState) => (value: string | File | undefined) =>
    setFormState((prev: any) => ({ ...prev, [field]: value }))

  const handleRegistration = async () => {

    try {
      await uploadFile()
    } catch (err: any) {
      let errMsg = err?.details || err?.shortMessage || err.message
      setErrorMessage(errMsg)
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
    window.location.href = (`/agent/${formState.name}.ai.${tld}`)
    onClose()
  }

  const createFormationPrep = async (texts: any[]) => {
    if (agentModalPrepopulate) {
      if (Object.keys(agentModalPrepopulate)?.length > 0) {
        const nodehash = namehash(agentModalPrepopulate.entityid)
        const changedRecords = getChangedRecords(agentModalPrepopulate, formState, mapKeyToRecord)
        const resolverAddress = await getResolverAddress(publicClient, agentModalPrepopulate.entityid)
        const multicalls: string[] = []
        changedRecords.forEach((x: any) => {
          multicalls.push(
            encodeFunctionData({
              abi: l1abi,
              functionName: 'setText',
              args: [nodehash, x.key, x.value],
            }),
          )
        })
        // Use Resolver multicall(setText[])
        const formationPrep: any = {
          functionName: 'multicall',
          args: [multicalls],
          abi: l1abi,
          address: resolverAddress,
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
  let disabled = actionStep === 3 && !formState.name
  let submitButton = <SubmitButton
    disabled={disabled}
    onClick={() => {
      if (actionStep < 3) {
        setActionStep(actionStep + 1)
      } else {
        handleRegistration()
      }
    }}
  >
    {actionStep < 3 ? "Next" : actions[0]}
  </SubmitButton>

  if (disabled) {
    submitButton = <Tooltip content={"Registration requires agent name"}>
      <SubmitButton
        disabled={disabled}
        onClick={() => {
          if (actionStep < 3) {
            setActionStep(actionStep + 1)
          } else {
            handleRegistration()
          }
        }}
      >
        {actionStep < 3 ? "Next" : actions[0]}
      </SubmitButton>
    </Tooltip>
  }



  return (
    <Overlay>
      <ErrorModal
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
        breakpoints={breakpoints}
      />
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
                prepopulate={agentModalPrepopulate}
                handleFieldChange={handleFieldChange}
              />
            )}
            {actionStep === 1 && (
              <Step2
                isVisible={actionStep === 1}
                formState={formState}
                prepopulate={agentModalPrepopulate}

                handleFieldChange={handleFieldChange}
              />
            )}
            {actionStep === 2 && (
              <Step3
                isVisible={actionStep === 2}
                formState={formState}
                prepopulate={agentModalPrepopulate}

                handleFieldChange={handleFieldChange}
              />
            )}
            {actionStep === 3 && (
              <Step4
                isVisible={actionStep === 3}
                formState={formState}
                prepopulate={agentModalPrepopulate}

                handleFieldChange={handleFieldChange}
              />
            )}
          </>
        </StepContainer>

        <ButtonWrapper>
          {submitButton}
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