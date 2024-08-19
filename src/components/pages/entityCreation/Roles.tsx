import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { createPublicClient, getContract, http, namehash, parseAbi, zeroAddress } from 'viem'

import { Button, Dialog, Field, Input, mq, Toggle, Typography } from '@ensdomains/thorin'

const InputWrapper = styled.div(
  ({ theme }) => css`
    flex: 1;
    position: relative;
    width: 100%;
  `,
)

const Roles = ({
  data,
  intakeType,
  roleTypes,
  profile,
  setProfile,
  setPartners,
  partners,
  publicClient,
}: any) => {
  const relevantRoles = [...roleTypes.standard[intakeType], ...roleTypes[data?.registrarKey]]
  const partnerPercentages: any = {}

  let totalSharesReconstruct = 0
  partners.forEach((f: any) => {
    totalSharesReconstruct += f.shares
  })
  const [totalShares, setTotalShares] = useState<string>((totalSharesReconstruct || 1000000) + '')
  partners.forEach((f: any) => {
    partnerPercentages[f.name] = (100 * f.shares) / Number(totalShares) || 0
  })
  const [sharePercentages, setSharePercentages] = useState<any>({ ...partnerPercentages })

  const ownersData = async () => {
    const client = publicClient
    // Here fetch the resolver data
    const resolver = await getContract({
      client,
      abi: parseAbi([
        'function text(bytes32 node, string calldata key) view returns (string memory)',
      ]),
      address: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD',
    })
    const properties: any = {}
    console.log('IMPORTANT - Fetch data from contracts here')
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
    // setPartners({...texts})
  }

  useEffect(() => {
    ownersData()
  }, [])

  useEffect(() => {}, [])

  const align: any = '-webkit-right'

  const partnersEle = partners.map((partner: any, idx: number) => {
    const inputEle = (
      <div style={{ display: 'flex' }}>
        <Typography style={{ flex: 3 }}>{partner.name}</Typography>

        {relevantRoles.map((role) => {
          return (
            <div key={'rolediv' + role} style={{ flex: 2, textAlign: align }}>
              <Toggle
                size={'small'}
                checked={partner.roles.includes(role)}
                onChange={(e) => {
                  e.stopPropagation()
                  const roleChecked = partner.roles.includes(role)
                  setPartners((prevPartners: any) => {
                    const updatedPartners = [...prevPartners]
                    let partnerRoles = [...partner.roles]
                    if (!roleChecked) {
                      partnerRoles.push(role)
                    } else {
                      partnerRoles = partnerRoles.filter((x: string) => x !== role)
                    }
                    const updatedPartner = { ...updatedPartners[idx], roles: partnerRoles }
                    updatedPartners[idx] = updatedPartner
                    return updatedPartners
                  })
                }}
                data-testid="primary-name-toggle"
              />
            </div>
          )
        })}
      </div>
    )
    return inputEle
  })

  const ownershipSection = (
    <div style={{ marginTop: '24px' }}>
      <div>
        <span style={{ fontSize: '42px' }}>Ownership</span>
      </div>
      <div style={{ display: 'block' }}>
        <InputWrapper>
          <Input
            size="medium"
            value={totalShares}
            label={'Total Shares'}
            error={false}
            placeholder={'Total Shares'}
            data-testid="record-input-input"
            validated={true}
            disabled={false}
            onChange={(e) => {
              let input = e.target.value
              if (Number(input) || input === '') {
                if (input[0] === '0' && input[1] !== '.' && input.length > 1) {
                  input = input.slice(1)
                }
                setTotalShares(input + '')
              }
            }}
          />
        </InputWrapper>
        <InputWrapper style={{ flex: 2 }}>
          <Input
            size="medium"
            value={profile.lockup__days || 0}
            label={'Lockup Days'}
            error={false}
            placeholder={'Lockup Days'}
            data-testid="record-input-input"
            validated={true}
            disabled={false}
            onChange={(e) => {
              let input = e.target.value
              if (Number(input) || input === '') {
                if (input[0] === '0' && input[1] !== '.' && input.length > 1) {
                  input = input.slice(1)
                }
                setProfile({ ...profile, lockup__days: input })
              }
            }}
          />
        </InputWrapper>
        {partners.map((partner: any, idx: number) => {
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography style={{ flex: 3 }}>{partner.name}</Typography>
              <InputWrapper style={{ flex: 3 }}>
                <Input
                  size="medium"
                  value={sharePercentages[partner.name]}
                  label={'Ownership percentage '}
                  error={false}
                  placeholder={'Ownership percentage '}
                  data-testid="record-input-input"
                  validated={true}
                  disabled={false}
                  onChange={(e) => {
                    let input = e.target.value
                    if ((Number(input) && Number(input) <= 100) || input === '') {
                      if (input[0] === '0' && input[1] !== '.' && input.length > 1) {
                        input = input.slice(1)
                      }
                      setSharePercentages({ ...sharePercentages, [partner.name]: input })
                      setPartners((prevPartners: any[]) => {
                        const updatedPartners = [...prevPartners]
                        const updatedPartner = {
                          ...updatedPartners[idx],
                          shares: Math.ceil(Number(totalShares) * (Number(input) / 100)),
                        }
                        console.log(
                          'SETTING SHARES OLD:',
                          prevPartners[idx].shares,
                          'NEW:',
                          updatedPartner.shares,
                        )
                        updatedPartners[idx] = updatedPartner
                        return updatedPartners
                      })
                    }
                  }}
                />
              </InputWrapper>
              <InputWrapper style={{ flex: 3, cursor: 'not-allowed' }}>
                <Input
                  size="medium"
                  style={{ cursor: 'not-allowed' }}
                  value={Math.ceil(Number(totalShares) * (sharePercentages[partner.name] / 100))}
                  label={'Shares'}
                  error={false}
                  placeholder={'Shares'}
                  data-testid="record-input-input"
                  validated={true}
                  disabled={false}
                  onChange={(e) => null}
                />
              </InputWrapper>
              <div key={'lockup' + partner.name} style={{ flex: 1, textAlign: align }}>
                <div style={{ alignContent: 'center', marginBottom: '8px' }}>
                  <label
                    style={{
                      color: 'hsl(240 6% 63%)',
                      fontSize: '1rem',
                      font: 'satoshi',
                      fontWeight: '700',
                    }}
                  >
                    Lockup
                  </label>
                </div>
                <div style={{ height: '3rem', alignContent: 'center' }}>
                  <Toggle
                    size={'small'}
                    checked={partner.lockup || false}
                    onChange={(e) => {
                      e.stopPropagation()
                      setPartners((prevPartners: any) => {
                        const updatedPartners = [...prevPartners]
                        const updatedPartner = { ...updatedPartners[idx], lockup: !partner.lockup }
                        updatedPartners[idx] = updatedPartner
                        return updatedPartners
                      })
                    }}
                    data-testid="primary-name-toggle"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ marginBottom: '44px' }}>
      <div>
        <span style={{ fontSize: '42px' }}>Roles</span>
      </div>
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex' }}>
          <Typography style={{ flex: 3 }}></Typography>
          {relevantRoles.map((role) => {
            return (
              <Typography style={{ flex: 2, textAlign: align, fontSize: '20px' }}>
                {role}
              </Typography>
            )
          })}
        </div>
        {partnersEle}
        {intakeType !== 'civil' ? ownershipSection : null}
      </div>
    </div>
  )
}

export default Roles
