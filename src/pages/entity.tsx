import { useConnectModal } from '@rainbow-me/rainbowkit'
import { default as axios } from 'axios'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
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

const FooterContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    gap: ${theme.space['3']};
    width: 100%;
    margin: 0 auto;
  `,
)

const registrarNameToKey: { [x: string]: string } = {
  'Public Registry': 'PUB',
  'Delaware USA': 'DL',
  'Wyoming USA': 'WY',
  'British Virgin Islands': 'BVI',
  'Civil Registry USA': 'CIV',
}

const registrarkeyToDomainFull: { [x: string]: string } = {
  PUB: 'public',
  DL: 'DL.US',
  WY: 'WY.US',
  BVI: 'BVI.UK',
  CIV: 'CIV.PUB',
}

const registrarKeyToEntityRegistrationAddress: any = {
  DL: '0x32e9266eb5b61ba355dc22bb50828e3bbfef115d',
  WY: '0x71ed14654c85609c444a0c56b1580acd24e20c04',
  BVI: '0xf940054296c0de06ac0d5163eb0240f98c7b1074',
  PUB: '0xb1863015b31d72adbc566d9ab76c0d6b088d06a0',
  CIV: '0x7b5ca5d3c9b1dc921bd5f37d593407cf3d789d6a',
}

const registrarKeyToType: any = {
  PUB: 'corp',
  DL: 'corp',
  WY: 'corp',
  BVI: 'corp',
  CIV: 'civil',
}

const corpFields: any = {
  standard: {
    description: 'string',
    address: 'string',
    purpose: 'string',
  },
  PUB: {},
  DL: {},
  WY: {},
  BVI: {},
  CIV: {},
}

const additionalTermsFields: any = {
  standard: {
    additional__terms: 'string',
  },
  PUB: {},
  DL: {},
  WY: {},
  BVI: {},
  CIV: {},
}

const partnerFields: any = {
  standard: {
    corp: {
      name: 'string',
      type: 'string',
      address: 'Address',
      physicalAddress: 'string',
      DOB: 'date',
      roles: 'Array',
      lockup: 'Boolean',
      shares: 'number',
    },
    civil: {
      name: 'string',
      address: 'Address',
      physicalAddress: 'string',
      DOB: 'date',
      roles: 'Array',
    },
  },
  PUB: {},
  DL: {},
  WY: {},
  BVI: {},
  CIV: {},
}

const roleTypes: any = {
  standard: {
    corp: ['owner', 'manager', 'spender', 'investor', 'signer'],
    civil: ['manager', 'spender', 'signer'],
  },
  PUB: [],
  DL: [],
  WY: [],
  BVI: [],
  CIV: [],
}

const partnerTypes: any = {
  standard: {
    corp: ['individual', 'entity'],
    civil: ['individual'],
  },
  PUB: [],
  DL: [],
  WY: [],
  BVI: [],
  CIV: [],
}

const typeToRecordKey: any = {
  corp: 'company',
  civil: 'civil',
}

const typesByTemplate: any = {
  '1': 'Partnership',
}

const deployerAddress = '0x259c9c45e1f1002df6191abac7b0fc94b7f9e173'

export default function Page() {
  const { t } = useTranslation('common')
  const router = useRouterWithHistory()
  const entityName = router.query.name as string
  const entityRegistrar = router.query.registrar as string
  const templateId = router.query.template as string

  const isSelf = router.query.connected === 'true'
  const [registrationStep, setRegistrationStep] = useState<number>(1)
  const [profile, setProfile] = useState<any>({})
  const [partners, setPartners] = useState<any[]>([])
  const [errorMessage, setErrorMessage] = useState<string>('')
  const { openConnectModal } = useConnectModal()

  const { address } = useAccount()
  const primary = usePrimaryName({ address: address as Hex })

  const name = isSelf && primary.data?.name ? primary.data.name : entityName
  const [wallet, setWallet] = useState<any>(null)

  const default_registry_domain = 'registry'

  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )

  useEffect(() => {
    setProfile((prevProf: any) => ({
      ...prevProf,
      name: entityName,
      registrar: entityRegistrar,
      type: typesByTemplate[templateId],
    }))
  }, [entityName, entityRegistrar, templateId])

  // 'IMPORTANT - When pulling entity data thats already on chain, get stringified object to see if any changes',

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const newWallet = createWalletClient({
        chain: addEnsContracts(sepolia),
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
    setProfile((prevState: any) => ({ ...prevState, formationDate: d + '/' + m + '/' + y }))
  }, [registrationStep])

  const intakeType: string = registrarKeyToType[registrarNameToKey[entityRegistrar]]

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
        [user.address, user.shares, roleDataBytes],
      )
      return encodedUserData
    })
  }

  const advance = async () => {
    setErrorMessage('')

    if (registrationStep === 3) {
      partners.forEach((partner, idx) => {
        //If wanting to implenent validation on share amounts and percentages...
      })
    }

    if (registrationStep < 5) {
      setRegistrationStep(registrationStep + 1)
    } else if (openConnectModal && !address) {
      await openConnectModal()
    } else {
      const texts: any[] = generateTexts(partners, profile, entityName, intakeType)

      const jurisSubdomainString = registrarkeyToDomainFull[registrarNameToKey[entityRegistrar]]

      const entityNameToPass =
        name.toLowerCase().split(' ').join('-') +
        '-' +
        Date.now()
          .toString()
          .slice(Date.now().toString().length - 6)
      const entityId = entityNameToPass + '.' + jurisSubdomainString + '.' + default_registry_domain
      const label = labelhash(entityNameToPass)
      const namehashToPass = namehash(entityId)

      const entityRegistrarAddress =
        registrarKeyToEntityRegistrationAddress[registrarNameToKey[entityRegistrar]]

      let contentHash = ''
      try {
        // Upload text as json to ipfs
        const jsonString = JSON.stringify(texts, null, 2) // `null, 2` is for pretty-printing the JSON
        // Step 2: Create a Blob from the JSON string
        const blob = new Blob([jsonString], { type: 'application/json' })
        const ipfsData = await pinFileToIPFS(blob)
        contentHash = ipfsData.IpfsHash
        console.log('IPFS:', contentHash)
      } catch (err: any) {
        console.log('ERROR IPFS!', err)
      }

      try {
        const deployer: any = getContract({
          address: deployerAddress,
          abi: parseAbi([
            'function formEntity(string,bool,address,bytes[],bytes4[],bytes[]) external',
          ]),
          client: wallet,
        })
        const generatedData = generateRecordCallArray({
          texts,
          namehash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbx',
          contentHash: 'ipfs://' + contentHash,
        })
        const constitutionData = generatedData.map(
          (x) =>
            '0x' + x.split('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbx')[1],
        )
        const methods = generatedData.map(
          (x) => x.split('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbx')[0],
        )
        const userDataBytes = await generateUserDataBytes(partners)
        const registerChaserTx = await deployer.write.formEntity([
          entityNameToPass,
          true,
          entityRegistrarAddress,
          constitutionData,
          methods,
          userDataBytes,
        ])
        console.log(await publicClient?.waitForTransactionReceipt({ hash: registerChaserTx }))
      } catch (err: any) {
        setErrorMessage(err.details)
        return
      }
      router.push(
        '/' +
          entityNameToPass +
          '.' +
          registrarkeyToDomainFull[registrarNameToKey[entityRegistrar]] +
          '.registry',
      )
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
        data={{ name, registrarKey: registrarNameToKey[entityRegistrar] }}
        fields={corpFields}
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
        data={{ name, registrarKey: registrarNameToKey[entityRegistrar] }}
        partnerTypes={partnerTypes}
        partnerFields={partnerFields}
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
        data={{ name, registrarKey: registrarNameToKey[entityRegistrar] }}
        intakeType={intakeType}
        roleTypes={roleTypes}
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
        data={{ name, registrarKey: registrarNameToKey[entityRegistrar] }}
        fields={additionalTermsFields}
        step={registrationStep}
        profile={profile}
        setProfile={setProfile}
        publicClient={publicClient}
      />
    )
  }

  if (registrationStep === 5) {
    const texts: any[] = generateTexts(partners, profile, entityName, intakeType)
    // console.log(texts, partners)

    content = (
      <div>
        <Typography fontVariant="headingTwo" style={{ marginBottom: '12px' }}>
          {name}
        </Typography>
        <Constitution formationData={texts} />
        <Review name={name} profile={profile} partners={partners} />
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
        <div style={{ height: '28px', marginTop: '22px', padding: '24px' }}>
          <Typography style={{ fontSize: '22px', color: 'red' }}>{errorMessage}</Typography>
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
      } else {
        partner[field].forEach((role: string) => {
          texts.push({ key: partnerKey + 'is__' + role, value: 'true' })
        })
      }
    })
  })

  Object.keys(profile).forEach((field) => {
    const key = typeToRecordKey[intakeType] + '__' + field.split(' ').join('__')
    texts.push({ key, value: profile[field] })
  })
  return texts
}

const pinFileToIPFS = async (recordsFileJson: any) => {
  const JWT =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIxZGRiOGFlZi1iNGVhLTRhZGQtOTc4ZC1jOWJkMzBiODcyMzciLCJlbWFpbCI6ImNtMTcyNTk2QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIxNGM0YjdkOWQyZTc0YmFkYjZhZSIsInNjb3BlZEtleVNlY3JldCI6IjBiM2MyMmI4NTdkMjE0YzY2N2QzNWNhYzYwZjc3YjkzNGJlYWQyOTNjMTYwZGJhNDI2YmU0NjljMTVhZDU5YjIiLCJleHAiOjE3NTY0MjYxMzN9.hYxd1tGQ2NySeHJiKlNv1VoRcWEUj5uxPx4RQy-qnFo'
  const formData: any = new FormData()
  const src = 'path/to/file.png'

  const file = null
  formData.append('file', recordsFileJson)

  const pinataMetadata = JSON.stringify({
    name: 'Entity Record',
  })
  formData.append('pinataMetadata', pinataMetadata)

  const pinataOptions = JSON.stringify({
    cidVersion: 0,
  })
  formData.append('pinataOptions', pinataOptions)
  let returnData = null
  try {
    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        Authorization: `Bearer ${JWT}`,
      },
    })
    returnData = res.data
  } catch (error) {
    console.log(error)
  }
  return returnData
}
