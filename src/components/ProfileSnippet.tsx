import Link from 'next/link'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { Button, mq, NametagSVG, Tag, Typography } from '@ensdomains/thorin'

import { useBeautifiedName } from '@app/hooks/useBeautifiedName'

const Container = styled.div<{}>(
  ({ theme }) => css`
    width: 100%;
    padding: ${theme.space['4']};
    padding-top: ${theme.space['18']};
    background-repeat: no-repeat;
    background-attachment: scroll;
    background-size: 100% ${theme.space['28']};
    background-position-y: -1px; // for overlap with border i think
    background-color: #007bff;
    border-radius: ${theme.radii['2xLarge']};
    border: ${theme.space.px} solid ${theme.colors.border};
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: ${theme.space['4']};
    flex-gap: ${theme.space['4']};
    margin-bottom: 12px;

    ${mq.sm.min(css`
      padding: ${theme.space['6']};
      padding-top: ${theme.space['12']};
    `)}
  `,
)

const Name = styled(Typography)(
  () => css`
    width: 100%;
    overflow-wrap: anywhere;
  `,
)

const NameRecord = styled(Typography)(
  ({ theme }) => css`
    color: white;
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
  children,
}: {
  name: string
  multisigAddress: string
  children?: React.ReactNode
}) => {
  const { t } = useTranslation('common')

  const beautifiedName = useBeautifiedName(name)

  return (
    <Container>
      <NameRecord fontVariant="headingThree" data-testid="profile-snippet-nickname">
        <Link target={'_blank'} href={'https://sepolia.etherscan.io/address/' + multisigAddress}>
          {multisigAddress}
        </Link>
      </NameRecord>
      <Name data-testid="profile-snippet-name">Entity Multisig Address</Name>
    </Container>
  )
}
