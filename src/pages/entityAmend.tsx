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

import { addEnsContracts } from '@ensdomains/ensjs'
import { generateRecordCallArray } from '@ensdomains/ensjs/utils'
import { Button, Typography } from '@ensdomains/thorin'

import AddPartners from '@app/components/pages/entityCreation/AddPartners'
import Constitution from '@app/components/pages/entityCreation/Constitution'
import CorpInfo from '@app/components/pages/entityCreation/CorpInfo'
import { Review } from '@app/components/pages/entityCreation/Review'
import Roles from '@app/components/pages/entityCreation/Roles'
import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { infuraUrl } from '@app/utils/query/wagmi'

import contractAddressesObj from '../constants/contractAddresses.json'
import entityTypesObj from '../constants/entityTypes.json'
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
  const [profile, setProfile] = useState<any>({})
  const [partners, setPartners] = useState<any[]>([])

  const [initialRecords, setInitialRecords]: any = useState([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [wallet, setWallet] = useState<any>(null)
  const [template, setTemplate] = useState<any>('default')

  const primary = usePrimaryName({ address: address as Hex })
  const name = isSelf && primary.data?.name ? primary.data.name : entityName

  const entityTypeObj: any = useMemo(
    () => entityTypesObj.find((x) => x.ELF === entityType),
    [entityType],
  )

  const default_registry_domain = 'registry'

  const contractAddresses: any = contractAddressesObj
  const schema: any = schemaObj

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )

  const code = entityTypeObj?.countryJurisdictionCode
    ? entityTypeObj.countryJurisdictionCode.split('-').join('.')
    : entityTypeObj?.countryCode

  useEffect(() => {
    setProfile((prevProf: any) => ({
      ...prevProf,
      registrar: entityTypeObj?.formationJurisdiction
        ? entityTypeObj?.formationJurisdiction + ' - ' + entityTypeObj.formationCountry
        : entityTypeObj?.formationCountry,
      entity__code: entityType,
    }))
  }, [entityName, entityType])

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
    if (name) {
      const registry: any = getContract({
        address: contractAddresses.RegistryChain as Address,
        abi: parseAbi(['function owner(bytes32) view returns (address)']),
        client: publicClient,
      })
      try {
        const multisigAddress = await registry.read.owner([namehash(name)])
        // const multisig = await getMultisig(multisigAddress)
        // const memberManagerAddress = await multisig.read.entityMemberManager()

        // setEntityMemberManager(memberManagerAddress)
        setMultisigAddress(multisigAddress)
      } catch (e) {}
    }
  }

  // async function generateUserDataBytes(userData: any) {
  //   return userData.map((user: any, idx: any) => {
  //     let roleDataBytes: any = '0x'
  //     user.roles.forEach((role: any) => {
  //       const encRole = encodeAbiParameters([{ type: 'string' }], [role])
  //       const roleHash = keccak256(encRole).slice(2, 66)
  //       roleDataBytes += roleHash
  //     })

  //     const encodedUserData = encodeAbiParameters(
  //       [{ type: 'address' }, { type: 'uint256' }, { type: 'bytes' }],
  //       [user.wallet__address, user.shares, roleDataBytes],
  //     )
  //     return encodedUserData
  //   })
  // }

  const parseSavedTexts = (texts: any[]) => {
    const partnersArr: any[] = []
    const profile: any = {}

    texts.forEach(({ key, value }: any) => {
      // Match keys for partner fields
      const partnerMatch = key.match(/^partner__\[(\d+)\]__(.+)$/)
      const roleMatch = key.match(/^partner__\[(\d+)\]__is__(.+)$/)

      // Match keys for profile fields
      const profileMatch = key.match(new RegExp(`^${intakeType}__(.+)$`))

      if (partnerMatch && !roleMatch) {
        const partnerIndex = parseInt(partnerMatch[1], 10)
        const field = partnerMatch[2]

        // Ensure the partner array is large enough to hold this partner
        partnersArr[partnerIndex] = partnersArr[partnerIndex] || {}

        if (field === 'address') {
          partnersArr[partnerIndex][field] = value === zeroAddress ? '' : value
        } else if (value === 'true' || value === 'false') {
          partnersArr[partnerIndex][field] = value === 'true'
        } else {
          partnersArr[partnerIndex][field] = value
        }
      }
      if (roleMatch) {
        const partnerIndex = parseInt(roleMatch[1], 10)
        const role = roleMatch[2]

        partnersArr[partnerIndex] = partnersArr[partnerIndex] || {}
        partnersArr[partnerIndex].roles = partnersArr[partnerIndex].roles || []
        partnersArr[partnerIndex].roles.push(role)
      }
      if (profileMatch) {
        const field = profileMatch[1].split('__').join(' ') // Convert back field name
        profile[field] = value || ''
      }
    })

    const returnObj = {
      partners: partnersArr.filter((x) => !!x.name || isAddress(x.address)) || [],
      profile,
    }
    return returnObj
  }

  const getRecords = async () => {
    try {
      const resolver: any = await getContract({
        client: publicClient,
        abi: parseAbi([
          'function multicallView(address contract, bytes[] memory data) view returns (bytes[] memory)',
          'function text(bytes32,string memory) view returns (string memory)',
        ]),
        address: contractAddresses.PublicResolver as Address,
      })

      const keys = [
        'LEI',
        'name',
        'partner__[0]__name',
        'partner__[0]__type',
        'partner__[0]__wallet__address',
        'partner__[0]__physical__address',
        'partner__[0]__DOB',
        'partner__[0]__is__manager',
        'partner__[0]__lockup',
        'partner__[0]__shares',
        'partner__[1]__name',
        'partner__[1]__type',
        'partner__[1]__wallet__address',
        'partner__[1]__physical__address',
        'partner__[1]__DOB',
        'partner__[1]__is__signer',
        'partner__[1]__lockup',
        'partner__[1]__shares',
        'partner__[2]__name',
        'partner__[2]__type',
        'partner__[2]__wallet__address',
        'partner__[2]__physical__address',
        'partner__[2]__DOB',
        'partner__[2]__is__signer',
        'partner__[2]__lockup',
        'partner__[2]__shares',
        'partner__[3]__name',
        'partner__[3]__type',
        'partner__[3]__wallet__address',
        'partner__[3]__physical__address',
        'partner__[3]__DOB',
        'partner__[3]__is__signer',
        'partner__[3]__lockup',
        'partner__[3]__shares',
        'partner__[4]__name',
        'partner__[4]__type',
        'partner__[4]__wallet__address',
        'partner__[4]__physical__address',
        'partner__[4]__DOB',
        'partner__[4]__is__signer',
        'partner__[4]__lockup',
        'partner__[4]__shares',
        'partner__[5]__name',
        'partner__[5]__type',
        'partner__[5]__wallet__address',
        'partner__[5]__physical__address',
        'partner__[5]__DOB',
        'partner__[5]__is__signer',
        'partner__[5]__lockup',
        'partner__[5]__shares',
        'company__name',
        'company__entity__code',
        'company__registrar',
        'company__type',
        'company__description',
        'company__address',
        'company__purpose',
        'company__formation__date',
        'company__lockup__days',
        'company__additional__terms',
        'company__selected__template',
      ]

      const encodes = keys.map((text) => {
        return encodeFunctionData({
          abi: [
            {
              inputs: [
                {
                  internalType: 'bytes32',
                  name: 'node',
                  type: 'bytes32',
                },
                {
                  internalType: 'string',
                  name: 'key',
                  type: 'string',
                },
              ],
              name: 'text',
              outputs: [
                {
                  internalType: 'string',
                  name: '',
                  type: 'string',
                },
              ],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'text',
          args: [namehash(name), text],
        })
      })

      const recordsBuilt: any[] = [{ key: 'domain', value: name }]
      let encResArr: any[] = []
      try {
        encResArr = await resolver.read.multicallView([contractAddresses.PublicResolver, encodes])
      } catch (e) {}

      encResArr.forEach((x: any, idx: any) => {
        try {
          recordsBuilt.push({
            key: keys[idx],
            value: decodeAbiParameters([{ type: 'string' }], x)[0],
          })
        } catch (e) {}
      })

      setInitialRecords(recordsBuilt)

      const recs = parseSavedTexts(recordsBuilt)

      setProfile(recs.profile)
      setPartners(recs.partners)
    } catch (err) {
      console.log('AXIOS CATCH ERROR', err)
    }
  }

  useEffect(() => {
    getRecords()
    getMultisigAddr()
  }, [name])

  const validatePartners = () => {
    let blockAdvance = false
    const cumulativePartnerVals: any = {}
    partners.forEach((partner, idx) => {
      //If wanting to implenent validation on share amounts and percentages...
      const schemaToReturn = {
        ...schema['partnerFields']?.standard?.[intakeType],
        ...schema['partnerFields']?.[code]?.[intakeType],
      }

      const fields = Object.keys(partner)?.filter(
        (field) => Object.keys(schemaToReturn)?.includes(field),
      )

      fields.forEach((field) => {
        const msgField = field.split('__').join(' ')
        const trueType = schemaToReturn[field].split('?').join('')
        let typeVal = trueType
        const isOptional = schemaToReturn[field].split('?')?.length > 1
        let failedCheck = typeof partner[field] !== trueType

        if (schemaToReturn[field] === 'string') {
          failedCheck = partner[field]?.length === 0
        }
        if (schemaToReturn[field] === 'number') {
          failedCheck = Number.isNaN(Number(partner[field]))
          if (!failedCheck) {
            if (!cumulativePartnerVals[field]) cumulativePartnerVals[field] = 0
            cumulativePartnerVals[field] += partner[field]
          }
        }
        if (schemaToReturn[field] === 'array') {
          failedCheck = !Array.isArray(partner[field]) && !!partner[field]
        }
        if (trueType === 'date') {
          const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
          const dateValue = partner[field]
          failedCheck = !dateRegex.test(dateValue)
        }
        if (trueType === 'address') {
          failedCheck =
            !isAddress(partner[field]) || (partner[field] === zeroAddress && !isOptional)
        }
        if (isOptional && !partner[field]) {
          failedCheck = false
        }
        if (failedCheck) {
          let errMsg = `'${msgField}' field is invalid. It should be of type '${schemaToReturn[field]}'`
          if (!partner[field]) {
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
        const schemaToReturn = {
          ...schema['corpFields'].standard,
          ...schema['corpFields']?.[code],
        }

        const fields = Object.keys(schemaToReturn)?.filter(
          (field) => Object.keys(profile)?.includes(field),
        )

        fields.forEach((field) => {
          let errMsg = ''
          let failedCheck = false
          const msgField = field.split('__').join(' ')
          let typeVal = schemaToReturn[field]
          if (schemaToReturn[field] === 'array') {
            typeVal = 'object'
          }
          if (typeof profile[field] !== typeVal) {
            errMsg = `'${msgField}' is invalid. It should be of type '${schemaToReturn[field]}'`
            failedCheck = true
          }
          if (!profile[field]) {
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
        blockAdvance = validatePartners()
      }
      if (registrationStep === 3 || registrationStep >= 5) {
        blockAdvance = validatePartners()
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
      profile.selected__template = template
      const texts: any[] = generateTexts(partners, profile, entityName, intakeType)
      // Take texts Object.keys(texts)
      //Init changes array
      const changedRecords: any[] = []
      // map through text array
      texts.forEach((obj) => {
        // If the key is not in inital records, add the key/val to changes array
        const correspondingOriginalRecord = initialRecords.find((x: any) => x.key === obj.key)
        // If the val of the corresponding key is different in initialRecords, add the key/val to changes array
        if (!correspondingOriginalRecord || correspondingOriginalRecord.value !== obj.value) {
          changedRecords.push(obj)
        }
      })

      const entityNameToPass = name.toLowerCase().split(' ').join('-')

      // const entityRegistrarAddress =
      //   contractAddresses[code + tld] || contractAddresses['public.registry']

      if (changedRecords.length === 0) return

      try {
        const multisig: any = getContract({
          address: multisigAddress as Address,
          abi: parseAbi([
            'function submitMulticallTransaction(address,bytes32,string,bytes[]) external',
          ]),
          client: wallet,
        })

        // IMPORTANT - switch out manager hash and make call to registrar contracts to see what roles would work with the proposed tx
        const roleHash = '0x9a57c351532c19ba0d9d0f5f5524a133d80a3ebcd8b10834145295a87ddce7ce'

        const constitutionData2 = generateRecordCallArray({
          namehash: namehash(entityNameToPass),
          texts: changedRecords,
        })

        const submitChangesTx = await multisig.write.submitMulticallTransaction([
          contractAddresses.PublicResolver,
          roleHash,
          'update company constitution',
          constitutionData2,
        ])
        console.log(await publicClient?.waitForTransactionReceipt({ hash: submitChangesTx }))
      } catch (err: any) {
        console.log('ERROR FORMING ENTITY', err.message)
        setErrorMessage(err.message)
        return
      }

      router.push('/entity/' + entityNameToPass, { tab: 'actions' })
    }
  }

  const previous = () => {
    setErrorMessage('')
    if (registrationStep > 1) {
      setRegistrationStep(registrationStep - 1)
    }
  }

  let content = null
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
        {registrationStep < 5 ? t('action.next') : t('action.formEntity')}
      </Button>
    </FooterContainer>
  )

  if (registrationStep === 1) {
    content = (
      <CorpInfo
        data={{ name, registrarKey: code }}
        fields={schema.corpFields}
        step={registrationStep}
        profile={profile}
        setProfile={setProfile}
        publicClient={publicClient}
      />
    )
  }

  if (registrationStep === 2) {
    content = (
      <AddPartners
        data={{ name, registrarKey: code }}
        canChange={false}
        partnerTypes={schema.partnerTypes}
        partnerFields={schema.partnerFields}
        intakeType={intakeType}
        partners={partners}
        setPartners={setPartners}
        publicClient={publicClient}
      />
    )
  }

  if (registrationStep === 3) {
    content = (
      <Roles
        data={{ name, registrarKey: code }}
        canChange={false}
        intakeType={intakeType}
        roleTypes={schema.roles}
        profile={profile}
        setProfile={setProfile}
        partners={partners}
        setPartners={setPartners}
        publicClient={publicClient}
      />
    )
  }

  if (registrationStep === 4) {
    content = (
      <CorpInfo
        data={{ name, registrarKey: code }}
        fields={schema.additionalTermsFields}
        step={registrationStep}
        profile={profile}
        setProfile={setProfile}
        publicClient={publicClient}
      />
    )
  }

  if (registrationStep === 5) {
    const texts: any[] = generateTexts(partners, profile, entityName, intakeType)

    content = (
      <div>
        <Typography fontVariant="headingTwo" style={{ marginBottom: '12px' }}>
          {name}
        </Typography>
        <Constitution
          breakpoints={breakpoints}
          formationData={texts}
          template={template}
          setTemplate={setTemplate}
        />
        <Review
          name={name}
          profile={profile}
          partners={partners}
          setErrorMessage={setErrorMessage}
        />
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
        <div style={{ height: '28px', marginTop: '22px', padding: '24px', width: '100%' }}>
          <Typography style={{ fontSize: '22px', color: 'red', textAlign: 'center' }}>
            {errorMessage}
          </Typography>
        </div>
        {content}
        {buttons}
      </div>
    </>
  )
}

const generateTexts = (partners: any, profile: any, entityName: any, intakeType: any) => {
  const texts: any[] = []
  partners.forEach((partner: any, idx: any) => {
    const partnerKey = 'partner__[' + idx + ']__'
    Object.keys(partner).forEach((field) => {
      if (field === 'address') {
        if (!isAddress(partner[field])) {
          texts.push({ key: partnerKey + field, value: zeroAddress })
        } else {
          texts.push({ key: partnerKey + field, value: partner[field] })
        }
      } else if (typeof partner[field] === 'boolean') {
        texts.push({ key: partnerKey + field, value: partner[field] ? 'true' : 'false' })
      } else if (field !== 'roles') {
        texts.push({ key: partnerKey + field, value: partner[field] })
      } else if (partner[field]) {
        partner[field].forEach((role: string) => {
          texts.push({ key: partnerKey + 'is__' + role, value: 'true' })
        })
      }
    })
  })

  Object.keys(profile).forEach((field) => {
    const key = intakeType + '__' + field.split(' ').join('__')
    texts.push({ key, value: profile[field] || '' })
  })
  return texts
}
