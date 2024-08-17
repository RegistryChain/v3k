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

const roleTypes = ["owner","manager","spender","investor", "signer"]

const Roles = ({ data, profile, setProfile, setFounders, founders, publicClient }: any) => {
  const founderPercentages: any = {}
  let totalSharesReconstruct = 0
  founders.forEach((f: any) => {
    totalSharesReconstruct += f.shares
  })
  const [totalShares, setTotalShares] = useState<string>((totalSharesReconstruct || 1000000) + "")
  founders.forEach((f: any) => {
    founderPercentages[f.name] = (100 * f.shares)/Number(totalShares)||0
  })
  const [sharePercentages, setSharePercentages] = useState<any>({...founderPercentages})

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
          // for(let idx = 1; idx <= ownerCount; idx++) {

          //   keys.push("owner__" + idx + "__name")
          //   keys.push("owner__" + idx + "__type")
          //   keys.push("owner__" + idx + "__address")
          //   keys.push("owner__" + idx + "__DOB")
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

  const foundersEle = founders.map((founder: any, idx: number) => {
           const inputEle = (
           
           <div style={{display: "flex"}}>
            <Typography style={{flex: 3}}>{founder.name}</Typography>
           
            {roleTypes.map(role => {
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
                            let founderRoles = [...founder.roles];
                            if (!roleChecked) {
                                founderRoles.push(role)
                            } else {
                                founderRoles = founderRoles.filter((x: string) => x !== role)
                            }
                            const updatedFounder = { ...updatedFounders[idx], roles: founderRoles };
                            updatedFounders[idx] = updatedFounder;
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


  const ownershipSection = (
  <div style={{marginTop: "24px"}}>
    <div>
      <span style={{fontSize: "42px"}}>Ownership</span>
    </div>
    <div style={{display: "block"}}>
      <InputWrapper>
        <Input
          size="medium"
          value={totalShares}
          label={"Total Shares"}
          error={false}
          placeholder={"Total Shares"}
          data-testid="record-input-input"
          validated={true}
          disabled={false}
          onChange={(e) => {
            let input = e.target.value
            if (Number(input) || input === "") {
              if (input[0] === "0" && input[1] !== "." && input.length> 1) {
                input = input.slice(1)
              }
              setTotalShares(input + "")
            }
          }}
        />
      </InputWrapper>
      <InputWrapper style={{flex: 2}}>
        <Input
          size="medium"
          value={profile.lockup__days || 0}
          label={"Lockup Days"}
          error={false}
          placeholder={"Lockup Days"}
          data-testid="record-input-input"
          validated={true}
          disabled={false}
          onChange={(e) => {
            let input = e.target.value
            if (Number(input) || input === "") {
              if (input[0] === "0" && input[1] !== "." && input.length> 1) {
                input = input.slice(1)
              }
              setProfile({...profile, lockup__days: input})
            }
          }}
        />
      </InputWrapper>
      {founders.map((founder:any, idx: number) => {
        return <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
          <Typography style={{flex: 3}}>{founder.name}</Typography>
          <InputWrapper style={{flex: 3}}>
            <Input
              size="medium"
              value={sharePercentages[founder.name]}
              label={"Ownership percentage "}
              error={false}
              placeholder={"Ownership percentage "}
              data-testid="record-input-input"
              validated={true}
              disabled={false}
              onChange={(e) => {
                let input = e.target.value
                if ((Number(input) && Number(input) <= 100) || input === "") {
                  if (input[0] === "0" && input[1] !== "." && input.length> 1) {
                    input = input.slice(1)
                  }
                  setSharePercentages({...sharePercentages, [founder.name]: (input)})
                  setFounders((prevFounders: any[]) => {
                    const updatedFounders = [...prevFounders];
                    const updatedFounder = { ...updatedFounders[idx], shares: Math.ceil(Number(totalShares) * (Number(input)/100))};
                    console.log('SETTING SHARES OLD:', prevFounders[idx].shares, "NEW:", updatedFounder.shares)
                    updatedFounders[idx] = updatedFounder;
                    return updatedFounders;
                  })
                }
              }}
            />
          </InputWrapper>
          <InputWrapper style={{flex: 3, cursor: "not-allowed"}}>
            <Input
              size="medium"
              style={{cursor: "not-allowed"}}
              value={Math.ceil(Number(totalShares) * (sharePercentages[founder.name]/100))}
              label={"Shares"}
              error={false}
              placeholder={"Shares"}
              data-testid="record-input-input"
              validated={true}
              disabled={false}
              onChange={(e) => null}
            />
            </InputWrapper>
            <div key={"lockup" + founder.name} style={{flex: 1, textAlign: align}}>
              <div style={{alignContent: "center", marginBottom: "8px"}}>
                <label style={{color: "hsl(240 6% 63%)", fontSize: "1rem", font: "satoshi", fontWeight: "700"}}>
                  Lockup
                </label>
              </div>
              <div style={{height: "3rem", alignContent: "center"}}>
                <Toggle
                  size={'small'}
                  checked={founder.lockup || false}  
                  onChange={(e) => {
                    e.stopPropagation()
                    setFounders((prevFounders: any) => {
                        const updatedFounders = [...prevFounders];
                        const updatedFounder = { ...updatedFounders[idx], lockup: !founder.lockup };
                        updatedFounders[idx] = updatedFounder;
                        return updatedFounders;
                      });
                  }}
                  data-testid="primary-name-toggle"
                />
              </div>
          </div>
      </div>
      })}
    </div>
  </div>)

return (
    <div style={{marginBottom: "44px"}}>
      <div>
      <span style={{fontSize: "42px"}}>Roles</span>
          
        </div>
      <div style={{marginTop: "20px"}}>
        <div style={{display: "flex"}}>
          <Typography style={{flex: 3}}></Typography>
          {roleTypes.map(role => {
            return (
              <Typography style={{flex: 2, textAlign: align, fontSize: "20px"}}>{role}</Typography>
            )})}
        </div>
      {foundersEle}
      {ownershipSection}
      </div>
    </div>
  )
}

export default Roles
