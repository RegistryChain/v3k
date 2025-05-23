import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import {
  Address,
  createPublicClient,
  encodeFunctionData,
  getContract,
  http,
  namehash,
  parseAbi,
  zeroAddress,
} from 'viem'
import { sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'

import { Button, Dropdown, Input, mq, Typography } from '@ensdomains/thorin'

import { LegacyDropdown } from '@app/components/@molecules/LegacyDropdown/LegacyDropdown'
import { RegistrarInput } from '@app/components/@molecules/RegistrarInput/RegistrarInput'
import { LeadingHeading } from '@app/components/LeadingHeading'
import { executeWriteToResolver, getRecordData } from '@app/hooks/useExecuteWriteToResolver'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { infuraUrl } from '@app/utils/query/wagmi'
import { normalizeLabel } from '@app/utils/utils'

import contractAddresses from '../../../../../constants/contractAddresses.json'
import entityTypesObj from '../../../../../constants/entityTypes.json'
import l1abi from '../../../../../constants/l1abi.json'
import { ErrorModal } from '@app/components/ErrorModal'

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

const tld = '.entity.id'

export default function JurisDropdown({ domain, setErrorMessage, partners, wallet }: any) {
  const router = useRouterWithHistory()
  const [errorMessage, setLocalErrorMessage] = useState<string>('')

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

  const amendAddPartner = async () => {
    // Take entity name, registrar slug, tld and form the entity.id
    const registrarSlug = entityType?.countryJurisdictionCode
      ? entityType?.countryJurisdictionCode
      : entityType?.countryCode

    if (!registrarSlug) {
      setErrorMessage('No jurisdiction or etity type selected')
      return
    }

    const normalizedLabel = normalizeLabel(entityName)

    const parentDomain = (normalizedLabel + '.' + registrarSlug + tld)?.toLowerCase()

    const parentNodeHash = namehash(normalize(domain))
    const partnerIdx = partners?.length || 0

    const textsToChange = [
      { key: `partner__[${partnerIdx}]__name`, value: entityName },
      { key: `partner__[${partnerIdx}]__entityid`, value: parentDomain },
      { key: `partner__[${partnerIdx}]__nodehash`, value: parentNodeHash },
      { key: `partner__[${partnerIdx}]__type`, value: entityType?.entityTypeName || 'company' },
    ]

    const multicalls: string[] = []
    textsToChange.forEach((x: any) => {
      multicalls.push(
        encodeFunctionData({
          abi: l1abi,
          functionName: 'setText',
          args: [namehash(domain), x.key, x.value],
        }),
      )
    })
    // Use Resolver multicall(setText[])
    const formationPrep: any = {
      functionName: 'multicall',
      args: [multicalls],
      abi: l1abi,
      address: contractAddresses['DatabaseResolver'],
    }

    try {
      const returnVal = await executeWriteToResolver(wallet, formationPrep, null)
      if (returnVal) {
        const existingRecord = await getRecordData({ entityid: parentDomain, needsSchema: false })
        if (!existingRecord || JSON.stringify(existingRecord) === '{}') {
          if (entityName && entityJurisdiction && entityType?.entityTypeName) {
            // ADD A MESSAGE HERE: YOU WILL NOW BE TAKEN TO REGISTRYCHAIN TO FORM YOUR NEW ENTITY
            window.open(
              `https://entity.id/entity?name=${entityName}&type=${entityType.ELF}`,
              '_blank'
            )
            window.location.reload() // Should this reload? or bring user to the Developer page for profile selection?
          }
        }
      }
    } catch (err: any) {
      handleError(err)
    }
  }

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

  const handleError = (err: any) => {
    if (err.shortMessage === 'User rejected the request.') return
    let errMsg = err?.details
    if (!errMsg) errMsg = err?.shortMessage
    if (!errMsg) errMsg = err.message
    setLocalErrorMessage(errMsg)
    setErrorMessage(errMsg)
  }

  return (
    <>
      <ErrorModal
        errorMessage={errorMessage || ''}
        setErrorMessage={setLocalErrorMessage}
        breakpoints={breakpoints}
      />
      <Container>
        <Stack>
          <div style={{ width: '100%', padding: '0 48px' }}>
            <Input
              data-testid="name-table-header-search"
              size="medium"
              label="search"
              value={entityName}
              onChange={(e) => {
                setEntityName(e.target.value)
              }}
              hideLabel
              placeholder={'Parent Entity Name'}
            />
          </div>
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
            onClick={() => amendAddPartner()}
            style={{ width: breakpoints.xs && !breakpoints.sm ? '100%' : '220px', height: '48px' }}
            shape="square"
            size="small"
          >
            Submit Formation
          </Button>
        </Stack>
      </Container>
    </>
  )
}
