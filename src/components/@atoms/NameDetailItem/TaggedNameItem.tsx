import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { NameWithRelation } from '@ensdomains/ensjs/subgraph'
import { mq, Tag } from '@ensdomains/thorin'

import { validateExpiry } from '@app/utils/utils'

import { NameDetailItem } from './NameDetailItem'

const OtherItemsContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-flow: column wrap;
    align-items: flex-end;
    justify-content: center;
    gap: ${theme.space['2']};
    flex-gap: ${theme.space['2']};
    ${mq.md.min(css`
      flex-direction: row;
      gap: ${theme.space['4']};
      flex-gap: ${theme.space['4']};
    `)}
  `,
)

export const TaggedNameItem = ({
  name,
  relation,
  isOwner,
  fuses,
  expiryDate,
  truncatedName,
  mode,
  selected,
  disabled = false,
  onClick,
  notOwned,
  pccExpired,
  hasOtherItems = true,
}: {
    name: any
    relation?: any
    fuses?: any
    expiryDate?: any
    truncatedName?: any
    isOwner?: boolean
    notOwned?: boolean
    selected?: boolean
    mode?: 'select' | 'view'
    disabled?: boolean
    onClick?: () => void
    pccExpired?: boolean
    hasOtherItems?: boolean
  }) => {

  return (
    <NameDetailItem
      key={name}
      truncatedName={truncatedName!}
      expiryDate={validateExpiry({ name: name!, fuses, expiry: expiryDate?.date, pccExpired })}
      name={name!}
      mode={mode}
      selected={selected}
      disabled={disabled}
      onClick={onClick}
    >
      <OtherItemsContainer>
        {isOwner ?
            <Tag
              key={"OWNERTAG"}
              colorStyle={'accentSecondary'}
              data-testid={`tag-isOwner`}
            >
              {"Owner"}
            </Tag>
          : null}
      </OtherItemsContainer>
    </NameDetailItem>
  )
}
