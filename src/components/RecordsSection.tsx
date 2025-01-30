import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { isAddress, namehash, zeroAddress } from 'viem'
import { normalize } from 'viem/ens'

import { Button, mq, Typography } from '@ensdomains/thorin'

import { cacheableComponentStyles } from '@app/components/@atoms/CacheableComponent'
import { AddressRecord, Profile, TextRecord } from '@app/types'
import { normalizeLabel } from '@app/utils/utils'

import { ExclamationSymbol } from './ExclamationSymbol'
import { TabWrapper as OriginalTabWrapper } from './pages/profile/TabWrapper'
import { Collapsible } from '@chakra-ui/react'
import { FaChevronDown } from "react-icons/fa";
import CompanyInfo from './CompanyInfo'
import { CompanyAddresses } from './CompanyAddresses'
import { CompanyPartners } from './CompanyPartners'

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
const tld = 'chaser.finance'

export const RecordsSection = ({
  fields,
  compareToOldValues,
  addressesObj,
  domainName,
  claimEntity,
}: {
  fields: any
  claimEntity: any
  domainName: any
  addressesObj?: any
  compareToOldValues: Boolean
}) => {
  const { t } = useTranslation('profile')
  const router = useRouter()

  const filteredCompanyData = useMemo(
    () => Object.keys(fields)?.filter((field) => field.includes('company')),
    [fields],
  )
  const recordCategoryToTitle: any = {
    company: 'Company Details',
    civil: 'Civil Details',
  }

  let addressSection = null
  if (addressesObj) {
    addressSection = (
      <CompanyAddresses addressesObj={addressesObj} />
    )
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
      <RecordSection key={'section1Partner'}>
        <div style={{ width: '100%' }}>
          <RecordSection key={'section1SubPartner'}>
            <div style={{ width: '100%', paddingLeft: '40px' }}>
              {fields.children.map((record: any, idx: number) => {
                const domain = normalize(
                  normalizeLabel(record?.company__name?.setValue) +
                  '.' +
                  record?.company__registrar?.setValue +
                  '.' +
                  tld,
                )
                return (
                  <RecordSection key={'section1SubSubPartner' + idx}>
                    <SectionHeader>
                      <SectionTitleContainer style={{ cursor: 'pointer' }}>
                        <SectionTitle
                          data-testid="text-heading"
                          fontVariant="bodyBold"
                          onClick={() => router.push('/entity/' + domain)}
                        >
                          <u>{record.company__name.setValue}</u>
                        </SectionTitle>
                      </SectionTitleContainer>
                    </SectionHeader>
                    {Object.keys(record).map((key, idx) => {
                      return (
                        <div
                          key={'embeddedDiv' + idx}
                          style={{
                            display: 'flex',
                            width: '100%',
                            padding: '0.625rem 0.75rem',
                            background: 'hsl(0 0% 96%)',
                            border: '1px solid hsl(0 0% 91%)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                          }}
                        >
                          <Typography style={{ display: 'flex', flex: 1, color: 'grey' }}>
                            {record[key].label}
                          </Typography>
                          <Typography>
                            {Array.isArray(record[key].setValue)
                              ? record[key].setValue.join(', ')
                              : record[key].setValue}
                          </Typography>
                        </div>
                      )
                    })}
                  </RecordSection>
                )
              })}
            </div>
          </RecordSection>
        </div>
      </RecordSection>
    )
  }

  // const categoryTexts =
  //   filteredCompanyData?.filter((text) => text.key.split('__')[0] === 'company') || []
  // const domain = filteredCompanyData?.find((x) => x.key === 'domain')
  // const lei = filteredCompanyData?.find((x) => x.key === 'LEI')

  // if (domain) categoryTexts.unshift(domain)
  // if (lei) categoryTexts.unshift(lei)
  let sectionsDisplay = null
  if (filteredCompanyData?.length > 0) {
    const ownerAddress = addressesObj?.find((x: any) => x.key === 'Owner Address')?.value
    const multisigAddress = addressesObj?.find((x: any) => x.key === 'Multisig Address')?.value
    let headerSection = (
      <SectionTitleContainer>
        <SectionTitleContainer style={{ display: 'flex', gap: '1', justifyContent: 'flex-start' }}>
          <SectionSubtitle data-testid="text-amount">
            {filteredCompanyData ? filteredCompanyData?.length : 0}{' '}
            {t('records.label', { ns: 'common' })}
          </SectionSubtitle>
        </SectionTitleContainer>
        <div style={{ width: '200px' }}>
          {isAddress(ownerAddress) && ownerAddress !== zeroAddress ? null : (
            <Button onClick={() => claimEntity(namehash(domainName))}>CLAIM</Button>
          )}
        </div>
      </SectionTitleContainer>
    )

    if ((isAddress(multisigAddress) && multisigAddress !== zeroAddress) || !claimEntity) {
      headerSection = (
        <SectionTitleContainer>
          <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
            {recordCategoryToTitle['company']}
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
          <CompanyInfo
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

          <Collapsible.Root>
            <Collapsible.Trigger>
              <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                Company Details <FaChevronDown />
              </SectionTitle>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <RecordSection key={'section1Records'}>{sectionsDisplay}</RecordSection>
            </Collapsible.Content>
          </Collapsible.Root>

          <Collapsible.Root>
            <Collapsible.Trigger>
              <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                Addresses <FaChevronDown />
              </SectionTitle>
            </Collapsible.Trigger>
            <Collapsible.Content>
              {addressSection}
            </Collapsible.Content>
          </Collapsible.Root>

          <Collapsible.Root>
            <Collapsible.Trigger>
              <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                Partners <FaChevronDown />
              </SectionTitle>
            </Collapsible.Trigger>
            <Collapsible.Content>
              {partnerSection}
            </Collapsible.Content>
          </Collapsible.Root>

          {childrenSection && (
            <Collapsible.Root>
              <Collapsible.Trigger>
                <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                  Child Entities <FaChevronDown />
                </SectionTitle>
              </Collapsible.Trigger>
              <Collapsible.Content>
                {childrenSection}
              </Collapsible.Content>
            </Collapsible.Root>
          )}
        </AllRecords>
      </TabWrapper>
    </>
  )
}
