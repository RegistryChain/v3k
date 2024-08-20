import { useConnectModal } from '@rainbow-me/rainbowkit'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  createPublicClient,
  createWalletClient,
  custom,
  getContract,
  http,
  labelhash,
  namehash,
  parseAbi,
  stringToBytes,
  type Hex,
} from 'viem'
import { sepolia } from 'viem/chains'
import { useAccount, useClient } from 'wagmi'

import { addEnsContracts } from '@ensdomains/ensjs'
import { createSubname, setRecords } from '@ensdomains/ensjs/wallet'
import { Button, Typography } from '@ensdomains/thorin'

import AddPartners from '@app/components/pages/entityCreation/AddPartners'
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
  'Civil Registry USA': 'CIV-US',
}

const registrarkeyToDomainFull: { [x: string]: string } = {
  PUB: 'PUB',
  DL: 'DL.US',
  WY: 'WY.US',
  BVI: 'BVI.UK',
  'CIV-US': 'CIV.US',
}

const registrarKeyToType: any = {
  PUB: 'corp',
  DL: 'corp',
  WY: 'corp',
  BVI: 'corp',
  'CIV-US': 'civil',
}

const corpFields: any = {
  standard: {
    description: 'string',
    address: 'string',
  },
  PUB: {},
  DL: {},
  WY: {},
  BVI: {},
  'CIV-US': {},
}

const additionalTermsFields: any = {
  standard: {
    additional__terms: 'string',
  },
  PUB: {},
  DL: {},
  WY: {},
  BVI: {},
  'CIV-US': {},
}

const partnerFields: any = {
  standard: {
    corp: {
      name: 'string',
      type: 'string',
      address: 'string',
      DOB: 'date',
      roles: 'Array',
      lockup: 'Boolean',
      shares: 'number',
    },
    civil: {
      name: 'string',
      address: 'string',
      DOB: 'date',
      roles: 'Array',
    },
  },
  PUB: {},
  DL: {},
  WY: {},
  BVI: {},
  'CIV-US': {},
}

const roleTypes: any = {
  standard: {
    corp: ['owner', 'manager', 'spender', 'investor', 'signer'],
    civil: ['signer', 'spender', 'manager'],
  },
  PUB: [],
  DL: [],
  WY: [],
  BVI: [],
  'CIV-US': [],
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
  'CIV-US': [],
}

const typeToRecordKey: any = {
  corp: 'company',
  civil: 'civil',
}

export default function Page() {
  const { t } = useTranslation('common')
  const router = useRouterWithHistory()
  const entityName = router.query.name as string
  const entityRegistrar = router.query.registrar as string
  const entityType = router.query.type as string

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

  const default_registry_domain = 'publicregistry.eth'

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
      type: entityType,
    }))
  }, [entityName, entityRegistrar, entityType])

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

  const intakeType: string = registrarKeyToType[registrarNameToKey[entityRegistrar]]

  const advance = async () => {
    setErrorMessage('')
    if (registrationStep < 5) {
      setRegistrationStep(registrationStep + 1)
    } else if (openConnectModal && !address) {
      await openConnectModal()
    } else {
      const texts: any[] = [{ key: 'name', value: entityName }]
      partners.forEach((partner, idx) => {
        const partnerKey = 'partner__[' + idx + ']__'
        Object.keys(partner).forEach((field) => {
          if (typeof partner[field] === 'boolean') {
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

      // Instantiate Registrant contract
      const subdomainRegistrantAddress = '0x343fc79485cc00cfc46ece70845267368ff2b6ce'
      // create labelhash of the subname
      const publicSubdomainRegistrar: any = getContract({
        address: subdomainRegistrantAddress,
        abi: parseAbi(['function register(bytes32, address, address) external']),
        client: wallet,
      })

      const partnerAddress: `0x${string}` | undefined = address
      const subdomainId =
        name.toLowerCase().split(' ').join('-') +
        '-' +
        Date.now()
          .toString()
          .slice(Date.now().toString().length - 6)
      const entityId = subdomainId + '.' + default_registry_domain
      const label = labelhash(subdomainId)

      try {
        const hashSubdomain = await publicSubdomainRegistrar.write.register(
          [label, partnerAddress, '0x8fade66b79cc9f707ab26799354482eb93a5b7dd'],
          { gas: 1000000n },
        )
        console.log(await publicClient?.waitForTransactionReceipt({ hash: hashSubdomain }))

        const recordTx: any = {
          name: entityId,
          coins: [],
          texts,
          resolverAddress: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD',
        }
        const hashRecords = await setRecords(wallet, recordTx)
        console.log(await publicClient?.waitForTransactionReceipt({ hash: hashRecords }))
      } catch (err: any) {
        setErrorMessage(err.details)
        return
      }
      router.push(
        '/' +
          subdomainId +
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
    content = <Review name={name} profile={profile} partners={partners} />
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
