import { useConnectModal } from '@rainbow-me/rainbowkit'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  Address,
  createPublicClient,
  createWalletClient,
  custom,
  decodeAbiParameters,
  encodeAbiParameters,
  encodeFunctionData,
  getContract,
  http,
  isAddress,
  keccak256,
  labelhash,
  namehash,
  parseAbi,
  stringToBytes,
  zeroAddress,
  type Hex,
} from 'viem'
import { sepolia } from 'viem/chains'
import { useAccount, useClient } from 'wagmi'

import { generateRecordCallArray } from '@ensdomains/ensjs/utils'
import { Button, Typography } from '@ensdomains/thorin'

import { ErrorModal } from '@app/components/ErrorModal'
import AddPartners from '@app/components/pages/entityCreation/AddPartners'
import Constitution from '@app/components/pages/entityCreation/Constitution'
import EntityInfo from '@app/components/pages/entityCreation/EntityInfo'
import Roles from '@app/components/pages/entityCreation/Roles'
import { RecordsSection } from '@app/components/RecordsSection'
import { roles } from '@app/constants/members'
import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import { getRecordData } from '@app/hooks/useExecuteWriteToResolver'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { infuraUrl } from '@app/utils/query/wagmi'

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

const tld = '.registry'

export default function Page() {
  const { t } = useTranslation('common')
  const router = useRouterWithHistory()
  const { address } = useAccount()
  const { openConnectModal } = useConnectModal()
  const entityName = router.query.name as string
  const entityType = router.query.type as string
  const isSelf = router.query.connected === 'true'
  const breakpoints = useBreakpoint()

  const [multisigAddress, setMultisigAddress] = useState('')
  const [entityMemberManager, setEntityMemberManager] = useState('')
  const [registrationStep, setRegistrationStep] = useState<number>(1)
  const [schemaFields, setSchemaFields] = useState<any>({})
  const [emptyPartner, setEmptyPartner] = useState({})

  const [errorMessage, setErrorMessage] = useState<string>('')
  const [wallet, setWallet] = useState<any>(null)

  const primary = usePrimaryName({ address: address as Hex })
  const name = isSelf && primary.data?.name ? primary.data.name : entityName

  const entityTypeObj: any = useMemo(
    () => entityTypesObj.find((x) => x.ELF === entityType),
    [entityType],
  )

  const contractAddresses: any = contractAddressesObj
  const schema: any = schemaObj

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia'), {
          retryCount: 0,
          timeout: 10000,
        }),
      }),
    [],
  )

  const code = entityTypeObj?.countryJurisdictionCode
    ? entityTypeObj.countryJurisdictionCode.split('-').join('.')
    : entityTypeObj?.countryCode

  // 'IMPORTANT - When pulling entity data thats already on chain, get stringified object to see if any changes',

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const newWallet = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum),
        account: address,
      })
      setWallet(newWallet)
    } else {
      console.error('Ethereum object not found on window')
    }
  }, [address])

  const intakeType = 'company'

  const getMultisigAddr = async () => {
    const registry: any = getContract({
      address: contractAddresses.RegistryChain as Address,
      abi: parseAbi(['function owner(bytes32) view returns (address)']),
      client: publicClient,
    })
    try {
      const multisigAddress = await registry.read.owner([namehash(name)])
      const multisig: any = getContract({
        address: multisigAddress as Address,
        abi: parseAbi(['function entityMemberManager() external view returns (address)']),
        client: publicClient,
      })
      const memberManagerAddress = await multisig.read.entityMemberManager()
      setEntityMemberManager(memberManagerAddress)
      setMultisigAddress(multisigAddress)
    } catch (err: any) {
      let errMsg = err?.details
      if (!errMsg) errMsg = err?.shortMessage
      if (!errMsg) errMsg = err.message

      setErrorMessage(errMsg)
    }
  }

  const getRecords = async () => {
    try {
      // if (resolver === 'textResolver') {
      //   const encodes = await useTextResolverReadBytes(namehash(name))
      //   const records = await useTextResolverResultsDecoded(publicClient, zeroAddress, encodes)
      //   const fields = await useConvertFlatResolverToFull(records)
      // }

      const fields = await getRecordData({ nodeHash: namehash(name) })

      setEmptyPartner(fields.partners?.[fields.partners.length - 1])
      setSchemaFields({ ...fields, partners: fields.partners.slice(0, fields.partners.length - 1) })
    } catch (err) {
      console.log('AXIOS CATCH ERROR', err)
    }
  }

  useEffect(() => {
    if (name) {
      getRecords()
      getMultisigAddr()
    }
  }, [name])

  const validatePartners = (fieldsToValidate: string[]) => {
    let blockAdvance = false
    const cumulativePartnerVals: any = {}
    schemaFields.partners.forEach((partner: any) => {
      //If wanting to implenent validation on share amounts and percentages...
      fieldsToValidate.forEach((field) => {
        const msgField = partner[field].label
        const trueType = partner[field].type.split('?').join('').toLowerCase()
        let errMsg = ''
        // let typeVal = trueType
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
  const getChangedRecords = (texts: any[]) => {
    const changedRecords: any[] = []

    Object.keys(schemaFields).forEach((key) => {
      if (schemaFields[key].setValue !== schemaFields[key].oldValue) {
        changedRecords.push({ key, value: schemaFields[key].setValue })
      }

      if (key === 'partner') {
        schemaFields.partners.forEach((partner: any, idx: Number) => {
          Object.keys(partner).forEach((partnerKey) => {
            if (partner[partnerKey].setValue !== partner[partnerKey].oldValue) {
              // if (!changedRecords.partners) {
              //   changedRecords.partners = []
              // }
              // changedRecords.partners.push(partner[partnerKey])
            }
          })
        })
      }
    })
    return changedRecords
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
      setErrorMessage(err.details)
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
      const changedRecords = getChangedRecords(schemaFields)

      const entityNameToPass = name.toLowerCase().split(' ').join('-')

      if (changedRecords.length === 0) {
        setErrorMessage('No changes were made to the entity!')
        return
      }

      try {
        const multisig: any = getContract({
          address: multisigAddress as Address,
          abi: parseAbi([
            'function submitMulticallTransaction(address,bytes32,string,bytes[]) external',
          ]),
          client: wallet,
        })

        const roleHash = '0x9a57c351532c19ba0d9d0f5f5524a133d80a3ebcd8b10834145295a87ddce7ce'
        const entityChanges = changedRecords.filter((x) => !x.key.includes('partner'))
        const partnerChanges = changedRecords.filter((x) => x.key.includes('partner'))
        // IMPORTANT - switch out manager hash and make call to registrar contracts to see what roles would work with the proposed tx
        if (partnerChanges.length > 0) {
          const partnerChangesToSubmit: any[] = []
          const sharesChanges = partnerChanges.filter((x) => x.key.includes('shares'))
          const roleChanges = partnerChanges.filter((x) => x.key.includes('is__'))
          const textOnlyChanges = partnerChanges.filter(
            (x) =>
              !sharesChanges.find((y) => y.key === x.key) &&
              !roleChanges.find((y) => y.key === x.key),
          )

          if (textOnlyChanges.length > 0) {
            // textOnlyChanges.forEach((change) => {
            //   const memberIndex = change.key.split('partner__[').join('').split(']')[0]
            //   //check the address associated with that partner from partner__[idx]__wallet__address
            //   const partnerAddress =
            //     initialRecords.find((x: any) =>
            //       x.key.includes('partner__[' + memberIndex + ']__wallet__address'),
            //     )?.value || zeroAddress
            //   const updateMemberDataCall = encodeFunctionData({
            //     abi: parseAbi([
            //       'function updateMemberData(address member, string memory, string memory) external',
            //     ]),
            //     functionName: 'updateMemberData',
            //     args: [partnerAddress, change.key, change.value],
            //   })
            //   partnerChangesToSubmit.push(updateMemberDataCall)
            // })
          }
          if (sharesChanges.length > 0) {
            // ALSO NEED TO ADD RESOLVER CHANGE TO THE MULTICALL
            // updateMemberData
            // sharesChanges.forEach((change) => {
            //   const memberIndex = change.key.split('partner__[').join('').split(']')[0]
            //   //check the address associated with that partner from partner__[idx]__wallet__address
            //   const partnerAddress =
            //     initialRecords.find((x: any) =>
            //       x.key.includes('partner__[' + memberIndex + ']__wallet__address'),
            //     )?.value || zeroAddress
            //   // const updateMemberDataCall = encodeFunctionData({
            //   //   abi: parseAbi([
            //   //     'function updateMemberData(address member, string memory, string memory) external',
            //   //   ]),
            //   //   functionName: 'updateMemberData',
            //   //   args: [partnerAddress, change.key, change.value],
            //   // })
            //   // partnerChangesToSubmit.push(updateMemberDataCall)
            //   if (change.value > Number(change.oldValue)) {
            //     //get the partner memberIndex
            //     const tokensToMint: any = change.value - Number(change.oldValue)
            //     const mintCall = encodeFunctionData({
            //       abi: parseAbi(['function mintShares(address to, uint256 amount) external']),
            //       functionName: 'mintShares',
            //       args: [partnerAddress, tokensToMint],
            //     })
            //     partnerChangesToSubmit.push(mintCall)
            //   } else if (change.value < Number(change.oldValue)) {
            //     const tokensToBurn: any = Number(change.oldValue) - change.value
            //     const burnCall = encodeFunctionData({
            //       abi: parseAbi(['function burnShares(address from, uint256 amount) external']),
            //       functionName: 'burnShares',
            //       args: [partnerAddress, tokensToBurn],
            //     })
            //     partnerChangesToSubmit.push(burnCall)
            //   }
            // })
          }
          if (roleChanges.length > 0) {
            // Update resolver data
            roleChanges.forEach((change) => {
              const memberIndex = change.key.split('partner__[').join('').split(']')[0]
              //check the address associated with that partner from partner__[idx]__wallet__address
              // const partnerAddress =
              //   initialRecords.find((x: any) =>
              //     x.key.includes('partner__[' + memberIndex + ']__wallet__address'),
              //   )?.value || zeroAddress

              // const updateMemberDataCall = encodeFunctionData({
              //   abi: parseAbi([
              //     'function updateMemberData(address member, string memory, string memory) external',
              //   ]),
              //   functionName: 'updateMemberData',
              //   args: [partnerAddress, change.key, change.value],
              // })
              // partnerChangesToSubmit.push(updateMemberDataCall)

              //Update role permissions in member contract
              // if (change.value) {
              //   //add the role on member ocntract
              //   const addRoleCall = encodeFunctionData({
              //     abi: parseAbi(['function addRole(address to, bytes32 roleHash) external']),
              //     functionName: 'addRole',
              //     args: [partnerAddress, roles[change.key.split('is__')[1]]],
              //   })
              //   partnerChangesToSubmit.push(addRoleCall)
              // } else if (!change.value && change.oldValue) {
              //   //Remove the role
              //   const revokeRoleCall = encodeFunctionData({
              //     abi: parseAbi(['function revokeRole(address from, bytes32 roleHash) external']),
              //     functionName: 'revokeRole',
              //     args: [partnerAddress, roles[change.key.split('is__')[1]]],
              //   })
              //   partnerChangesToSubmit.push(revokeRoleCall)
              // }
            })
          }
          const submitChangesTx = await multisig.write.submitMulticallTransaction([
            entityMemberManager,
            roleHash,
            'update company members',
            partnerChangesToSubmit,
          ])
          console.log(await publicClient?.waitForTransactionReceipt({ hash: submitChangesTx }))
        }
        if (entityChanges.length > 0) {
          const formattedChangedRecords = generateRecordCallArray({
            namehash: namehash(entityNameToPass),
            texts: entityChanges,
          })

          const submitChangesTx = await multisig.write.submitMulticallTransaction([
            contractAddresses.DatabaseResolver,
            roleHash,
            'update company constitution',
            formattedChangedRecords,
          ])
          console.log(await publicClient?.waitForTransactionReceipt({ hash: submitChangesTx }))
        }
        router.push('/entity/' + entityNameToPass, { tab: 'actions' })
      } catch (err: any) {
        if (err.shortMessage === 'User rejected the request.') return
        let errMsg = err?.shortMessage
        if (!errMsg) errMsg = err?.details
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

  if (registrationStep === 1) {
    const stepKeys = Object.keys(schemaFields).filter((x) => schema.corpFields.includes(x))
    content = (
      <EntityInfo
        data={{ name, registrarKey: code }}
        step={registrationStep}
        fields={stepKeys.map((key) => ({ key, ...schemaFields[key] }))}
        setField={(key: string, value: any) =>
          setSchemaFields({ ...schemaFields, [key]: { ...schemaFields[key], setValue: value } })
        }
        publicClient={publicClient}
      />
    )
  }

  if (registrationStep === 2) {
    content = (
      <AddPartners
        data={{ name, registrarKey: code }}
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
        data={{ name, registrarKey: code }}
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
        data={{ name, registrarKey: code }}
        fields={stepKeys.map((key) => ({ key, ...schemaFields[key] }))}
        setField={(key: string, value: any) =>
          setSchemaFields({ ...schemaFields, [key]: { ...schemaFields[key], setValue: value } })
        }
        step={registrationStep}
        publicClient={publicClient}
      />
    )
  }
  let changedRecords: any[] = []
  if (registrationStep === 5) {
    changedRecords = getChangedRecords(schemaFields)
    const fieldsOfChangedRecords: any = {}
    changedRecords.forEach((field) => {
      fieldsOfChangedRecords[field.key] = schemaFields[field.key]
    })

    content = (
      <div>
        <Typography fontVariant="headingTwo" style={{ marginBottom: '12px' }}>
          {name}
        </Typography>
        <Constitution
          breakpoints={breakpoints}
          formationData={schemaFields}
          model={schemaFields.company__selected__model}
          setModel={(modelId: string) =>
            setSchemaFields({
              ...schemaFields,
              company__selected__model: {
                ...schemaFields.company__selected__model,
                setValue: modelId,
              },
            })
          }
        />
        {changedRecords.length > 0 ? (
          <div>
            <RecordsSection fields={fieldsOfChangedRecords} compareToOldValues={true} />
          </div>
        ) : null}
      </div>
    )
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
        disabled={changedRecords?.length === 0 && registrationStep === 5}
        onClick={() => {
          advance()
        }}
      >
        {registrationStep < 5 ? t('action.next') : t('action.formEntity')}
      </Button>
    </FooterContainer>
  )

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
