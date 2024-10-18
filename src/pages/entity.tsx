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

  const [registrationStep, setRegistrationStep] = useState<number>(1)
  const [profile, setProfile] = useState<any>({})
  const [partners, setPartners] = useState<any[]>([])
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
      name: entityName,
      registrar: entityTypeObj?.formationJurisdiction
        ? entityTypeObj?.formationJurisdiction + ' - ' + entityTypeObj.formationCountry
        : entityTypeObj?.formationCountry,
      type: entityTypeObj?.entityTypeName,
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

  useEffect(() => {
    const m = new Date().getMonth() + 1
    const d = new Date().getDate()
    const y = new Date().getFullYear()
    setProfile((prevState: any) => ({ ...prevState, formation__date: d + '/' + m + '/' + y }))
  }, [registrationStep])
  const intakeType = 'company'

  async function generateUserDataBytes(userData: any) {
    return userData.map((user: any, idx: any) => {
      let roleDataBytes: any = '0x'
      user.roles.forEach((role: any) => {
        const encRole = encodeAbiParameters([{ type: 'string' }], [role])
        const roleHash = keccak256(encRole).slice(2, 66)
        roleDataBytes += roleHash
      })

      const encodedUserData = encodeAbiParameters(
        [{ type: 'address' }, { type: 'uint256' }, { type: 'bytes' }],
        [user.wallet__address, user.shares, roleDataBytes],
      )
      return encodedUserData
    })
  }

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

      const jurisSubdomainString = code

      const entityNameToPass = name.toLowerCase().split(' ').join('-')
      const entityId = entityNameToPass + '.' + jurisSubdomainString + '.' + default_registry_domain

      const entityRegistrarAddress =
        contractAddresses[code + tld] || contractAddresses['public.registry']

      try {
        const deployer: any = getContract({
          address: contractAddresses.EntityFactory as Address,
          abi: parseAbi(['function formEntity(string,address,bytes[],bytes4[],bytes[]) external']),
          client: wallet,
        })
        const generatedData = generateRecordCallArray({
          texts,
          namehash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbx',
        })
        const constitutionData = generatedData.map(
          (x) =>
            '0x' + x.split('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbx')[1],
        )
        const methods = generatedData.map(
          (x) => x.split('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbx')[0],
        )
        const userDataBytes = await generateUserDataBytes(partners)
        const registerChaserTx = await deployer.write.formEntity(
          [entityNameToPass, entityRegistrarAddress, constitutionData, methods, userDataBytes],
          '1000000',
        )
        console.log(await publicClient?.waitForTransactionReceipt({ hash: registerChaserTx }))
      } catch (err: any) {
        console.log('ERROR FORMING ENTITY', err.message)
        setErrorMessage(err.message)
        return
      }
      router.push('/entity/' + entityNameToPass + '.' + code + tld)
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
        <Constitution formationData={texts} template={template} setTemplate={setTemplate} />
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
  const texts = [{ key: 'name', value: entityName }]
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
    texts.push({ key, value: profile[field] })
  })
  return texts
}
