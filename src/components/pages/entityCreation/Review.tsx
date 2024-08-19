import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { Button, mq, Typography } from '@ensdomains/thorin'

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
    color: ${theme.colors.greyPrimary};
  `,
)

const SectionSubtitle = styled(Typography)(
  ({ theme }) => css`
    color: ${theme.colors.textTertiary};
  `,
)

const Actions = styled.div(
  ({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-flow: row wrap;
    gap: ${theme.space['2']};

    border-top: 1px solid ${theme.colors.border};
    padding: ${theme.space['4']};

    ${mq.sm.min(css`
      padding: ${theme.space['4']} ${theme.space['6']};
    `)}
  `,
)

export const Review = ({
  name,
  partners,
  profile,
}: {
  name: string
  partners: any
  profile: any
}) => {
  const { t } = useTranslation('profile')

  const texts: any[] = []
  partners.forEach((partner: any, idx: number) => {
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
    const key = 'company__' + field.split(' ').join('__')
    texts.push({ key, value: profile[field] })
  })

  return (
    <div>
      <AllRecords>
        <RecordSection>
          <SectionHeader>
            <SectionTitleContainer>
              <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                Review
              </SectionTitle>
              <SectionSubtitle data-testid="text-amount">
                {texts ? texts.length : 0} {t('records.label', { ns: 'common' })}
              </SectionSubtitle>
            </SectionTitleContainer>
          </SectionHeader>
          {texts &&
            texts.map((text) => {
              return (
                <div
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
                    {text.key}
                  </Typography>
                  <Typography>{text.value}</Typography>
                </div>
              )
            })}
        </RecordSection>
      </AllRecords>
    </div>
  )
}
