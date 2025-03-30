import { Trans, useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { ProfileSnippet } from '@app/components/ProfileSnippet'
import { Address } from 'viem'

const DetailsWrapper = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: ${theme.space['2']};
    flex-gap: ${theme.space['2']};
    width: 100%;
  `,
)

interface EntityViewTabProps {
  domainName: string
  multisigAddress: string
  records: any
  status: string
  withRating?: boolean
  makeAmendment: any
  owner: Address
}

const EntityViewTab = ({ domainName, multisigAddress, records, status, withRating, makeAmendment, owner }: EntityViewTabProps) => {
  const { t } = useTranslation('profile')

  const nameRecord = records?.name

  return (
    <DetailsWrapper>
      <ProfileSnippet
        name={nameRecord}
        records={records}
        multisigAddress={multisigAddress}
        status={status}
        domainName={domainName}
        withRating={withRating}
        makeAmendment={makeAmendment}
        owner={owner}
      />
    </DetailsWrapper>
  )
}

export default EntityViewTab
