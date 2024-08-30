import { useCallback, useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { createPublicClient, getContract, http, namehash, parseAbi, zeroAddress } from 'viem'

import { Button, Dialog, Input, mq } from '@ensdomains/thorin'

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

const AddPartners = ({
  data,
  partnerTypes,
  partnerFields,
  intakeType,
  setPartners,
  partners,
  publicClient,
}: any) => {
  const name = data?.name || ''
  const [partnerInputNumber, setPartnerInputNumber] = useState(0)
  const [isFocusedPartnerType, setIsFocusedPartnerType] = useState(false)

  const inputRef = useRef(null)

  const relevantFields = {
    ...partnerFields.standard[intakeType],
    ...partnerFields[data?.registrarKey],
  }

  const partnersData = async () => {
    const client: any = publicClient
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
    // for(let i = 1; i <= partnerCount; i++) {

    //   keys.push("partner__" + i + "__name")
    //   keys.push("partner__" + i + "__type")
    //   keys.push("partner__" + i + "__address")
    //   keys.push("partner__" + i + "__DOB")
    // }

    // const texts: any = {}
    // const textConstruction= keys.map((key: string) => {
    //   const existing = partners?.[key]
    //   texts[key] = existing?.value || properties[key]})
    // setPartners({...texts})
  }

  useEffect(() => {
    partnersData()
    let tempPartnerObj: any = {}
    if (partners.length === 0) {
      Object.keys(relevantFields).forEach((field) => {
        if (relevantFields[field] === 'number') {
          tempPartnerObj[field] = 0
        } else if (relevantFields[field] === 'Array') {
          tempPartnerObj[field] = []
        } else if (relevantFields[field] === 'Boolean') {
          tempPartnerObj[field] = false
        } else if (relevantFields[field] === 'Address') {
          tempPartnerObj[field] = zeroAddress
        } else {
          tempPartnerObj[field] = ''
        }
      })
      setPartners([tempPartnerObj])
    }
  }, [])

  useEffect(() => {
    let changeFlag = false // Upon mount, map through partners object

    const newPartners = partners.map((partner: any) => {
      const nPartner = partner
      if (!partner.DOB) {
        changeFlag = true
        nPartner.DOB = '01-01-2000'
      }
      if (!partner.address) {
        changeFlag = true
        nPartner.address = zeroAddress
      }
      return nPartner
    })

    if (changeFlag) setPartners(newPartners)
    //Check if partner has DOB already
    //If not, set to default
    if (document.activeElement?.getAttribute('data-testid') !== 'record-type-input') {
      setIsFocusedPartnerType(false)
    }
  }, [partners])

  useEffect(() => {
    //Upon partnerInputNumber change, check if the partners[partnerInputNumber] object has keys/vals already
    // If not, add a new object using the correct partnerSchema to instantiate an object to updated in the input (with empty placeholder vals)
    if (partners.length === partnerInputNumber && partners.length > 0) {
      let tempPartnerObj: any = {}
      Object.keys(relevantFields).forEach((field) => {
        if (relevantFields[field] === 'number') {
          tempPartnerObj[field] = 0
        } else if (relevantFields[field] === 'Array') {
          tempPartnerObj[field] = []
        } else {
          tempPartnerObj[field] = ''
        }
      })
      setPartners((prevPartners: any) => [...prevPartners, tempPartnerObj])
    }
  }, [partnerInputNumber])

  const removePartner = (partnerNumber: number) => {
    setPartners((prevPartners: any) => {
      // Filter out the element at the specified index
      const updatedPartners = prevPartners.filter(
        (_: any, index: number) => index !== partnerNumber,
      )
      // Return the updated partners array
      return updatedPartners
    })

    let newInputNumber = partnerNumber - 1
    if (newInputNumber < 0) newInputNumber = 0
    setPartnerInputNumber(newInputNumber)
  }

  const editPartner = (partnerNumber: number) => {
    setPartnerInputNumber(partnerNumber)
  }

  let inputEle = null

  const partnersEle = partners.map((partner: any, i: number) => {
    if (i === partnerInputNumber && Object.keys(partner)?.length > 0) {
      inputEle = (
        <>
          {Object.keys(partner).map((field) => {
            const fieldType = relevantFields?.[field]
            if (field === 'roles' || field === 'shares' || field === 'lockup') return null
            if (fieldType === 'date') {
              return (
                <InputWrapper key={field}>
                  <Calendar
                    labelText={'Partner ' + field}
                    labelHeight={62}
                    value={new Date(partner?.[field]).getTime() / 1000 + 15000}
                    onChange={(e) => {
                      const { valueAsDate } = e.currentTarget
                      if (valueAsDate) {
                        setPartners((prevPartners: any) => {
                          const updatedPartners = [...prevPartners]
                          const updatedPartner = {
                            ...updatedPartners[i],
                            [field]: e.currentTarget.value,
                          }
                          updatedPartners[i] = updatedPartner
                          return updatedPartners
                        })
                      }
                    }}
                    highlighted
                    name={name}
                    min={0}
                  />
                </InputWrapper>
              )
            }
            if (field === 'type') {
              return (
                <InputWrapper key={field}>
                  <Input
                    size="large"
                    value={partner?.[field]}
                    ref={inputRef}
                    label={'Partner ' + field}
                    error={false}
                    placeholder={'Partner ' + field}
                    data-testid="record-type-input"
                    validated={true}
                    disabled={false}
                    onFocus={() => setIsFocusedPartnerType(true)}
                    onChange={(e) => {
                      if (
                        fieldType === 'number' &&
                        !Number(e.target.value) &&
                        e.target.value !== ''
                      ) {
                        return
                      }
                      setPartners((prevPartners: any) => {
                        const updatedPartners = [...prevPartners]
                        const updatedPartner = { ...updatedPartners[i], [field]: e.target.value }
                        updatedPartners[i] = updatedPartner
                        return updatedPartners
                      })
                    }}
                  />
                  {isFocusedPartnerType ? (
                    <div
                      style={{
                        position: 'absolute',
                        zIndex: '1000',
                        width: '100%',
                        backgroundColor: 'white',
                        marginTop: '-16px',
                        borderBottom: '1px solid hsl(216 100% 61%)',
                        borderLeft: '1px solid hsl(216 100% 61%)',
                        borderRight: '1px solid hsl(216 100% 61%)',
                        padding: '6px',
                        color: 'hsl(216 100% 61%)',
                        // marginLeft: '20px',
                        borderBottomRightRadius: '20px',
                        borderBottomLeftRadius: '20px',
                      }}
                    >
                      {partnerTypes.standard[intakeType].map((type: any, idx: number) => {
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setPartners((prevPartners: any) => {
                                const updatedPartners = [...prevPartners]
                                const updatedPartner = { ...updatedPartners[i], type }
                                updatedPartners[i] = updatedPartner
                                return updatedPartners
                              })
                            }}
                            style={{ width: '100%', padding: '4px 10px', cursor: 'pointer' }}
                          >
                            <span>{type}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </InputWrapper>
              )
            }
            return (
              <InputWrapper key={field}>
                <Input
                  size="large"
                  value={partner?.[field]}
                  label={'Partner ' + field}
                  error={false}
                  placeholder={'Partner ' + field}
                  data-testid="record-input-input"
                  validated={true}
                  disabled={false}
                  onChange={(e) => {
                    if (
                      fieldType === 'number' &&
                      !Number(e.target.value) &&
                      e.target.value !== ''
                    ) {
                      return
                    }
                    setPartners((prevPartners: any) => {
                      const updatedPartners = [...prevPartners]
                      const updatedPartner = { ...updatedPartners[i], [field]: e.target.value }
                      updatedPartners[i] = updatedPartner
                      return updatedPartners
                    })
                  }}
                />
              </InputWrapper>
            )
          })}
        </>
      )
      return null
    } else {
      return (
        <div key={i + 'partner'} style={{ margin: '10px', textAlign: 'left' }}>
          <Button colorStyle="blueSecondary" onClick={() => editPartner(i)}>
            Partner - {partner?.name || '...'}
          </Button>
        </div>
      )
    }
  })

  return (
    <div style={{ marginBottom: '44px' }}>
      <NameContainer>{name}</NameContainer>
      <Button
        style={{ width: '260px', fontSize: '20px', marginTop: '12px', marginLeft: '6px' }}
        onClick={() => editPartner(partners.length)}
      >
        + Partner
      </Button>
      <Button
        style={{ width: '260px', fontSize: '20px', marginTop: '12px', marginLeft: '6px' }}
        disabled={partners.length === 1}
        colorStyle="redPrimary"
        onClick={() => removePartner(partnerInputNumber)}
      >
        - Partner
      </Button>
      <div style={{ marginTop: '20px' }}>
        {inputEle}
        {partnersEle}
      </div>
    </div>
  )
}

export default AddPartners
