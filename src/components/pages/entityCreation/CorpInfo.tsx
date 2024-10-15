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

const CorpInfo = ({ data, step, fields, profile, setProfile, publicClient }: any) => {
  const name = data?.name || ''
  const keys = [...Object.keys(fields.standard), ...Object.keys(fields[data?.registrarKey] || {})]

  const entityData = async () => {
    const properties: any = {}
    const texts: any = {}
    keys.forEach((key: string) => {
      const existing = profile?.[key]
      texts[key] = existing || properties[key]
    })
    setProfile((prevProfile: any) => ({ ...prevProfile, ...texts }))
  }

  useEffect(() => {
    entityData()
  }, [name])

  if (!profile) return null

  return (
    <>
      <NameContainer>{name}</NameContainer>
      {Object.keys(profile)
        ?.filter((field) => keys?.includes(field))
        ?.map((key) => {
          return (
            <InputWrapper key={key + 'wrapper'}>
              <Input
                size="large"
                value={profile?.[key]}
                label={key.split('__').join(' ')}
                error={false}
                placeholder={key.split('__').join(' ')}
                data-testid="record-input-input"
                validated={true}
                disabled={false}
                onChange={(e) => {
                  setProfile({ ...profile, [key]: e.target.value })
                }}
              />
            </InputWrapper>
          )
        })}
    </>
  )
}

export default CorpInfo
