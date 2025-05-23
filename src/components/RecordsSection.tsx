import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaChevronDown } from 'react-icons/fa'
import styled, { css } from 'styled-components'
import { isAddress, namehash, zeroAddress } from 'viem'

import { Button, mq, Typography } from '@ensdomains/thorin'

import { cacheableComponentStyles } from '@app/components/@atoms/CacheableComponent'
import { normalizeLabel } from '@app/utils/utils'

import AgentInfo from './AgentInfo'
import { CompanyAddresses } from './CompanyAddresses'
import { CompanyPartners } from './CompanyPartners'
import { TabWrapper as OriginalTabWrapper } from './pages/profile/TabWrapper'

const TabWrapper = styled(OriginalTabWrapper)(
  () => css`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
  `,
  cacheableComponentStyles,
)

const MessageContainer = styled.div(
  ({ theme }) => css`
    background-color: ${theme.colors.yellowSurface};
    color: ${theme.colors.textPrimary};
    font-size: ${theme.fontSizes.small};
    padding: ${theme.space['2']} ${theme.space['4']};
    text-align: center;
    font-weight: ${theme.fontWeights.bold};
    margin-bottom: 12px;
    border-radius: 16px;
  `,
)

const AllRecords = styled.div(
  ({ theme }) => css`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    gap: ${theme.space['3']};
    ${mq.sm.min(css`
      gap: ${theme.space['6']};
    `)}
  `,
)

const RecordSection = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: stretch;
    gap: ${theme.space['2']};
    flex-gap: ${theme.space['2']};
  `,
)

const SectionHeader = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: ${theme.space.full};
    padding: 0 ${theme.radii.large};
  `,
)

const SectionTitleContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    width: 100%;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: ${theme.space['4']};
    flex-gap: ${theme.space['4']};
  `,
)

const SectionTitle = styled(Typography)(
  ({ theme }) => css`
    color: black;
    display: flex;
    align-items: center;
    gap: ${theme.space['2']};
  `,
)

const SectionSubtitle = styled(Typography)(
  ({ theme }) => css`
    color: ${theme.colors.textTertiary};
  `,
)
const tld = 'entity.id'

export const RecordsSection = ({
  fields,
  compareToOldValues,
  addressesObj,
  domainName,
  owner,
}: {
  fields: any
  domainName: any
  addressesObj?: any
  owner?: any
  compareToOldValues: Boolean
}) => {
  const { t } = useTranslation('profile')
  const filteredCompanyData = useMemo(() => {
    const allowedFields = ['description', 'avatar', 'location', 'purpose', 'url', 'entityid']
    return Object.keys(fields)?.filter(
      (field) => (field.includes('entity') || allowedFields.includes(field)) && fields[field],
    )
  }, [fields])

  let addressSection = null
  if (addressesObj) {
    addressSection = <CompanyAddresses addressesObj={addressesObj} />
  }

  let partnerSection = null
  if (fields.partners?.length > 0) {
    partnerSection = (
      <CompanyPartners partners={fields.partners} compareToOldValues={compareToOldValues} />
    )
  }

  let childrenSection = null
  if (fields.children?.length > 0) {
    childrenSection = (
      <CompanyPartners partners={fields.children} compareToOldValues={compareToOldValues} />
    )
  }

  let sectionsDisplay = null
  if (filteredCompanyData?.length > 0) {
    // const ownerAddress =
    //   owner ||
    //   addressesObj?.find(
    //     (x: any) => x.key === 'Owner Address' || x.key === 'Owner Address',
    //   )?.value
    const multisigAddress = addressesObj?.find((x: any) => x.key === 'Multisig Address')?.value
    let headerSection = (
      <SectionTitleContainer>
        <SectionTitleContainer style={{ display: 'flex', gap: '1', justifyContent: 'flex-start' }}>
          <SectionSubtitle data-testid="text-amount">
            {filteredCompanyData ? filteredCompanyData?.length : 0}{' '}
            {t('records.label', { ns: 'common' })}
          </SectionSubtitle>
        </SectionTitleContainer>
      </SectionTitleContainer>
    )

    if (isAddress(multisigAddress) && multisigAddress !== zeroAddress) {
      headerSection = (
        <SectionTitleContainer>
          <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
            {'Entity Details'}
          </SectionTitle>
          <SectionSubtitle data-testid="text-amount">
            {filteredCompanyData ? filteredCompanyData?.length : 0}{' '}
            {t('records.label', { ns: 'common' })}
          </SectionSubtitle>
        </SectionTitleContainer>
      )
    }
    sectionsDisplay = (
      <div key={'companydiv'} style={{ width: '100%' }}>
        <RecordSection key={'section1SubRecordscompany'}>
          <SectionHeader>{headerSection}</SectionHeader>
          <AgentInfo
            filteredCompanyData={filteredCompanyData}
            fields={fields}
            compareToOldValues={compareToOldValues}
          />
        </RecordSection>
      </div>
    )
  }

  return (
    <>
      <TabWrapper data-testid="records-tab">
        <AllRecords>
          <Accordion defaultExpanded>
            <AccordionSummary>
              <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                Entity Details <FaChevronDown />
              </SectionTitle>
            </AccordionSummary>
            <AccordionDetails>
              <RecordSection key={'section1Records'}>{sectionsDisplay}</RecordSection>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary>
              <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                Addresses <FaChevronDown />
              </SectionTitle>
            </AccordionSummary>
            <AccordionDetails>{addressSection}</AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded>
            <AccordionSummary>
              <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                Partners <FaChevronDown />
              </SectionTitle>
            </AccordionSummary>
            <AccordionDetails>{partnerSection}</AccordionDetails>
          </Accordion>

          {childrenSection && (
            <Accordion defaultExpanded>
              <AccordionSummary>
                <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                  Child Entities <FaChevronDown />
                </SectionTitle>
              </AccordionSummary>
              <AccordionDetails>{childrenSection}</AccordionDetails>
            </Accordion>
          )}

          {/* {changeLogSection && (
            <Accordion defaultOpen>
              <Collapsible.Trigger>
                <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                  Entity Changes <FaChevronDown />
                </SectionTitle>
              </Collapsible.Trigger>
              <AccordionDetails>{changeLogSection}</AccordionDetails>
            </Accordion>
          )} */}
        </AllRecords>
      </TabWrapper>
    </>
  )
}
