'use-client'

import styled, { css } from 'styled-components'

import { Input, mq } from '@ensdomains/thorin'

const InputWrapper = styled.div(
  ({ theme }) => css`
    flex: 1;
    position: relative;
    width: 100%;
  `,
)

type Data = {
  name: string
}

export type Props = {
  data?: Data
}

const KYC = ({ fields, setField }: any) => {
  if (!fields) return null

  return (
    <div>
      {Object.keys(fields)?.map((key: any) => {
        return (
          <InputWrapper key={key + 'wrapper'}>
            <Input
              size="large"
              value={fields[key]}
              label={key}
              error={false}
              placeholder={key}
              data-testid="record-input-input"
              validated={true}
              disabled={false}
              onChange={(e) => {
                setField({ ...fields, [key]: e.target.value })
              }}
            />
          </InputWrapper>
        )
      })}
    </div>
  )
}

export default KYC
