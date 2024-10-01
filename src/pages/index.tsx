import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  Address,
  createPublicClient,
  getContract,
  http,
  namehash,
  parseAbi,
  zeroAddress,
} from 'viem'
import { sepolia } from 'viem/chains'

import { Button, Dropdown, mq, Typography } from '@ensdomains/thorin'

import { EntityInput } from '@app/components/@molecules/EntityInput/EntityInput'
import FaucetBanner from '@app/components/@molecules/FaucetBanner'
import Hamburger from '@app/components/@molecules/Hamburger/Hamburger'
import { LegacyDropdown } from '@app/components/@molecules/LegacyDropdown/LegacyDropdown'
import { RegistrarInput } from '@app/components/@molecules/RegistrarInput/RegistrarInput'
import { SearchInput } from '@app/components/@molecules/SearchInput/SearchInput'
import { LeadingHeading } from '@app/components/LeadingHeading'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { infuraUrl } from '@app/utils/query/wagmi'

import RegistryChainLogoFull from '../assets/RegistryChainLogoFull.svg'
import contractAddresses from '../constants/contractAddresses.json'
import registrarsObj from '../constants/registrars.json'

const GradientTitle = styled.h1(
  ({ theme }) => css`
    font-size: ${theme.fontSizes.headingTwo};
    text-align: center;
    font-weight: 800;
    background-image: ${theme.colors.gradients.accent};
    background-repeat: no-repeat;
    background-size: 110%;
    /* stylelint-disable-next-line property-no-vendor-prefix */
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    margin: 0;

    ${mq.sm.min(css`
      font-size: ${theme.fontSizes.headingOne};
    `)}
  `,
)

const SubtitleWrapper = styled.div(
  ({ theme }) => css`
    max-width: calc(${theme.space['72']} * 2 - ${theme.space['4']});
    line-height: 150%;
    text-align: center;
    margin-bottom: ${theme.space['3']};
  `,
)

const Container = styled.div(
  () => css`
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  `,
)

const Stack = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-gap: ${theme.space['3']};
    gap: ${theme.space['3']};
  `,
)

const StyledENS = styled.div(
  ({ theme }) => css`
    height: ${theme.space['8.5']};
  `,
)

const LogoAndLanguage = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: ${theme.space['4']};
    flex-gap: ${theme.space['4']};
  `,
)

const StyledLeadingHeading = styled(LeadingHeading)(
  () => css`
    ${mq.sm.min(css`
      display: none;
    `)}
  `,
)

export default function Page() {
  const { t } = useTranslation('common')
  const router = useRouterWithHistory()

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(infuraUrl('sepolia')),
  })

  const [entityName, setEntityName] = useState<string>('')
  const [registrar, setRegistrarInput] = useState<string>('')
  const [entityType, setEntityType] = useState<any>('')
  const [nameAvailable, setNameAvailable] = useState<Boolean>(false)
  const registrars: any = registrarsObj

  useEffect(() => {
    if (entityName.length >= 2 && registrar.length > 0) {
      entityIsAvailable(registrars[registrar].registrationAddressKey, entityName)
    }
  }, [entityName, registrar])

  const entityIsAvailable = async (registrar: string, entityName: string) => {
    const client: any = publicClient
    const registry: any = await getContract({
      client,
      abi: parseAbi(['function owner(bytes32 node) view returns (address)']),
      address: contractAddresses.RegistryChain as Address,
    })
    if (entityName) {
      const owner = await registry.read.owner([namehash(entityName + '.' + registrar)])
      if (owner === zeroAddress) {
        setNameAvailable(true)
      } else {
        setNameAvailable(false)
      }
    }
  }

  const advance = () => {
    //Either register name or move to entity information form
    if (entityName && registrars[registrar].name && entityType) {
      router.push('/entity', {
        name: entityName,
        registrar: registrar,
        type: entityType,
      })
    }
  }

  let nameAvailableElement = null
  if (entityName.length >= 2 && registrar.length > 0) {
    nameAvailableElement = nameAvailable ? (
      <Typography style={{ color: 'lime' }}>
        {entityName}.{registrars[registrar].registrationAddressKey} is available!
      </Typography>
    ) : (
      <Typography style={{ color: 'red' }}>
        {entityName}.{registrars[registrar].registrationAddressKey} is NOT available!
      </Typography>
    )
  }

  let entityTypeSelection = null
  if (registrars[registrar] || registrar === '') {
    entityTypeSelection = (
      <LegacyDropdown
        style={{ maxWidth: '100%', textAlign: 'left' }}
        inheritContentWidth={true}
        size={'medium'}
        label={entityType || 'Entity Type Selection'}
        items={registrars[registrar]?.entityTypes?.map((x: any) => ({
          label: x,
          color: 'blue',
          onClick: () => setEntityType(x),
          value: x,
        }))}
      />
    )
  }

  return (
    <>
      <Head>
        <title>RegistryChain</title>
      </Head>
      <StyledLeadingHeading>
        <LogoAndLanguage>
          <StyledENS as={RegistryChainLogoFull} />
        </LogoAndLanguage>
        <Hamburger />
      </StyledLeadingHeading>
      <FaucetBanner />
      <Container>
        <Stack>
          <GradientTitle>{t('title')}</GradientTitle>
          <SubtitleWrapper>
            <Typography fontVariant="large" color="grey">
              {t('description')}
            </Typography>
          </SubtitleWrapper>
          <EntityInput
            field={'entityName'}
            value={entityName}
            setValue={(x: string) => setEntityName(x)}
          />
          <RegistrarInput
            registrars={registrars}
            field={'registrar'}
            value={registrar}
            setValue={(regKey: string) => {
              setRegistrarInput(regKey)
            }}
          />
          <div key={'div1en'} style={{ width: '100%', textAlign: 'left', padding: '0 48px' }}>
            {entityTypeSelection}
          </div>
          <div
            key={'div2en'}
            style={{
              width: '100%',
              textAlign: 'left',
              paddingLeft: '48px',
              paddingRight: '48px',
              height: '40px',
            }}
          >
            {nameAvailableElement}
          </div>
          <Button
            style={{ width: '220px' }}
            shape="rounded"
            size="small"
            disabled={
              !nameAvailable || entityName.length < 2 || registrar.length === 0 || !entityType
                ? true
                : false
            }
            onClick={() => advance()}
          >
            {t('action.formEntity')}
          </Button>
        </Stack>
      </Container>
    </>
  )
}
