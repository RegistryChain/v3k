import Head from 'next/head'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { mq } from '@ensdomains/thorin'

import ErrorScreen from '@app/components/@atoms/ErrorScreen'
import { LeadingHeading } from '@app/components/LeadingHeading'

import RegistryChainLogoFull from '../assets/RegistryChainLogoFull.svg'

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

export default function Page() {
  const { t } = useTranslation()
  return (
    <>
      <Head>
        {/* this is wrapped in a string because of the way nextjs renders content, don't remove! */}
        <title>{`RegistryChain - ${t('notFound')}`}</title>
      </Head>
      <StyledLeadingHeading>
        <LogoAndLanguage>
          <StyledENS as={RegistryChainLogoFull} />
        </LogoAndLanguage>
      </StyledLeadingHeading>
      <ErrorScreen errorType="not-found" />
    </>
  )
}
