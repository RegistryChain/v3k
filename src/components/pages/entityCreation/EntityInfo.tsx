'use-client'

import styled, { css } from 'styled-components'

import { Checkbox, Input, mq, Typography } from '@ensdomains/thorin'

import contractAddressesObj from '../../../constants/contractAddresses.json'

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
        if (field.key === 'company__arbitrator') {
          return (
            <div style={{ marginTop: '32px' }}>
              <Typography
                fontVariant="headingFour"
                style={{
                  color: '#9B9BA6',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  paddingLeft: '8px',
                  marginBottom: '12px',
                }}
              >
                Company Arbitrator
              </Typography>
              <div style={{ display: 'flex', paddingLeft: '8px' }}>
                <Checkbox
                  label="Kleros Arbitration"
                  checked={field.setValue === 'Kleros General Court V2'}
                  onChange={(e) => setField(field.key, 'Kleros General Court V2')}
                />
                <Checkbox
                  label="Other Arbitration Contract"
                  onChange={() => setField(field.key, '')}
                />
                <Checkbox label="Arbitration Terms" onChange={() => setField(field.key, '')} />
              </div>
              <InputWrapper key={field.key + 'wrapper'}>
                <Input
                  size="large"
                  value={field.setValue}
                  label={''}
                  error={false}
                  placeholder={field.label}
                  data-testid="record-input-input"
                  validated={true}
                  disabled={field.setValue === 'Kleros General Court V2'}
                  onChange={(e) => {
                    setField(field.key, e.target.value)
                  }}
                />
              </InputWrapper>
            </div>
          )
        }
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
