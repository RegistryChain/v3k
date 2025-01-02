import Link from 'next/link'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { isAddress } from 'viem'

import { Button, mq, Typography } from '@ensdomains/thorin'

import { cacheableComponentStyles } from '@app/components/@atoms/CacheableComponent'
import { AddressRecord, Profile, TextRecord } from '@app/types'

import { ExclamationSymbol } from './ExclamationSymbol'
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
    padding: ${theme.space['4.5']};
    ${mq.sm.min(css`
      padding: ${theme.space['6']};
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
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: ${theme.space['4']};
    flex-gap: ${theme.space['4']};
  `,
)

const SectionTitle = styled(Typography)(
  ({ theme }) => css`
    color: black;
  `,
)

const SectionSubtitle = styled(Typography)(
  ({ theme }) => css`
    color: ${theme.colors.textTertiary};
  `,
)

export const RecordsSection = ({
  fields,
  compareToOldValues,
  addressesObj,
  hasRegistered,
}: {
  fields: any
  addressesObj?: any
  compareToOldValues: Boolean
  hasRegistered: Boolean
}) => {
  const { t } = useTranslation('profile')

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
      <RecordSection key={'section1Address'}>
        <div style={{ width: '100%' }}>
          <RecordSection key={'section1SubAddr'}>
            <SectionHeader>
              <SectionTitleContainer>
                <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                  Addresses
                </SectionTitle>
              </SectionTitleContainer>
            </SectionHeader>
            <div style={{ width: '100%', paddingLeft: '40px' }}>
              <RecordSection key={'section1SubSubadd'}>
                {addressesObj.map((addressObj: any, idx: any) => {
                  return (
                    <div
                      key={'embeddedDivAdd' + idx}
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
                        {addressObj.key}
                      </Typography>
                      {isAddress(addressObj.value) ? (
                        <Link
                          target={'_blank'}
                          href={'https://sepolia.etherscan.io/address/' + addressObj.value}
                        >
                          <u>{addressObj.value}</u>
                        </Link>
                      ) : (
                        <Typography>
                          <u>{addressObj.value}</u>
                        </Typography>
                      )}
                    </div>
                  )
                })}
              </RecordSection>
            </div>
          </RecordSection>
        </div>
      </RecordSection>
    )
  }

  let partnerSection = null
  if (fields.partners?.length > 0) {
    partnerSection = (
      <RecordSection key={'section1Partner'}>
        <div style={{ width: '100%' }}>
          <RecordSection key={'section1SubPartner'}>
            <SectionHeader>
              <SectionTitleContainer>
                <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                  Partners
                </SectionTitle>
              </SectionTitleContainer>
            </SectionHeader>
            <div style={{ width: '100%', paddingLeft: '40px' }}>
              {fields.partners.map((partner: any, idx: number) => {
                return (
                  <RecordSection key={'section1SubSubPartner' + idx}>
                    <SectionHeader>
                      <SectionTitleContainer>
                        <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                          Partner {idx + 1}
                        </SectionTitle>
                      </SectionTitleContainer>
                    </SectionHeader>
                    {Object.keys(partner).map((key, idx) => {
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
                            {partner[key]?.label || key}
                          </Typography>
                          <Typography>
                            {' '}
                            {partner[key].oldValue && compareToOldValues ? (
                              <span
                                style={{
                                  overflow: 'hidden',
                                  color: 'red',
                                  textDecorationLine: 'line-through',
                                }}
                              >
                                {partner[key].oldValue}
                              </span>
                            ) : null}{' '}
                            {partner[key].setValue}
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
    sectionsDisplay = (
      <div key={'companydiv'} style={{ width: '100%' }}>
        <RecordSection key={'section1SubRecordscompany'}>
          <SectionHeader>
            <SectionTitleContainer>
              <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                {recordCategoryToTitle['company']}
              </SectionTitle>
              <SectionSubtitle data-testid="text-amount">
                {filteredCompanyData ? filteredCompanyData?.length : 0}{' '}
                {t('records.label', { ns: 'common' })}
              </SectionSubtitle>
            </SectionTitleContainer>
          </SectionHeader>
          {filteredCompanyData &&
            filteredCompanyData.map((field: any, idx: any) => {
              return (
                <>
                  <div
                    key={'catTextEmbedded' + idx}
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
                    <Typography
                      style={{ paddingRight: '10px', display: 'flex', flex: 1, color: 'grey' }}
                    >
                      {fields[field].label || field}{' '}
                      {fields.contradictoryFields.setValue.includes(field) ? (
                        <div style={{ marginLeft: '4px', alignItems: 'center' }}>
                          <ExclamationSymbol
                            tooltipText={
                              fields[field].label +
                              ' is not matching on jurisdictional registrar source'
                            }
                          />
                        </div>
                      ) : null}
                    </Typography>
                    <Typography style={{ overflow: 'hidden' }}>
                      {fields[field].oldValue && compareToOldValues ? (
                        <span
                          style={{
                            overflow: 'hidden',
                            color: 'red',
                            textDecorationLine: 'line-through',
                          }}
                        >
                          {fields[field].oldValue}
                        </span>
                      ) : null}{' '}
                      {fields[field].setValue + ''}
                    </Typography>
                  </div>
                </>
              )
            })}
        </RecordSection>
      </div>
    )
  }
  // Message should be triggered when the entity exists in real world registrar but has not been claime don chain
  //Has LEI but no multisig
  return (
    <>
      {!addressesObj?.find((x: any) => x.key === 'Multisig Address' && isAddress(x.value)) &&
      hasRegistered ? (
        <MessageContainer>
          This entity has not deployed its Contract Account. This means it is not currently active
          on RegistryChain.
        </MessageContainer>
      ) : null}
      <TabWrapper data-testid="records-tab">
        <AllRecords>
          <RecordSection key={'section1Records'}>{sectionsDisplay}</RecordSection>
          {addressSection}
          {partnerSection}
        </AllRecords>
      </TabWrapper>
    </>
  )
}
