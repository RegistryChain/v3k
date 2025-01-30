import { useCallback, useEffect, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { isAddress, zeroAddress } from 'viem'
import { useAccount } from 'wagmi'

import { Button, Dialog, Input, mq } from '@ensdomains/thorin'

import { Calendar } from '@app/components/@atoms/Calendar/Calendar'

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
  canChange,
  partnerTypes,
  emptyPartner,
  intakeType,
  setPartners,
  partners,
  publicClient,
  breakpoints,
}: any) => {
  const name = data?.name || ''
  const [partnerInputNumber, setPartnerInputNumber] = useState(0)
  const [isFocusedPartnerType, setIsFocusedPartnerType] = useState(false)

  const inputRef = useRef(null)
  const { address } = useAccount()

  useEffect(() => {
    const firstPartnerWallet = partners[0]?.wallet__address?.setValue
    if (!firstPartnerWallet || !isAddress(firstPartnerWallet)) {
      const updatedPartners = [...partners]
      const updatedPartner = {
        ...updatedPartners[0],
        wallet__address: {
          ...updatedPartners[0].wallet__address,
          setValue: address,
        },
      }
      updatedPartners[0] = updatedPartner
      setPartners(updatedPartners)
    }
  }, [])

  useEffect(() => {
    if (document.activeElement?.getAttribute('data-testid') !== 'record-type-input') {
      setIsFocusedPartnerType(false)
    }
  }, [partners])

  const removePartner = (partnerNumber: number) => {
    const updatedPartners = partners.filter((_: any, index: number) => index !== partnerNumber)
    // Filter out the element at the specified index
    // Return the updated partners array
    setPartners(updatedPartners)

    let newInputNumber = partnerNumber - 1
    if (newInputNumber < 0) newInputNumber = 0
    setPartnerInputNumber(newInputNumber)
  }

  const editPartner = (partnerNumber: number) => {
    if (partners.length === partnerNumber && partners.length > 0) {
      setPartners([...partners, { ...emptyPartner }])
    }
    setPartnerInputNumber(partnerNumber)
  }

  let inputEle = null
  const partnersEle = partners.map((partner: any, i: number) => {
    if (i === partnerInputNumber) {
      inputEle = (
        <>
          {Object.keys(partner).map((field) => {
            const fieldType = partner?.[field]?.type
            if (field === 'roles' || field === 'shares' || field === 'lockup') return null
            if (fieldType === 'Date') {
              let inputValue = 946699800
              if (partner?.[field]?.setValue) {
                inputValue = new Date(partner?.[field]?.setValue).getTime() / 1000 + 15000
              }
              return (
                <InputWrapper key={partner[field]?.label}>
                  <Calendar
                    labelText={partner[field]?.label}
                    labelHeight={62}
                    disabled={!canChange}
                    value={inputValue}
                    onChange={(e) => {
                      const { valueAsDate } = e.currentTarget
                      if (valueAsDate) {
                        const updatedPartners = [...partners]
                        const updatedPartner = {
                          ...updatedPartners[i],
                          [field]: {
                            ...updatedPartners[i][field],
                            setValue: e.currentTarget.value,
                          },
                        }
                        updatedPartners[i] = updatedPartner
                        setPartners(updatedPartners)
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
                <InputWrapper key={partner?.[field]?.label}>
                  <Input
                    size="large"
                    value={partner?.[field]?.setValue}
                    ref={inputRef}
                    label={partner?.[field]?.label}
                    placeholder={'Partner ' + partner?.[field]?.label}
                    data-testid="record-type-input"
                    disabled={!canChange}
                    onFocus={() => setIsFocusedPartnerType(true)}
                    onChange={(e) => {
                      if (
                        fieldType === 'number' &&
                        !Number(e.target.value) &&
                        e.target.value !== ''
                      ) {
                        return
                      }
                      const updatedPartners = [...partners]
                      const updatedPartner = {
                        ...updatedPartners[i],
                        [field]: { ...updatedPartners[i][field], setValue: e.target.value },
                      }
                      updatedPartners[i] = updatedPartner
                      setPartners(updatedPartners)
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
                              if (!canChange) return
                              const updatedPartners = [...partners]
                              const updatedPartner = {
                                ...updatedPartners[i],
                                [field]: { ...updatedPartners[i][field], setValue: type },
                              }
                              updatedPartners[i] = updatedPartner
                              setPartners(updatedPartners)
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
            let focusOnFunction: any = () => null
            let focusOffFunction: any = () => null
            if (field === 'wallet__address') {
              focusOnFunction = () => {
                if (
                  !isAddress(partner?.[field]?.setValue) ||
                  partner?.[field]?.setValue === zeroAddress
                ) {
                  const updatedPartners = [...partners]
                  const updatedPartner = {
                    ...updatedPartners[i],
                    [field]: { ...updatedPartners[i][field], setValue: '' },
                  }
                  updatedPartners[i] = updatedPartner
                  setPartners(updatedPartners)
                }
              }
              focusOffFunction = () => {
                if (
                  !isAddress(partner?.[field]?.setValue) ||
                  partner?.[field]?.setValue === zeroAddress
                ) {
                  const updatedPartners = [...partners]
                  const updatedPartner = {
                    ...updatedPartners[i],
                    [field]: { ...updatedPartners[i][field], setValue: zeroAddress },
                  }
                  updatedPartners[i] = updatedPartner

                  setPartners(updatedPartners)
                }
              }
            }
            return (
              <InputWrapper key={partner?.[field]?.label}>
                <Input
                  size="large"
                  value={partner?.[field]?.setValue}
                  label={partner?.[field]?.label}
                  onFocus={focusOnFunction}
                  onBlur={focusOffFunction}
                  error={false}
                  placeholder={'Partner ' + partner?.[field]?.label}
                  data-testid="record-input-input"
                  validated={true}
                  disabled={!canChange}
                  onChange={(e) => {
                    if (
                      fieldType === 'number' &&
                      !Number(e.target.value) &&
                      e.target.value !== ''
                    ) {
                      return
                    }
                    const updatedPartners = [...partners]
                    const updatedPartner = {
                      ...updatedPartners[i],
                      [field]: { ...updatedPartners[i][field], setValue: e.target.value },
                    }
                    updatedPartners[i] = updatedPartner
                    setPartners(updatedPartners)
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
            Partner - {partner?.name?.setValue || '...'}
          </Button>
        </div>
      )
    }
  })

  return (
    <div style={{ marginBottom: '44px' }}>
      <NameContainer>{name}</NameContainer>
      <Button
        style={{
          width: breakpoints.xs && !breakpoints.sm ? '100%' : '260px',
          fontSize: '20px',
          marginTop: '12px',
          marginLeft: '6px',
        }}
        onClick={() => editPartner(partners.length)}
        disabled={!canChange}
      >
        + Partner
      </Button>
      <Button
        style={{
          width: breakpoints.xs && !breakpoints.sm ? '100%' : '260px',
          fontSize: '20px',
          marginTop: '12px',
          marginLeft: '6px',
        }}
        disabled={partners.length === 1 || !canChange}
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
