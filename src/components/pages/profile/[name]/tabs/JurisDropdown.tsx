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
import { LeadingHeading } from '@app/components/LeadingHeading'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { infuraUrl } from '@app/utils/query/wagmi'

import contractAddresses from '../../../../../constants/contractAddresses.json'
import entityTypesObj from '../../../../../constants/entityTypes.json'
import RegistryChainLogoFull from '../assets/RegistryChainLogoFull.svg'

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
    width: 60%;
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

const tld = '.registrychain.com'

export default function JurisDropdown() {
  const { t } = useTranslation('common')
  const router = useRouterWithHistory()

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(infuraUrl('sepolia')),
  })
  const breakpoints = useBreakpoint()

  const [entityName, setEntityName] = useState<string>('')
  const [entityJurisdiction, setEntityJurisdiction] = useState<string>('')
  const [entityType, setEntityType] = useState<any>({})
  const [nameAvailable, setNameAvailable] = useState<Boolean>(false)

  useEffect(() => {
    if (entityName.length >= 2 && entityJurisdiction.length > 0) {
      entityIsAvailable(entityJurisdiction + tld, entityName)
    }
  }, [entityName, entityJurisdiction])

  const entityIsAvailable = async (entityJurisdiction: string, entityName: string) => {
    // const client: any = publicClient
    // const registry: any = await getContract({
    //   client,
    //   abi: parseAbi(['function owner(bytes32 node) view returns (address)']),
    //   address: contractAddresses.RegistryChain as Address,
    // })
    // if (entityName) {
    //   const owner = await registry.read.owner([namehash(entityName + '.' + entityJurisdiction)])
    //   if (owner === zeroAddress) {
    //     setNameAvailable(true)
    //   } else {
    //     setNameAvailable(false)
    //   }
    // }
  }

  const advance = () => {
    //Either register name or move to entity information form
    if (entityName && entityJurisdiction && entityType?.entityTypeName) {
      router.push('/entity', {
        name: entityName,
        type: entityType.ELF,
      })
    }
  }

  const permittedJurisdictions = ['public', 'us-wy']

  let nameAvailableElement = null
  if (entityName.length >= 2 && entityJurisdiction.length > 0) {
    nameAvailableElement = nameAvailable ? (
      <Typography style={{ color: 'lime' }}>
        {entityName}.{entityJurisdiction + tld} is available!
      </Typography>
    ) : (
      <Typography style={{ color: 'red' }}>
        {entityName}.{entityJurisdiction + tld} is NOT available!
      </Typography>
    )
  }

  const [entityTypesAvailable, setEntityTypesAvailable]: any = useState([])
  useEffect(() => {
    setEntityType({})
    setEntityTypesAvailable(
      entityTypesObj.filter((obj) => {
        const code = obj.countryJurisdictionCode ? obj.countryJurisdictionCode : obj.countryCode
        return code === entityJurisdiction
      }),
    )
  }, [entityJurisdiction])

  let entityTypeSelection = null
  if (entityJurisdiction || entityJurisdiction === '') {
    entityTypeSelection = (
      <LegacyDropdown
        style={{ maxWidth: '100%', textAlign: 'left' }}
        inheritContentWidth={true}
        size={'medium'}
        label={
          entityType.entityTypeName?.length > 30
            ? entityType.entityTypeName?.slice(0, 30) + '...'
            : entityType.entityTypeName || 'Entity Type Selection'
        }
        items={entityTypesAvailable.map((x: any, idx: any) => ({
          key: x.entityTypeName + idx,
          label:
            x.entityTypeName?.length > 30
              ? x.entityTypeName?.slice(0, 30) + '...'
              : x.entityTypeName || 'Entity Type Selection',
          color: 'blue',
          onClick: () => setEntityType(x),
          value: x.entityTypeName,
        }))}
      />
    )
  }

  return (
    <>
      <Container>
        <Stack>
          <RegistrarInput
            entityTypes={entityTypesObj}
            field={'Jurisdiction'}
            value={entityJurisdiction}
            setValue={(regKey: string) => {
              setEntityJurisdiction(regKey)
            }}
            permittedJurisdictions={permittedJurisdictions}
          />
          <div
            key={'div1en'}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: breakpoints.xs && !breakpoints.sm ? '0' : '0 48px',
            }}
          >
            {entityTypeSelection}
          </div>
          {breakpoints.sm ? (
            <div
              key={'div2en'}
              style={{
                width: '100%',
                textAlign: 'left',
                paddingLeft: '48px',
                paddingRight: '48px',
                height: '12px',
              }}
            ></div>
          ) : null}
          <Button
            style={{ width: breakpoints.xs && !breakpoints.sm ? '100%' : '220px', height: '48px' }}
            shape="square"
            size="small"
            disabled={true}
          >
            Submit Formation
          </Button>
        </Stack>
      </Container>
    </>
  )
}
