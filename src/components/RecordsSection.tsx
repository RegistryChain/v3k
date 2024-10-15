import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { Button, mq, Typography } from '@ensdomains/thorin'

import { cacheableComponentStyles } from '@app/components/@atoms/CacheableComponent'
import { AddressRecord, Profile, TextRecord } from '@app/types'

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

export const RecordsSection = ({ texts, status }: { texts?: TextRecord[]; status?: String }) => {
  const { t } = useTranslation('profile')

  const filteredTexts = useMemo(() => texts?.filter(({ value }) => value), [texts])
  const recordCategoryToTitle: any = {
    company: 'Company Details',
    civil: 'Civil Details',
  }
  const partnersOrganized: any = {}
  const categoryTexts = filteredTexts?.filter((text) => text.key.split('__')[0] === 'partner') || []

  categoryTexts.forEach((text) => {
    try {
      const keyComp = text.key.split('__')
      if (!partnersOrganized[keyComp[1]]) partnersOrganized[keyComp[1]] = {}
      partnersOrganized[keyComp[1]][keyComp.slice(2).join(' ')] = text.value
    } catch (err) {}
  })

  if (Object.values(partnersOrganized)?.length === 0) {
    return null
  }

  let statusSection = null
  if (status) {
    statusSection = (
      <RecordSection key={'section1sRecords'}>
        <SectionTitleContainer>
          <SectionTitle
            style={{ paddingLeft: '8px' }}
            data-testid="text-heading"
            fontVariant="bodyBold"
          >
            Status:{' '}
            <span style={status === 'approved' ? { color: 'lime' } : { color: '#e9d228' }}>
              {status}
            </span>
          </SectionTitle>
        </SectionTitleContainer>
      </RecordSection>
    )
  }

  const partnerSection = (
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
            {Object.values(partnersOrganized).map((partner: any, idx) => {
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
                        }}
                      >
                        <Typography style={{ display: 'flex', flex: 1, color: 'grey' }}>
                          {key
                            .split('__')
                            .map((x: any) => x[0].toUpperCase() + x.slice(1))
                            .join(' ')}
                        </Typography>
                        <Typography>{partner[key]}</Typography>
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

  return (
    <TabWrapper data-testid="records-tab">
      <AllRecords>
        {statusSection}
        <RecordSection key={'section1Records'}>
          {Object.keys(recordCategoryToTitle).map((cat) => {
            const categoryTexts =
              filteredTexts?.filter((text) => text.key.split('__')[0] === cat) || []
            if (!categoryTexts.length) return null
            return (
              <div key={cat + 'div'} style={{ width: '100%' }}>
                <RecordSection key={'section1SubRecords' + cat}>
                  <SectionHeader>
                    <SectionTitleContainer>
                      <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                        {recordCategoryToTitle[cat]}
                      </SectionTitle>
                      <SectionSubtitle data-testid="text-amount">
                        {categoryTexts ? categoryTexts.length : 0}{' '}
                        {t('records.label', { ns: 'common' })}
                      </SectionSubtitle>
                    </SectionTitleContainer>
                  </SectionHeader>
                  {categoryTexts &&
                    categoryTexts.map((text, idx) => {
                      return (
                        <div
                          key={'catTextEmbedded' + idx}
                          style={{
                            display: 'flex',
                            width: '100%',
                            padding: '0.625rem 0.75rem',
                            background: 'hsl(0 0% 96%)',
                            border: '1px solid hsl(0 0% 91%)',
                            borderRadius: '8px',
                          }}
                        >
                          <Typography style={{ display: 'flex', flex: 1, color: 'grey' }}>
                            {text.key
                              .split('__')
                              .map((x: any) => x[0].toUpperCase() + x.slice(1))
                              .join(' ')}
                          </Typography>
                          <Typography>{text.value}</Typography>
                        </div>
                      )
                    })}
                </RecordSection>
              </div>
            )
          })}
        </RecordSection>
        {partnerSection}
      </AllRecords>
    </TabWrapper>
  )
}
