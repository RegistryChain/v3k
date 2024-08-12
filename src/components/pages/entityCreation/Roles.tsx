import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { Button, Dialog, Field, Input, mq, Toggle, Typography } from '@ensdomains/thorin'
import { createPublicClient, getContract, http, namehash, parseAbi, zeroAddress } from 'viem'
import { sepolia } from 'viem/chains'
import { infuraUrl } from '@app/utils/query/wagmi'


const InputWrapper = styled.div(
  ({ theme }) => css`
    flex: 1;
    position: relative;
    width: 100%;
  `,
)

const FooterContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    gap: ${theme.space['3']};
    width: 100%;
    margin: 0 auto;
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
    font-size: ${theme.space['8']};
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


const Roles = ({ data, step, setFounders, founders, publicClient }: any) => {
  const name = data?.name || ''

  const roles = ["owner","manager","spender","developer","signer"]
  

    const ownersData = async () => {
    
      const client = publicClient
      // Here fetch the resolver data 
      const resolver = await getContract({client, abi: parseAbi(['function text(bytes32 node, string calldata key) view returns (string memory)']), address: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD"})
          const properties: any = {}
          console.log("IMPORTANT - Fetch data from contracts here")
          // const text = await resolver.read.text([namehash(entityName + '.' + registrar), "test"])
          // Texts needs to iterate over existing texts array and overwrite keys that already hold values
          //KEYS IS PULLED FROM REGISTRAR, DEPENDS IF THE ENTITY IS TO BE FORMED BY JUSESP, BoT, etc

          // const keys = []
          // for(let i = 1; i <= ownerCount; i++) {

          //   keys.push("owner__" + i + "__name")
          //   keys.push("owner__" + i + "__type")
          //   keys.push("owner__" + i + "__address")
          //   keys.push("owner__" + i + "__DOB")
          // }

          // const texts: any = {}
          // const textConstruction= keys.map((key: string) => {
          //   const existing = owners?.[key]
          //   texts[key] = existing?.value || properties[key]})
          // setFounders({...texts})
    }
  

  useEffect(() => {
    ownersData()
  }, [])

  useEffect(() => {

  }, [])

  const align: any = "-webkit-right"

  const foundersEle = founders.map((founder: any, i: number) => {
           const inputEle = (
           
           <div style={{display: "flex"}}>
            <Typography style={{flex: 3}}>{founder.name}</Typography>
           
            {roles.map(role => {
              return (
                    <div key={"rolediv" + role} style={{flex: 2, textAlign: align}}>
                    <Toggle
                    
                      size={'small'}
                      checked={founder.roles.includes(role)}
                      onChange={(e) => {
                        e.stopPropagation()
                        const roleChecked = founder.roles.includes(role)
                        setFounders((prevFounders: any) => {
                            const updatedFounders = [...prevFounders];
                            let roles = [...founder.roles];
                            if (!roleChecked) {
                                roles.push(role)
                            } else {
                                roles = roles.filter((x: string) => x !== role)
                            }
                            const updatedFounder = { ...updatedFounders[i], roles };
                            updatedFounders[i] = updatedFounder;
                            return updatedFounders;
                          });
  
                      }}
                      data-testid="primary-name-toggle"
                    />
                                   
                  </div>
              )
            })}

          </div>)
          return inputEle
  })

  return (
    <div style={{marginBottom: "44px"}}>
      <NameContainer>{name}</NameContainer>
      <div style={{marginTop: "20px"}}>
      <div style={{display: "flex"}}>
        <Typography style={{flex: 3}}></Typography>
        {roles.map(role => {
          return (
            <Typography style={{flex: 2, textAlign: align, fontSize: "20px"}}>{role}</Typography>
          )})}
      </div>

      {foundersEle}

      </div>
    </div>
  )
}

export default Roles
