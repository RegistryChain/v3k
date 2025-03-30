'use-client'

import styled, { css } from 'styled-components'

import { Input, mq } from '@ensdomains/thorin'

import { LegacyDropdown } from '../@molecules/LegacyDropdown/LegacyDropdown'

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

const KYC = ({ records, fields, setField }: any) => {
  if (!fields) return null

  return (
    <div>
      {/* dropdown selects partner and fills in the inputs */}
      <LegacyDropdown
        style={{ maxWidth: '100%', textAlign: 'left' }}
        inheritContentWidth={true}
        size={'medium'}
        label={'Select Partner to KYC'}
        items={records.partners.map((x: any, idx: any) => ({
          key: x.name?.setValue + idx,
          label: x.name?.setValue,
          color: 'blue',
          onClick: () =>
            setField({
              name: x.name.setValue,
              birthdate: x.birthdate.setValue,
              address: x.physical__address?.setValue,
            }),
          value: x.name?.setValue,
        }))}
      />
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
