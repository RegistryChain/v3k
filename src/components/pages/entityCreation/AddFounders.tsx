import { useCallback, useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { Button, Dialog, Input, mq } from '@ensdomains/thorin'
import { createPublicClient, getContract, http, namehash, parseAbi, zeroAddress } from 'viem'
import { Calendar } from '@app/components/@atoms/Calendar/Calendar'

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

const founderFields: any = {
  standard: {
    name: "string",
    type: "string",
    address: "string",
    "DOB": "date",
    roles: "Array",
    lockup: "Boolean",
    shares: "number"
  },
  PUB: {},
  DL:{},
  WY:{},
  BVI:{}
}

const AddFounders = ({ data, setFounders, founders, publicClient }: any) => {
  const name = data?.name || ''
  const [founderInputNumber, setFounderInputNumber] = useState(0)

  ///IMPORTANT - SHOULD BE CUSTOM VIEM FETCH FOR TEXT RECORDS

  //Uses founders and setFounders prop for the parties to be added
  //Find the founderCount in profile.texts, for each founder ask name, type, address, shares and render in the form one for each
  //Validate for shareCount

  const relevantFields = {...founderFields.standard, ... founderFields[data?.registrarKey]}

    const foundersData = async () => {
    
      const client = publicClient
      // Here fetch the resolver data 
      const resolver = await getContract({client, abi: parseAbi(['function text(bytes32 node, string calldata key) view returns (string memory)']), address: "0x8FADE66B79cC9f707aB26799354482EB93a5B7dD"})
          const properties: any = {}
          console.log("IMPORTANT - Fetch data from contracts here")
          // const text = await resolver.read.text([namehash(entityName + '.' + registrar), "test"])
          // Texts needs to iterate over existing texts array and overwrite keys that already hold values
          //KEYS IS PULLED FROM REGISTRAR, DEPENDS IF THE ENTITY IS TO BE FORMED BY JUSESP, BoT, etc

          // const keys = []
          // for(let i = 1; i <= founderCount; i++) {

          //   keys.push("founder__" + i + "__name")
          //   keys.push("founder__" + i + "__type")
          //   keys.push("founder__" + i + "__address")
          //   keys.push("founder__" + i + "__DOB")
          // }

          // const texts: any = {}
          // const textConstruction= keys.map((key: string) => {
          //   const existing = founders?.[key]
          //   texts[key] = existing?.value || properties[key]})
          // setFounders({...texts})
    }
  

  useEffect(() => {
    foundersData()
    let tempFounderObj: any = {}
    if (founders.length === 0) {
      Object.keys(relevantFields).forEach(field => {
        if (relevantFields[field] === "number") {
          tempFounderObj[field] = 0
        } else if (relevantFields[field] === "Array") {
          tempFounderObj[field] = []
        } else if (relevantFields[field] === "Boolean") {
          tempFounderObj[field] = false;
        } else {
          tempFounderObj[field] = ""
        }
      })
      setFounders([tempFounderObj])
    }
  }, [])

  useEffect(() => {
    //Upon founderInputNumber change, check if the founders[founderInputNumber] object has keys/vals already
    // If not, add a new object using the correct founderSchema to instantiate an object to updated in the input (with empty placeholder vals)
    if (founders.length === founderInputNumber && founders.length > 0) {

      let tempFounderObj: any = {}
      Object.keys(relevantFields).forEach(field => {
        if (relevantFields[field] === "number") {
          tempFounderObj[field] = 0
        } else if (relevantFields[field] === "Array") {
          tempFounderObj[field] = []
        } else {
          tempFounderObj[field] = ""
        }
      })
      setFounders((prevFounders: any) => [...prevFounders, tempFounderObj])
    }
  }, [founderInputNumber])


  const removeFounder = (founderNumber: number) => {
    setFounders((prevFounders: any) => {
      // Filter out the element at the specified index
      const updatedFounders = prevFounders.filter((_: any, index: number) => index !== founderNumber);
      // Return the updated founders array
      return updatedFounders;
    });

    let newInputNumber = founderNumber - 1
    if (newInputNumber < 0) newInputNumber = 0
    setFounderInputNumber(newInputNumber)
  }

  const editFounder = (founderNumber: number) => {
      setFounderInputNumber(founderNumber)
  }

  let inputEle = null

  const foundersEle = founders.map((founder: any, i: number) => {
      if (i === founderInputNumber && Object.keys(founder)?.length > 0) {
           inputEle = (<>
            {Object.keys(founder).map(field => {
              const fieldType = relevantFields?.[field]
              if (field === "roles" || field === "shares" || field === "lockup") return null
              if (fieldType === "date") {
                return (
                  <InputWrapper  key={field}>
                    <Calendar
                      labelText={"Founder " + i + " " + field}
                      labelHeight={62}
                      value={(new Date(founder?.[field]).getTime())/1000 + (3600*24) || 946692000}
                      onChange={(e) => {
                        const { valueAsDate } = e.currentTarget
                        if (valueAsDate) {
                          setFounders((prevFounders: any) => {
                            const updatedFounders = [...prevFounders];
                            const updatedFounder = { ...updatedFounders[i], [field]: (e.currentTarget.value) };
                            updatedFounders[i] = updatedFounder;
                            return updatedFounders;
                          });
                        }
                      }}
                      highlighted
                      name={name}
                      min={1000000}
                    />
                </InputWrapper>)
              }
              return (
                <InputWrapper key={field}>
                    <Input
                      size="large"
                      value={founder?.[field]}
                      label={"Founder " + i + " " + field}
                      error={false}
                      placeholder={"Founder " + i + " " + field}
                      data-testid="record-input-input"
                      validated={true}
                      disabled={false}
                      onChange={(e) => {
                        if (fieldType === "number" && !Number(e.target.value) && e.target.value !== "") {
                          return
                        }
                        setFounders((prevFounders: any) => {
                          const updatedFounders = [...prevFounders];
                          const updatedFounder = { ...updatedFounders[i], [field]: e.target.value };
                          updatedFounders[i] = updatedFounder;
                          return updatedFounders;
                        });
                      }}
                    />
                  </InputWrapper>
              )
            })}
          </>)
          return null
    } else {
      return (<div key={i + "founder"} style={{margin: "10px", textAlign: "left"}}>
          <Button colorStyle='blueSecondary' onClick={() => editFounder(i)}>Founder - {founder?.name || "..."}</Button>
        </div>)
    }
})

  return (
    <div style={{marginBottom: "44px"}}>
      <NameContainer>{name}</NameContainer>
      <Button style={{width: "260px", fontSize: "20px", marginTop: "12px", marginLeft: "6px"}} onClick={() => editFounder(founders.length)}>+ Founder</Button>
      <Button  style={{width: "260px", fontSize: "20px", marginTop: "12px", marginLeft: "6px"}} disabled={founders.length === 1} colorStyle="redPrimary" onClick={() => removeFounder(founderInputNumber)}>- Founder</Button>
      <div style={{marginTop: "20px"}}>
        {inputEle}
        {foundersEle}
      </div>
    </div>
  )
}

export default AddFounders
