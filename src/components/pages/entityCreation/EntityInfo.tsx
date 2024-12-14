'use-client'

import { useEffect } from 'react'
import styled, { css } from 'styled-components'

import { Input, mq } from '@ensdomains/thorin'

const InputWrapper = styled.div(
  ({ theme }) => css`
    flex: 1;
    position: relative;
    width: 100%;
  `,
)

const NameContainer = styled.div(({ theme }) => [
  css`
    display: block;
    width: 100%;
    padding-left: ${theme.space['2']};
    padding-right: ${theme.space['4']};
    letter-spacing: ${theme.letterSpacings['-0.01']};
    line-height: 45px;
    vertical-align: middle;
    text-align: center;
    font-feature-settings:
      'ss01' on,
      'ss03' on,
      'ss04' on;
    font-weight: ${theme.fontWeights.bold};
    font-size: ${theme.space['6']};
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  `,
  mq.sm.min(css`
    text-align: left;
  `),
])

type Data = {
  name: string
}

export type Props = {
  data?: Data
}

const EntityInfo = ({ data, fields, setField }: any) => {
  const name = data?.name || ''

  if (!fields) return null

  return (
    <>
      <NameContainer>{name}</NameContainer>
      {fields?.map((field: any) => {
        return (
          <InputWrapper key={field.key + 'wrapper'}>
            <Input
              size="large"
              value={field.setValue}
              label={field.label}
              error={false}
              placeholder={field.label}
              data-testid="record-input-input"
              validated={true}
              disabled={false}
              onChange={(e) => {
                setField(field.key, e.target.value)
              }}
            />
          </InputWrapper>
        )
      })}
    </>
  )
}

export default EntityInfo
