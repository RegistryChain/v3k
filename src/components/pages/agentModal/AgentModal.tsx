// components/AgentModal.tsx (updated)
import { FormControl } from '@mui/material'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  getContract,
  isAddress,
  isAddressEqual,
  labelhash,
  namehash,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem'
import { normalize, packetToBytes } from 'viem/ens'

import { checkOwner } from '@app/hooks/useCheckOwner'
import { executeWriteToResolver, getResolverAddress } from '@app/hooks/useExecuteWriteToResolver'
import {
  getChangedRecords,
  getPrivyWalletClient,
  getPublicClient,
  normalizeLabel,
  pinata,
} from '@app/utils/utils'

import contractAddressesObj from '../../../constants/contractAddresses.json'
import { keywords } from '../../../constants/keywords.js'
import l1abi from '../../../constants/l1abi.json'
import {
  CloseButton,
  ModalContent,
  Overlay,
  StepContainer,
  StepWrapper,
  SubmitButton,
  ButtonWrapper,
  Input,
  HiddenFileInput,
  StyledFileLabel,
} from './AgentModalStyles'
import { FormInput } from './FormInput'
import { CustomizedSteppers } from './Stepper'
import { ErrorModal } from '@app/components/ErrorModal'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { SearchableDropdown } from './SearchableDropdown'
import { useConnectOrCreateWallet, useWallets } from '@privy-io/react-auth'
import { Tooltip } from '@ensdomains/thorin'

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
  website: string
  keywords: string[]
}

interface StepProps {
  isVisible: boolean
  prepopulate: { [x: string]: any }
  formState: FormState
  isAmendment: Boolean
  handleFieldChange: (field: keyof FormState) => (value: string | File | undefined) => void
}

const Step1 = ({ isVisible, formState, isAmendment, prepopulate, handleFieldChange }: StepProps) => {
  let keywordValue = []
  if (Array.isArray(formState.keywords)) {
    keywordValue = formState.keywords
  } else if (typeof formState.keywords === 'string' && formState.keywords) {
    // @ts-ignore
    keywordValue = formState.keywords.split(", ")
  }

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
      {
        isAmendment ? null :
          <Tooltip content={"This will be the image shown for your agent. ENS compatible"}>
            <FormControl required>
              <HiddenFileInput
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  handleFieldChange('imageFile')(file);
                }}
              />

              <StyledFileLabel htmlFor="avatar-upload">
                {formState.imageFile?.name
                  ? `Selected: ${formState.imageFile.name}`
                  : 'Select Avatar'}
              </StyledFileLabel>
            </FormControl>
          </Tooltip>
      }
      <Tooltip content={"Describe your agent and present its features to potential users"}>
        <div>

          <FormInput
            label="Description"
            type="textarea"
            value={formState.description}
            onChange={handleFieldChange('description')}
            placeholder="Enter description"
            required
          />
        </div>
      </Tooltip>
      <Tooltip content={"Select the category that your agent functionality is most related to"}>
        <div>

          <SearchableDropdown
            // style={{ border: "1px solid #c3c1c1", borderRadius: "4px",    }}
            data={['Social Media', 'Trading', 'Scraper', 'Assistant', 'Coding', 'Backend', 'Conversational', "Other"]}
            label={"Category"}
            onChange={(x: any) => {
              handleFieldChange('category')(x[x.length - 1])
            }}
            value={formState.category ? [formState.category] : []}

          />
        </div>
      </Tooltip>
      <Tooltip content={"Select keywords that best apply to your agent's composition and functionality. Think of these keywords as tags that help your agent's discoverability."}>
        <div style={{ height: "56px" }}>
          <SearchableDropdown
            // style={{ border: "1px solid #c3c1c1", borderRadius: "4px",    }}
            data={keywords}
            label={"Keywords"}
            onChange={(x: any) => {
              handleFieldChange('keywords')(x)
            }}
            value={keywordValue}

          />
        </div>
      </Tooltip>
    </StepWrapper>
  )
}

const Step2 = ({ isVisible, formState, isAmendment, handleFieldChange }: StepProps) => {
  return (
    <StepWrapper isVisible={isVisible}>
      <Tooltip content={"Add the address of your agent's token. This could be an ownership token, a utility token, or whatever other token that is most relevant to your agent's identity"}>
        <div>
          <FormInput
            error={!isAddress(formState.tokenAddress) && formState.tokenAddress?.length !== 0}
            label="Token Address"
            value={formState.tokenAddress}
            onChange={handleFieldChange('tokenAddress')}
            placeholder="Enter Token Address"
          />
        </div>
      </Tooltip>
      <Tooltip content={"Select the framework or platform that your Agent was developed with"}>
        <div>
          <SearchableDropdown
            // style={{ border: "1px solid #c3c1c1", borderRadius: "4px",    }}
            data={['Eliza', 'GAME', 'Crew AI', 'Fine', 'LangGraph', "Other"]}
            label={"Agent Framework"}
            onChange={(x: any) => {
              handleFieldChange('platform')(x[x.length - 1])
            }}
            value={formState.platform ? [formState.platform] : []}

          />

        </div>
      </Tooltip>
      <Tooltip content={"Add the endpoint URI that is used to communicate or interact with your agent."}>
        <div>
          <FormInput
            error={formState.endpoint?.length !== 0 && !(/^(https?|ftp|wss):\/\/[^\s/$.?#].[^\s]*$/i).test(formState.endpoint)}
            label="Chat Endpoint"
            value={formState.endpoint}
            onChange={handleFieldChange('endpoint')}
            placeholder="Enter Chatbot Endpoint"
          />
        </div>
      </Tooltip>
      <Tooltip content={"Add a link to the Github Repo that contains your agent source code."}>
        <div>
          <FormInput
            error={formState.github?.length !== 0 && !(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i).test(formState.github)}
            label="Github Repo"
            value={formState.github}
            onChange={handleFieldChange('github')}
            placeholder="Github Repo"
          />
        </div>
      </Tooltip>
    </StepWrapper>
  )
}
const Step3 = ({ isVisible, formState, isAmendment, handleFieldChange }: StepProps) => {
  return (
    <StepWrapper isVisible={isVisible}>
      <Tooltip content={"Add a your agent's website"}>
        <div>
          <FormInput
            error={formState.website?.length !== 0 && !(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i).test(formState.website)}
            label="Website"
            value={formState.website}
            onChange={handleFieldChange('website')}
            placeholder="Enter Agent Website"
          />
        </div>
      </Tooltip>
      <Tooltip content={"Add a link to a Youtube video for your agent."}>
        <div>
          <FormInput
            error={formState.video?.length !== 0 && !(/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i).test(formState.video)}
            label="Explainer Video"
            value={formState.video}
            onChange={handleFieldChange('video')}
            placeholder="Add URL to Youtube Video"
          />
        </div>
      </Tooltip>
      <Tooltip content={"Add your agent's X (Twitter) handle"}>
        <div>

          <FormInput
            label="X (Twitter) Handle"
            value={formState.twitterHandle}
            onChange={handleFieldChange('twitterHandle')}
            placeholder="Enter Twitter Handle"
          />
        </div>
      </Tooltip>
      <Tooltip content={"Add your agent's Telegram username"}>
        <div>
          <FormInput
            label="Telegram Handle"
            value={formState.telegramHandle}
            onChange={handleFieldChange('telegramHandle')}
            placeholder="Enter Telegram Handle"
          />
        </div>
      </Tooltip>

    </StepWrapper>
  )
}

// const Step4 = ({ isVisible, formState, handleFieldChange }: StepProps) => {
//   return (
//     <StepWrapper isVisible={isVisible}>
//       <FormInput
//         label="Entity ID"
//         value={formState.parentEntityId}
//         onChange={handleFieldChange('parentEntityId')}
//         placeholder="Enter a entity.id domain"
//       />
//       <FormInput
//         label="Name"
//         value={formState.parentName}
//         onChange={handleFieldChange('parentName')}
//         placeholder="Enter Developer Name"
//       />
//     </StepWrapper>
//   )
// }

const tld = 'entity.id'
const contractAddresses = contractAddressesObj as Record<string, Address>
const actions = ['Register Agent', 'Add Agent Information', 'Deploy Agent Contract']

const AgentModal = ({ isOpen, onClose, agentModalPrepopulate, setAgentModalPrepopulate }: any) => {
  const { wallets } = useWallets();      // Privy hook
  const address = useMemo(() => wallets[0]?.address, [wallets]) as Address

  const { connectOrCreateWallet } = useConnectOrCreateWallet();

  const modalRef = useRef(null)
  const [actionStep, setActionStep] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const breakpoints: any = useBreakpoint()

  const isAmendment = agentModalPrepopulate && Object.keys(agentModalPrepopulate)?.length > 0

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
    website: '',
    video: '',
    keywords: [],
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
      video: 'video',
      website: 'url'
    }
    return mapping[formKey] || formKey
  }

  const originalFormToSet: any = originalForm
  useMemo(() => {
    if (isAmendment) {
      Object.keys(originalForm).forEach((field: any) => {
        const prepopField = mapKeyToRecord(field)
        originalFormToSet[field] = agentModalPrepopulate[prepopField]
      })
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

  // const registerEntity = async (entityDomain: string) => {
  //   // This function is for on chain ownership registration. The system currently uses gasless off chain ownership
  //   const registrarContract: any = getContractInstance(
  //     getWalletClient(address as Address),
  //     `ai.${tld}`,
  //   )
  //   let owner = await checkOwner(publicClient, namehash(entityDomain))

  //   if (!owner || owner === zeroAddress) {
  //     const tx = await registrarContract.write.registerEntity([
  //       labelhash(normalize(formState.name)),
  //       address,
  //     ])
  //     const txReceipt = await publicClient.waitForTransactionReceipt({ hash: tx })

  //     if (txReceipt?.status === 'reverted') {
  //       throw Error('Transaction failed - contract error')
  //     } else {
  //       owner = contractAddresses['ai.' + tld]
  //     }
  //   }
  //   return owner
  // }

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
  const handleClickOutside = (event: MouseEvent) => {
    const path = event.composedPath()
    const modalEl = modalRef.current
    const muiMenu = document.querySelector('.MuiPopover-root') // or '.MuiPaper-root'

    const isInModal = modalEl && path.includes(modalEl)
    const isInMUI = muiMenu && path.includes(muiMenu)

    if (!isInModal && !isInMUI) {
      onClose()
    }
  }

  const createTextRecords = () => {
    const baseRecords = [
      { key: 'registrar', value: 'ai' },
    ]
    let stateCopy = { ...formState }
    delete stateCopy.imageFile
    try {
      if (formState.parentEntityId) {
        const label = normalizeLabel(formState.parentEntityId.split('.')[0])
        stateCopy.parentEntityId =
          label + '.' + stateCopy.parentEntityId.split('.').slice(1).join('.')?.toLowerCase()
      }

    } catch (err: any) {
      console.log('ERR in createTextRecords', err.message)
      return []
    }

    return [
      ...baseRecords,
      ...Object.entries(stateCopy)
        .filter(([key, value]) => value)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            value = value.join(", ")
          }
          return ({ key: mapKeyToRecord(key), value })
        }),
    ]
  }

  const submitEntityData = async (entityDomain: string, currentEntityOwner: Address) => {
    const texts = createTextRecords()
    if (texts.length === 0) {
      throw Error("Issue generating registration data for Agent")
    }
    if (
      !isAddressEqual(currentEntityOwner, address as Address) &&
      !isAddressEqual(currentEntityOwner, contractAddresses[`ai.${tld}`]) &&
      !isAddressEqual(currentEntityOwner, zeroAddress as Address) //IN CASES OF OFFCHAIN REGISTRATION, THE ON CHAIN OWNER IS 0x0. THE GATEWAY THEN CHECKS IF 'OWNED' OFFCHAIN
    ) {
      throw Error('Permission denied for domain registration')
    }
    const formationPrep = await createFormationPrep(texts)

    if (Object.keys(formationPrep)?.length === 0) throw Error('Registration calldata could not be formed')
    // Pass in amendment formationPrep as multicall(setText())
    let wallet = null
    if (wallets?.length > 0) {
      wallet = await getPrivyWalletClient(wallets.find(w => w.walletClientType === 'embedded') || wallets[0])
    }
    if (!wallet) throw Error('Could not access wallet.')

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

    if (!formState.name) {
      setErrorMessage("Agent needs a name to be registered")
      return
    }

    if (!formState.description) {
      setErrorMessage("Agent needs a description to be registered")
      return
    }

    if (!formState.imageFile && !formState.avatar && !agentModalPrepopulate) {
      setErrorMessage("Agent needs an Avatar image to be registered")
      return
    }

    if (!formState.category) {
      setErrorMessage("Agent needs a category to be registered")
      return
    }

    try {
      await uploadFile()
    } catch (err: any) {
      let errMsg = err?.details || err?.shortMessage || err.message
      setErrorMessage(errMsg)
      return
    }
    const hashableName = getHashableName(formState.name)

    const entityRegistrarDomain = `${hashableName}.ai.${tld}`

    let currentEntityOwner = await checkOwner(publicClient, namehash(entityRegistrarDomain))
    try {
      if (!address) return connectOrCreateWallet()

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
    window.location.href = (`/agent/${hashableName}.ai.${tld}`)
  }

  const getHashableName = (name: string) => {
    let hashableName = name;
    try {
      const regexed = name
        .replace(/[()#"',.&\/]/g, '')
        .replace(/ /g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/[^A-Za-z0-9-]/g, '');
      hashableName = normalize(regexed);
    } catch (err) {
      console.log('ERROR HASHING NAME', name);
      hashableName = name;
    }
    return hashableName
  }

  const createFormationPrep = async (texts: any[]) => {
    if (agentModalPrepopulate && Object.keys(agentModalPrepopulate)?.length > 0) {
      let multicalls: string[] = []
      try {
        const nodehash = namehash(agentModalPrepopulate.entityid)
        multicalls = getChangedRecords(agentModalPrepopulate, formState, mapKeyToRecord).map((x: any) => {
          return encodeFunctionData({
            abi: l1abi,
            functionName: 'setText',
            args: [nodehash, x.key, x.value],
          })
        })
      } catch (err: any) {
        console.log('ERR generating multicalls')
        return {}
      }
      try {
        const resolverAddress = await getResolverAddress(publicClient, agentModalPrepopulate.entityid)
        // Use Resolver multicall(setText[])
        const formationPrep: any = {
          functionName: 'multicall',
          args: [multicalls],
          abi: l1abi,
          address: resolverAddress,
        }
        return formationPrep
      } catch (err: any) {
        console.log('ERR caught in createFormationPrep', err.message)
      }
    }

    let formationData = {}
    try {
      formationData = {
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
    } catch (err: any) {
      console.log('ERR in creating register function calldata', err.message)
    }
    return formationData
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
  let submitText = actions[0]
  if (isAmendment) {
    submitText = "Submit Changes"
  }
  let disabled = actionStep === 2 && !formState.name
  let submitButton = <SubmitButton
    disabled={disabled}
    onClick={() => {
      if (actionStep < 2) {
        setActionStep(actionStep + 1)
      } else {
        handleRegistration()
      }
    }}
  >
    {actionStep < 2 ? "Next" : submitText}
  </SubmitButton>

  if (disabled) {
    submitButton = <Tooltip content={"Registration requires agent name"}>
      <SubmitButton
        disabled={disabled}
        onClick={() => {
          if (actionStep < 2) {
            setActionStep(actionStep + 1)
          } else {
            handleRegistration()
          }
        }}
      >
        {actionStep < 2 ? "Next" : submitText}
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
      <ModalContent ref={modalRef} isExpanded={!breakpoints.isMobile}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2
          style={{
            textAlign: 'center',
            fontSize: '24px',
            marginBottom: '24px',
            fontWeight: 'bold',
          }}
        >
          Add Agent{(formState.name) ? ': ' : ''}
          <span style={{ fontWeight: '900', color: 'var(--color-accent)' }}>
            {formState.name ? `${getHashableName(formState.name.toLowerCase())}.ai.entity.id` : ''}
          </span>
        </h2>

        <CustomizedSteppers activeStep={actionStep} setActiveStep={setActionStep} />

        <StepContainer>
          <>
            {actionStep === 0 && (
              <Step1
                isAmendment={isAmendment}
                isVisible={actionStep === 0}
                formState={formState}
                prepopulate={agentModalPrepopulate}
                handleFieldChange={handleFieldChange}
              />
            )}
            {actionStep === 1 && (
              <Step2
                isAmendment={isAmendment}
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
                isAmendment={isAmendment}
                handleFieldChange={handleFieldChange}
              />
            )}
            {/* {actionStep === 3 && (
              <Step4
                isVisible={actionStep === 3}
                formState={formState}
                prepopulate={agentModalPrepopulate}

                handleFieldChange={handleFieldChange}
              />
            )} */}
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