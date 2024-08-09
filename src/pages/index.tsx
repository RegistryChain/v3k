import Head from 'next/head'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { Button, Dropdown, mq, Typography } from '@ensdomains/thorin'

import FaucetBanner from '@app/components/@molecules/FaucetBanner'
import Hamburger from '@app/components/@molecules/Hamburger/Hamburger'
import { SearchInput } from '@app/components/@molecules/SearchInput/SearchInput'
import { LeadingHeading } from '@app/components/LeadingHeading'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'

import ENSFull from '../assets/ENSFull.svg'
import { EntityInput } from '@app/components/@molecules/EntityInput/EntityInput'
import { createPublicClient, getContract, http, namehash, parseAbi, zeroAddress } from 'viem'
import { sepolia } from 'viem/chains'
import { infuraUrl } from '@app/utils/query/wagmi'
import { useEffect, useState } from 'react'

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
    transport: http(infuraUrl('sepolia'))
    })

  const [entityName, setEntityName] = useState<string>("")
  const [registrar, setRegistrar] = useState<string>("Public Registry")

  const [nameAvailable, setNameAvailable] = useState<Boolean>(false)

  useEffect(() => {
    if (entityName.length >= 2 && registrar.length > 0) {
      entityIsAvailable(registrar, entityName)
    }
  }, [entityName, registrar])

  useEffect(() => {
    console.log(entityName+"."+registrar, " is available? ", nameAvailable)
  }, [nameAvailable])

  const entityIsAvailable = async (registrar: string, entityName: string) => {
    const client = publicClient
    const registry = await getContract({client, abi: parseAbi(['function owner(bytes32 node) view returns (address)']), address: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e"})
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
    router.push("/entity", {name: entityName, registrar: registrar})
  }

  let nameAvailableElement = null
  if (entityName.length >= 2 && registrar.length > 0) {
    // nameAvailableElement = nameAvailable ? (<Typography style={{color: "lime"}}>{entityName}.{registrar} is available!</Typography>) : (<Typography style={{color: "red"}}>{entityName}.{registrar} is NOT available!</Typography>)
  }

  return (
    <>
      <Head>
        <title>RegistryChain</title>
      </Head>
      <StyledLeadingHeading>
        <LogoAndLanguage>
          <StyledENS as={ENSFull} />
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
          <EntityInput field={"entityName"} value={entityName} setValue={(x: string) => setEntityName(x)}/>
          <EntityInput field={"registrar"} value={registrar} setValue={() => null} />
          <div style={{width: "100%", textAlign: "left", paddingLeft: "48px", paddingRight: "48px", height: "40px"}}>
            {nameAvailableElement}
          </div>
        <Button 
          style={{width: "220px"}}         
          shape="rounded"
          size="small"
          disabled={(!nameAvailable || entityName.length < 2 || registrar.length === 0) ? true: false}
          onClick={() => advance()}
          >
          Form Entity
        </Button>
        </Stack>
      </Container>
    </>
  )
}
