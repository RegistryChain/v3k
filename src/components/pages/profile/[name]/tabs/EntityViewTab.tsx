import { Trans, useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { ProfileSnippet } from '@app/components/ProfileSnippet'

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

const EntityViewTab = ({ domainName, multisigAddress, records, status }: any) => {
  const { t } = useTranslation('profile')

  const nameRecord = records?.entity__name

  return (
    <DetailsWrapper>
      <ProfileSnippet
        name={nameRecord}
        records={records}
        multisigAddress={multisigAddress}
        status={status}
        domainName={domainName}
      />
    </DetailsWrapper>
  )
}

export default EntityViewTab
