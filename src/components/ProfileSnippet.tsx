import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { normalize } from 'viem/ens'

import { Button, mq, NametagSVG, Tag, Typography } from '@ensdomains/thorin'

import { ExclamationSymbol } from './ExclamationSymbol'

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

const Image = styled.img`
  width: ${({ height }) => height}px;
  height: ${({ height }) => height}px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 16px;
`

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
        <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
          Entity Status:{' '}
          <span
            style={
              status === 'APPROVED' || status === 'ACTIVE'
                ? { color: 'rgb(56, 136, 255)' }
                : { color: '#e9d228' }
            }
          >
            {status}
          </span>
        </SectionTitle>
        {records.entity__registrar?.oldValue !== 'public' &&
        records.sourceActive &&
        records.sourceActive?.setValue === false ? (
          <ExclamationSymbol
            tooltipText={
              'This entity is not active according to the jurisdictional registrar source.'
            }
          />
        ) : null}
      </SectionTitleContainer>
    )
  }
  return (
    <Container>
      {!multisigAddress && !name ? (
        entityUnavailable
      ) : (
        <>
          <div style={{ display: 'flex' }}>
            <Image src={records.avatar.setValue} alt="e" height={88} />
            <div>
              <NameRecord fontVariant="headingTwo" data-testid="profile-snippet-nickname">
                {name}
              </NameRecord>
              <SectionTitle data-testid="text-heading" fontVariant="bodyBold">
                <Typography>
                  <a href={'https://app.ens.domains/' + domainName}>
                    <i>{normalize(domainName)}</i>
                  </a>
                </Typography>
              </SectionTitle>
              {/* {statusSection} */}
            </div>
          </div>
        </>
      )}
    </Container>
  )
}
