'use-client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { Button, CrossSVG, Dialog, Input, mq } from '@ensdomains/thorin'

import { createPublicClient, getContract, http, namehash, parseAbi, zeroAddress } from 'viem'

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

const EditEntity = ({ data, step, profile, setProfile, publicClient }: any) => {
  const { t } = useTranslation('profile')
  const name = data?.name || ''

  const entityData = async () => {
  
    const client = publicClient
    // Here fetch the resolver data 
    const resolver = await getContract({client, abi: parseAbi(['function text(bytes32 node, string calldata key) view returns (string memory)']), address: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD"})
        const properties: any = {}
        // Texts needs to iterate over existing texts array and overwrite keys that already hold values
        //KEYS IS PULLED FROM REGISTRAR, DEPENDS IF THE ENTITY IS TO BE FORMED BY JUSESP, BoT, etc
        const keys = ["Type", "DID", "share__count", "owner__count"]
        const texts: any = {}
        const fetches: any = []
        const textConstruction= keys.map((key: string) => {
          const existing = profile?.[key]
          if (!existing) {
            fetches.push("PROMISE CALL TO CONTRACT FOR DATA ")
            // const text = await resolver.read.text([namehash(entityName + '.' + registrar), "test"])
          }
          texts[key] = existing || properties[key]})
        setProfile({...texts})
  }

  useEffect(() => {
    entityData()
  }, [name])


  if (!profile) return null

  return (
    <>
      <NameContainer>{name}</NameContainer>
        {Object.keys(profile)?.map(key => {
          return (
              <InputWrapper key={key+'wrapper'}>
                <Input
                  size="large"
                  value={profile?.[key]}
                  label={key.split("__").join(" ")}
                  error={false}
                  placeholder={key.split("__")[2]}
                  data-testid="record-input-input"
                  validated={true}
                  disabled={false}
                  onChange={(e) => {
                    setProfile({...profile, [key]: e.target.value})
                  }}
                />
              </InputWrapper>
          )
        })}
    </>
  )
}

export default EditEntity
// 