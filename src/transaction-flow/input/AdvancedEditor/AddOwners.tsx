import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { Button, Dialog, Input, mq } from '@ensdomains/thorin'
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


const AddOwners = ({ data, step, profile, setOwners, owners, publicClient }: any) => {
  const { t } = useTranslation('profile')
  const name = data?.name || ''
  const ownerCount = Number(profile?.["owner__count"])

  

  ///IMPORTANT - SHOULD BE CUSTOM VIEM FETCH FOR TEXT RECORDS

  //Uses owners and setOwners prop for the parties to be added
  //Find the ownerCount in profile.texts, for each owner ask name, type, address, shares and render in the form one for each
  //Validate for shareCount

  const ownerFields = {
    standard: {
      name: "string",
      type: "string",
      "DOB": "date",
      address: "string",
    },
    PUB: {},
    DL:{},
    WY:{},
    BVI:{}
  }



    const ownersData = async () => {
    
      const client = publicClient
      // Here fetch the resolver data 
      const resolver = await getContract({client, abi: parseAbi(['function text(bytes32 node, string calldata key) view returns (string memory)']), address: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD"})
          const properties: any = {}
          console.log("IMPORTANT - Fetch data from contracts here")
          // const text = await resolver.read.text([namehash(entityName + '.' + registrar), "test"])
          // Texts needs to iterate over existing texts array and overwrite keys that already hold values
          //KEYS IS PULLED FROM REGISTRAR, DEPENDS IF THE ENTITY IS TO BE FORMED BY JUSESP, BoT, etc

          const keys = []
          for(let i = 1; i <= ownerCount; i++) {

            keys.push("owner__" + i + "__name")
            keys.push("owner__" + i + "__type")
            keys.push("owner__" + i + "__address")
            keys.push("owner__" + i + "__DOB")
          }

          const texts: any = {}
          const textConstruction= keys.map((key: string) => {
            const existing = owners?.[key]
            texts[key] = existing?.value || properties[key]})
          setOwners({...texts})
    }
  

  useEffect(() => {
    ownersData()
  }, [])

  const [ownerInputNumber, setOwnerInputNumber] = useState(1)

  const ref = useRef<HTMLFormElement>(null)
 

  const editOwner = (ownerNumber: number) => {
      setOwnerInputNumber(ownerNumber)
  }

  const ownersEle = []

  for(let i = 1; i <= ownerCount; i++) {
    if (i === ownerInputNumber) {
      ownersEle.push(Object.keys(owners)?.filter(owner => owner.split("__")[1] === ownerInputNumber+"")?.map(key => {
        return (
            <InputWrapper key={key}>
              <Input
                size="large"
                value={owners?.[key]}
                label={key.split("__").join(" ")}
                error={false}
                placeholder={key.split("__")[2]}
                data-testid="record-input-input"
                validated={true}
                disabled={false}
                onChange={(e) => {
                  setOwners({...owners, [key]: e.target.value})
                }}
              />
            </InputWrapper>
        )
      }))

    } else {
      ownersEle.push(<div key={i + "owner"} style={{margin: "10px", textAlign: "left"}}><Button colorStyle='blueSecondary' onClick={() => editOwner(i)}>Owner {i} {owners["owner__" + i + "__name"]}</Button></div>)
    }
  }

  return (
    <>
      <NameContainer>{name}</NameContainer>
      {ownersEle}
        </>
  )
}

export default AddOwners
