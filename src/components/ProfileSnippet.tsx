import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { Button, mq, NametagSVG, Tag, Typography } from '@ensdomains/thorin'

const Container = styled.div<{}>(
  ({ theme }) => css`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 6px;
    flex-gap: ${theme.space['4']};
    margin-bottom: 12px;

    ${mq.sm.min(css`
      padding: ${theme.space['6']};
      padding-top: ${theme.space['6']};
    `)}
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

const NameRecord = styled(Typography)(
  ({ theme }) => css`
    color: black;
    margin-top: -${theme.space['0.5']};
  `,
)

export const getUserDefinedUrl = (url?: string) => {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return ``
}

export const ProfileSnippet = ({
  name,
  multisigAddress,
  records,
  status,
  domainName,
  children,
}: any) => {
  const { t } = useTranslation('common')

  let entityUnavailable = null
  if (records.length > 0) {
    entityUnavailable = (
      <NameRecord fontVariant="headingThree" data-testid="profile-snippet-nickname">
        Entity Not Found
      </NameRecord>
    )
  }

  let statusSection = null
  if (status) {
    statusSection = (
      <SectionTitleContainer>
        <SectionTitle
          style={{ paddingLeft: '8px' }}
          data-testid="text-heading"
          fontVariant="bodyBold"
        >
          Status:{' '}
          <span
            style={status === 'APPROVED' ? { color: 'rgb(56, 136, 255)' } : { color: '#e9d228' }}
          >
            {status}
          </span>
        </SectionTitle>
      </SectionTitleContainer>
    )
  }
  return (
    <Container>
      {!multisigAddress && !name ? (
        entityUnavailable
      ) : (
        <>
          <NameRecord fontVariant="headingTwo" data-testid="profile-snippet-nickname">
            {name}
          </NameRecord>
          <SectionTitle
            style={{ paddingLeft: '8px', display: 'block' }}
            data-testid="text-heading"
            fontVariant="bodyBold"
          >
            <Typography>
              <i>{domainName}</i>
            </Typography>
          </SectionTitle>
          {statusSection}
        </>
      )}
    </Container>
  )
}
