import { useConnectModal } from '@rainbow-me/rainbowkit'
import { default as axios } from 'axios'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  Address,
  createPublicClient,
  createWalletClient,
  custom,
  encodeAbiParameters,
  getContract,
  http,
  isAddress,
  isAddressEqual,
  keccak256,
  labelhash,
  namehash,
  toHex,
  zeroAddress,
  zeroHash,
  type Hex,
} from 'viem'
import { sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'
import { useAccount } from 'wagmi'

import { generateRecordCallArray, packetToBytes } from '@ensdomains/ensjs/utils'
import { Button, Modal, Spinner, Typography } from '@ensdomains/thorin'

import { ErrorModal } from '@app/components/ErrorModal'
import AddPartners from '@app/components/pages/entityCreation/AddPartners'
import Constitution from '@app/components/pages/entityCreation/Constitution'
import EntityInfo from '@app/components/pages/entityCreation/EntityInfo'
import Roles from '@app/components/pages/entityCreation/Roles'
import { RecordsSection } from '@app/components/RecordsSection'
import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import { checkOwner } from '@app/hooks/useCheckOwner'
import { executeWriteToResolver, getRecordData } from '@app/hooks/useExecuteWriteToResolver'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { infuraUrl, wagmiConfig } from '@app/utils/query/wagmi'
import { normalizeLabel } from '@app/utils/utils'

import contractAddressesObj from '../constants/contractAddresses.json'
import entityTypesObj from '../constants/entityTypes.json'
import l1abi from '../constants/l1abi.json'
import schemaObj from '../constants/schema.json'

const FooterContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    gap: ${theme.space['3']};
    width: 100%;
    margin: 0 auto;
  `,
)
const SpinnerContainer = styled.div<{ $showBorder?: boolean }>(
  ({ theme, $showBorder }) => css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${theme.space['15']};
    ${$showBorder && `border-top: 1px solid ${theme.colors.border};`}
  `,
)

const tld = 'registrychain.com'

export default function Page() {
  const { t } = useTranslation('common')
  const router = useRouterWithHistory()
  const { address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const breakpoints = useBreakpoint()

  const entityName = router.query.name as string
  const entityType = router.query.type as string
  const normalizedLabel = normalizeLabel(entityName)

  const isSelf = router.query.connected === 'true'

  const [project, setProject] = useState('REGISTRYCHAIN')
  const [registrationStep, setRegistrationStep] = useState<number>(1)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [wallet, setWallet] = useState<any>(null)
  const [schemaFields, setSchemaFields] = useState<any>({})
  const [emptyPartner, setEmptyPartner] = useState({})
  const [recordLoaded, setRecordLoaded] = useState(false)

  const primary = usePrimaryName({ address: address as Hex })
  const name = isSelf && primary.data?.name ? primary.data.name : entityName

  const entityTypeObj: any = useMemo(
    () => entityTypesObj.find((x) => x.ELF === entityType),
    [entityType],
  )
  const companyRegistrar = entityTypeObj?.countryJurisdictionCode || 'public'
  const entityRegistrarDomain =
    normalizedLabel && companyRegistrar
      ? normalize(normalizedLabel + '.' + companyRegistrar + '.' + tld)
      : ''
  const entityPublicDomain = normalizedLabel ? normalize(normalizedLabel + '.public.' + tld) : ''

  const contractAddresses: any = contractAddressesObj
  let schema: any = schemaObj
  schema = schema[project].schema

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )

  const code = entityTypeObj?.countryJurisdictionCode
    ? entityTypeObj?.countryJurisdictionCode?.split('-')?.join('.')
    : entityTypeObj?.countryCode

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
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
    const m = new Date().getMonth() + 1
    const d = new Date().getDate()
    const y = new Date().getFullYear()
    setSchemaFields((prevState: any) => ({
      ...prevState,
      entity__formation__date: {
        ...prevState.entity__formation__date,
        setValue: y + '-' + m + '-' + d,
      },
    }))
  }, [registrationStep])
  const intakeType = 'entity'

  const getSchemaFields = async () => {
    try {
      const fields = await getRecordData({ domain: entityRegistrarDomain })
      setSchemaFields({
        ...fields,
        partners:
          fields.partners?.length > 1
            ? fields.partners.slice(0, fields.partners.length - 1)
            : fields.partners,
        name: { ...fields.name, setValue: fields?.name?.setValue || entityName },
        entity__name: {
          ...fields.entity__name,
          setValue: fields?.entity__name?.setValue || entityName,
        },
        entity__registrar: { ...fields.entity__registrar, setValue: companyRegistrar },
        entity__type: { ...fields.entity__type, setValue: entityTypeObj?.entityTypeName },
        entity__code: { ...fields.entity__code, setValue: entityType },
        entity__selected__model: { ...fields.entity__selected__model, setValue: 'Model 1' },
      })
      setEmptyPartner(fields.partners?.[fields.partners.length - 1])
    } catch (err) {
      console.log(err)
    }

    setRecordLoaded(true)
  }

  useEffect(() => {
    if (entityName && entityType) {
      getSchemaFields()
    }
  }, [entityName, entityType])

  const claimEntity = async () => {
    const formationPrep: any = {
      functionName: 'transfer',
      args: [namehash(entityRegistrarDomain), address],
      abi: l1abi,
      address: contractAddresses['DatabaseResolver'],
    }

    const formationCallback: any = {
      functionName: 'registerEntityWithOffchain',
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
          name: 'registerEntityWithOffchain',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      address: contractAddresses[(companyRegistrar || 'public') + '.' + tld],
      args: [],
    }
    const registerChaserTx = await executeWriteToResolver(wallet, formationPrep, formationCallback)
    const transactionRes = await publicClient?.waitForTransactionReceipt({
      hash: registerChaserTx,
    })

    return transactionRes
  }

  const registerEntity = async () => {
    const texts: any[] = generateTexts(schemaFields)
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
      address: contractAddresses[(companyRegistrar || 'public') + '.' + tld],
      client: wallet,
    })

    // If there is no owner to the domain, make the register. If there is an owner skip register
    let currentEntityOwner = await checkOwner(publicClient, namehash(entityRegistrarDomain))
    if (!currentEntityOwner || currentEntityOwner === zeroAddress) {
      const tx = await registrarContract.write.registerEntity([labelhash(normalizedLabel), address])
      const txReceipt = await publicClient?.waitForTransactionReceipt({
        hash: tx,
      })
      if (txReceipt?.status === 'reverted') {
        throw Error('Transaction failed - contract error')
      } else {
        currentEntityOwner = contractAddresses[(companyRegistrar || 'public') + '.' + tld]
      }
    }

    // Should check if EITHER public reg is the domain owner OR connect addr is owner and has approved
    // If false, prevent the registration
    if (
      !isAddressEqual(currentEntityOwner, address as Address) &&
      !isAddressEqual(
        currentEntityOwner,
        contractAddresses[(companyRegistrar || 'public') + '.' + tld],
      )
    ) {
      throw Error('The user does not have permission to deploy contracts for this domain')
    }

    const constitutionData = texts.map((x) =>
      encodeAbiParameters([{ type: 'string' }, { type: 'string' }], [x.key, x.value]),
    )

    const formationPrep: any = {
      functionName: 'register',
      args: [
        toHex(packetToBytes(entityName)),
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
      address: contractAddresses[(companyRegistrar || 'public') + '.' + tld],
      args: [],
    }
    const registerChaserTx = await executeWriteToResolver(wallet, formationPrep, formationCallback)
    const transactionRes = await publicClient?.waitForTransactionReceipt({
      hash: registerChaserTx,
    })
    if (transactionRes?.status === 'reverted') {
      throw Error('Transaction failed - contract error')
    }
    router.push('/entity/' + normalizedLabel + '.' + code + '.' + tld)
    return
  }

  const validatePartners = (fieldsToValidate: string[]) => {
    if (project === 'REGISTRYCHAIN') return false
    let blockAdvance = false
    const cumulativePartnerVals: any = {}
    schemaFields.partners.forEach((partner: any) => {
      //If wanting to implenent validation on share amounts and percentages...
      fieldsToValidate.forEach((field) => {
        const msgField = partner[field].label
        const trueType = partner[field].type.split('?').join('').toLowerCase()
        let errMsg = ''
        const isOptional = partner[field].type.split('?')?.length > 1
        let failedCheck = typeof partner[field].setValue !== trueType

        if (trueType === 'string') {
          failedCheck = partner[field].setValue?.length === 0
        }
        if (trueType === 'number') {
          failedCheck = Number.isNaN(Number(partner[field].setValue))
          if (!failedCheck) {
            if (!cumulativePartnerVals[field]) cumulativePartnerVals[field] = 0
            cumulativePartnerVals[field] += partner[field].setValue
          }
        }
        if (trueType === 'array') {
          failedCheck = !Array.isArray(partner[field].setValue) && !!partner[field].setValue
        }
        if (trueType === 'date') {
          const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
          const dateValue = partner[field].setValue
          failedCheck = !dateRegex.test(dateValue)
        }
        if (trueType === 'address' || field === 'wallet__address') {
          failedCheck =
            !isAddress(partner[field].setValue) ||
            (partner[field].setValue === zeroAddress && !isOptional)
          if (failedCheck) errMsg = `${msgField} must be a valid EVM address`
        }
        if (isOptional && !partner[field].setValue) {
          failedCheck = false
        }
        if (failedCheck) {
          if (!errMsg) {
            errMsg = `'${msgField}' field is invalid. It should be of type '${partner[field].type}'`
          } else if (!partner[field].setValue) {
            errMsg = `'${msgField}' is a required field`
          }
          setErrorMessage(errMsg)
          blockAdvance = true
        }
        if (registrationStep === 3 && !(partner.roles?.length > 0) && !partner.shares) {
          setErrorMessage(partner.name + ' must have at least one role or be a shareholder.')
          blockAdvance = true
        }
      })
    })

    Object.keys(cumulativePartnerVals)?.forEach((key: string) => {
      if (
        key === 'shares' &&
        !blockAdvance &&
        !cumulativePartnerVals[key] &&
        registrationStep === 3
      ) {
        setErrorMessage(
          'No shares have been assigned to partners of the entity. At least one partner must be a shareholder ',
        )
        blockAdvance = true
      }
    })

    return blockAdvance
  }

  const advance = async () => {
    let blockAdvance = false
    try {
      if (registrationStep === 1 || registrationStep >= 5) {
        const stepKeys = Object.keys(schemaFields).filter((x) => schema.corpFields.includes(x))

        stepKeys.forEach((field) => {
          let errMsg = ''
          let failedCheck = false
          const msgField = schemaFields[field].label
          let typeVal = schemaFields[field].type.toLowerCase()
          if (schemaFields[field].type === 'Array') {
            typeVal = 'object'
          }
          if (typeof schemaFields[field].setValue !== typeVal) {
            errMsg = `'${msgField}' is invalid. It should be of type '${schemaFields[field].type}'`
            failedCheck = true
          }
          if (!schemaFields[field].setValue) {
            errMsg = `'${msgField}' is a required field.`
            failedCheck = true
          }
          if (failedCheck) {
            setErrorMessage(errMsg)
            blockAdvance = true
          }
        })
      }
      if (registrationStep === 2 || registrationStep >= 5) {
        blockAdvance = validatePartners([
          'name',
          'type',
          'wallet__address',
          'DOB',
          'physical__address',
        ])
      }
      if (registrationStep === 3 || registrationStep >= 5) {
        blockAdvance = validatePartners(['roles', 'shares'])
      }
      if (registrationStep === 4 || registrationStep >= 5) {
      }
    } catch (err: any) {
      blockAdvance = true
      let errMsg = err?.details
      if (!errMsg) errMsg = err?.shortMessage
      if (!errMsg) errMsg = err.message

      setErrorMessage(errMsg)
    }

    if (blockAdvance) {
      return
    }

    setErrorMessage('')

    if (registrationStep < 5) {
      setRegistrationStep(registrationStep + 1)
    } else if (openConnectModal && !address) {
      await openConnectModal()
    } else {
      try {
        if (schemaFields.sourcePageURL?.setValue) {
          // If entity is from an import
          await claimEntity()
          router.push('/entity/' + normalizedLabel + '.' + code + '.' + tld)
          return
        }

        await registerEntity()
      } catch (err: any) {
        console.log('ERROR', err.details, 'n', err.message)
        if (err.message === 'Cannot convert undefined to a BigInt') {
          router.push('/entity/' + normalizedLabel + '.' + code + '.' + tld)
          return
        }
        if (err.shortMessage === 'User rejected the request.') return
        let errMsg = err?.details
        if (!errMsg) errMsg = err?.shortMessage
        if (!errMsg) errMsg = err.message

        setErrorMessage(errMsg)
        return
      }
    }
  }

  const previous = () => {
    setErrorMessage('')
    if (registrationStep > 1) {
      setRegistrationStep(registrationStep - 1)
    }
  }

  let content = null
  let advanceLabel = t('action.next')
  if (registrationStep === 5) {
    if (schemaFields.sourcePageURL?.setValue) {
      advanceLabel = 'Claim Entity'
    } else {
      advanceLabel = t('action.formEntity')
    }
  }
  let buttons = (
    <FooterContainer style={{ marginTop: '36px' }}>
      <Button
        disabled={registrationStep <= 1}
        colorStyle="accentSecondary"
        onClick={() => previous()}
      >
        Back
      </Button>
      <Button
        disabled={false}
        onClick={() => {
          advance()
        }}
      >
        {advanceLabel}
      </Button>
    </FooterContainer>
  )
  if (registrationStep === 1) {
    if (recordLoaded) {
      const stepKeys = Object.keys(schemaFields).filter((x) => schema.corpFields.includes(x))
      content = (
        <EntityInfo
          data={{ name: schemaFields?.entity__name?.setValue || name, registrarKey: code }}
          step={registrationStep}
          fields={stepKeys.map((key) => ({ key, ...schemaFields[key] }))}
          setField={(key: string, value: any) =>
            setSchemaFields({ ...schemaFields, [key]: { ...schemaFields[key], setValue: value } })
          }
          publicClient={publicClient}
        />
      )
    } else {
      content = (
        <SpinnerContainer>
          <Spinner size="large" color="accent" />
        </SpinnerContainer>
      )
    }
  }

  if (registrationStep === 2) {
    content = (
      <AddPartners
        data={{ name: schemaFields?.entity__name?.setValue || name, registrarKey: code }}
        breakpoints={breakpoints}
        canChange={true}
        partnerTypes={schema.partnerTypes}
        emptyPartner={emptyPartner}
        intakeType={intakeType}
        partners={schemaFields.partners}
        setPartners={(partnersData: any[]) =>
          setSchemaFields({ ...schemaFields, partners: partnersData })
        }
        publicClient={publicClient}
      />
    )
  }

  if (registrationStep === 3) {
    content = (
      <Roles
        data={{ name: schemaFields?.entity__name?.setValue || name, registrarKey: code }}
        breakpoints={breakpoints}
        canChange={true}
        intakeType={intakeType}
        roleTypes={schema.roles}
        partners={schemaFields.partners}
        setPartners={(partnersData: any[]) =>
          setSchemaFields({ ...schemaFields, partners: partnersData })
        }
        publicClient={publicClient}
      />
    )
  }

  if (registrationStep === 4) {
    const stepKeys = Object.keys(schemaFields).filter((x) =>
      schema.additionalTermsFields.includes(x),
    )
    content = (
      <EntityInfo
        data={{ name: schemaFields?.entity__name?.setValue || name, registrarKey: code }}
        fields={stepKeys.map((key) => ({ key, ...schemaFields[key] }))}
        setField={(key: string, value: any) =>
          setSchemaFields({ ...schemaFields, [key]: { ...schemaFields[key], setValue: value } })
        }
        step={registrationStep}
        publicClient={publicClient}
      />
    )
  }

  if (registrationStep === 5) {
    // If there is no owner to the domain, make the register. If there is an owner skip register
    content = (
      <div>
        <Typography fontVariant="headingTwo" style={{ marginBottom: '12px' }}>
          {schemaFields?.entity__name?.setValue || name}
        </Typography>
        <Constitution
          breakpoints={breakpoints}
          formationData={schemaFields}
          model={schemaFields.entity__selected__model}
          setModel={(modelId: string) =>
            setSchemaFields({
              ...schemaFields,
              entity__selected__model: {
                ...schemaFields.entity__selected__model,
                setValue: modelId,
              },
            })
          }
        />
        <div>
          <RecordsSection
            fields={schemaFields}
            domainName={''}
            compareToOldValues={false}
            claimEntity={null}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Entity Formation</title>
        <meta name="description" content={'RegistryChain Entity Formation'} />
      </Head>
      <div>
        <ErrorModal
          errorMessage={errorMessage}
          setErrorMessage={setErrorMessage}
          breakpoints={breakpoints}
        />
        {content}
        {buttons}
      </div>
    </>
  )
}

const generateTexts = (fields: any) => {
  // THE PURPOSE OF THIS FUNCTION IS TO CONVERT THE ENTIRE DATA OBJECT COLLECTED INTO TEXT RECORDS FOR ALL RESOLVER TYPES
  const texts: any[] = []
  fields.partners.forEach((partner: any, idx: any) => {
    const partnerKey = 'partner__[' + idx + ']__'
    Object.keys(partner).forEach((field) => {
      if (partner[field].type === 'address' || field === 'wallet__address') {
        if (!isAddress(partner[field]?.setValue)) {
          texts.push({ key: partnerKey + field, value: zeroAddress })
        } else {
          texts.push({ key: partnerKey + field, value: partner[field]?.setValue })
        }
      } else if (partner[field].type === 'boolean') {
        texts.push({ key: partnerKey + field, value: partner[field]?.setValue ? 'true' : 'false' })
      } else if (partner[field].type === 'Date') {
        const m = new Date().getMonth() + 1
        const d = new Date().getDate()
        const y = new Date().getFullYear()
        texts.push({ key: partnerKey + field, value: y + '-' + m + '-' + d })
      } else if (field !== 'roles') {
        texts.push({ key: partnerKey + field, value: partner[field]?.setValue })
      } else if (partner[field]?.setValue) {
        partner[field]?.setValue.forEach((role: string) => {
          texts.push({ key: partnerKey + 'is__' + role, value: 'true' })
        })
      }
    })
  })

  Object.keys(fields).forEach((key) => {
    if (key !== 'partners') {
      texts.push({ key: key, value: fields[key]?.setValue })
    }
  })
  return texts
}
