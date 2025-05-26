import Head from 'next/head'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { Address, createPublicClient, getContract, http, zeroHash } from 'viem'
import { sepolia } from 'viem/chains'

import { Button, Dropdown, mq, Typography } from '@ensdomains/thorin'

import { LegacyDropdown } from '@app/components/@molecules/LegacyDropdown/LegacyDropdown'
import { RegistrarInput } from '@app/components/@molecules/RegistrarInput/RegistrarInput'
import { LeadingHeading } from '@app/components/LeadingHeading'
import FeaturedAgents from '@app/components/pages/landingPage/FeaturedAgents'
import TrendingAgents from '@app/components/pages/landingPage/TrendingAgents'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { ModalContext } from '@app/layouts/Basic'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { infuraUrl } from '@app/utils/query/wagmi'

import entityTypesObj from '../constants/entityTypes.json'
import { useGetRating } from '@app/hooks/useGetRating'



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


export default function Page() {
  const tld = '.entity.id'

  const router = useRouterWithHistory()
  const [entityName, setEntityName] = useState<string>('')
  const [entityJurisdiction, setEntityJurisdiction] = useState<string>('')
  const [entityType, setEntityType] = useState<any>({})
  const [nameAvailable, setNameAvailable] = useState<Boolean>(false)

  const { recipientAverages } = useGetRating(zeroHash)


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
      <Head>
        <title>V3K</title>
      </Head>

      <Container>
        <Stack>
          <FeaturedAgents recipientAverages={recipientAverages} />
          <TrendingAgents recipientAverages={recipientAverages} />
          <div style={{ width: "100%" }}>
            <Button onClick={() => router.push("/directory")} style={{ width: "380px", justifySelf: "center" }}>Browse Agents</Button>
          </div>
        </Stack>
      </Container>
    </>
  )
}
