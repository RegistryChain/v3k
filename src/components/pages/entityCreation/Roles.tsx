import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { Input, mq, Toggle, Typography } from '@ensdomains/thorin'

import contractAddresses from '../../../constants/contractAddresses.json'

const InputWrapper = styled.div(
  ({ theme }) => css`
    flex: 1;
    position: relative;
    width: 100%;
  `,
)

const Roles = ({
  data,
  canChange,
  intakeType,
  roleTypes,
  profile,
  setProfile,
  setPartners,
  partners,
  publicClient,
}: any) => {
  const { t } = useTranslation('intake')

  const relevantRoles = [
    ...roleTypes.standard[intakeType],
    ...(roleTypes?.[data?.registrarKey] || []),
  ]

  const partnerPercentages: any = {}
  let totalSharesReconstruct = 0

  partners.forEach((f: any) => {
    totalSharesReconstruct += f.shares || 0
  })

  partners.forEach((f: any) => {
    partnerPercentages[f.name] = (100 * f.shares) / Number(totalSharesReconstruct) || 0
  })
  const [totalShares, setTotalShares] = useState<string>((totalSharesReconstruct || 1000000) + '')
  const [sharePercentages, setSharePercentages] = useState<any>({ ...partnerPercentages })

  const ownersData = async () => {
    const client: any = publicClient
    // Here fetch the resolver data
    // const resolver = await getContract({
    //   client,
    //   abi: parseAbi([
    //     'function text(bytes32 node, string calldata key) view returns (string memory)',
    //   ]),
    //   address: contractAddresses.PublicResolver as Address,
    // })
  }

  useEffect(() => {
    ownersData()
  }, [])

  const align: any = '-webkit-right'

  const partnersEle = partners.map((partner: any, idx: number) => {
    const inputEle = (
      <div key={'partnersEleDiv' + idx} style={{ display: 'flex' }}>
        <Typography style={{ flex: 3 }}>{partner.name}</Typography>

        {relevantRoles.map((role) => {
          return (
            <div key={'rolediv' + role} style={{ flex: 2, textAlign: align }}>
              <Toggle
                size={'small'}
                checked={partner.roles.includes(role)}
                data-testid="primary-name-toggle"
                disabled={!canChange}
                onChange={(e) => {
                  e.stopPropagation()
                  const roleChecked = partner.roles.includes(role)
                  setPartners((prevPartners: any) => {
                    try {
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
                    } catch (err) {}
                  })
                }}
              />
            </div>
          )
        })}
      </div>
    )
    return inputEle
  })

  const ownershipSection = (
    <div key={'ownershipSec'} style={{ marginTop: '24px' }}>
      <div key={'ownsec1'}>
        <span style={{ fontSize: '42px' }}>{t('steps.roles.title.section2')}</span>
      </div>
      <div key={'ownsec2'} style={{ display: 'block' }}>
        <InputWrapper key={'inpwra1'}>
          <Input
            size="medium"
            value={totalShares}
            label={t('steps.roles.totalShares.label')}
            error={false}
            placeholder={t('steps.roles.totalShares.label')}
            data-testid="record-input-input"
            validated={true}
            disabled={!canChange}
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
        <InputWrapper key={'inpwra2'} style={{ flex: 2 }}>
          <Input
            size="medium"
            value={profile.lockup__days || 0}
            label={t('steps.roles.ownershipLockup.label')}
            error={false}
            placeholder={t('steps.roles.ownershipLockup.label')}
            data-testid="record-input-input"
            validated={true}
            disabled={!canChange}
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
            <div
              key={'partners' + idx}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Typography style={{ flex: 3 }}>{partner.name}</Typography>
              <InputWrapper key={'inpwraPart1' + idx} style={{ flex: 3 }}>
                <Input
                  size="medium"
                  value={sharePercentages[partner.name]}
                  label={t('steps.roles.ownershipPercentage.label')}
                  error={false}
                  placeholder={t('steps.roles.ownershipPercentage.label')}
                  data-testid="record-input-input"
                  validated={true}
                  disabled={!canChange}
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
                        updatedPartners[idx] = updatedPartner
                        return updatedPartners
                      })
                    }
                  }}
                />
              </InputWrapper>
              <InputWrapper key={'inpwraPart2' + idx} style={{ flex: 3, cursor: 'not-allowed' }}>
                <Input
                  size="medium"
                  style={{ cursor: 'not-allowed' }}
                  value={Math.ceil(Number(totalShares) * (sharePercentages[partner.name] / 100))}
                  label={t('steps.roles.ownershipShares.label')}
                  error={false}
                  placeholder={t('steps.roles.ownershipShares.label')}
                  data-testid="record-input-input"
                  validated={true}
                  disabled={true}
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
                    {t('steps.roles.ownershipLockup.label')}
                  </label>
                </div>
                <div
                  key={'lockupinput' + partner.name}
                  style={{ height: '3rem', alignContent: 'center' }}
                >
                  <Toggle
                    size={'small'}
                    checked={partner.lockup || false}
                    disabled={!canChange}
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
      <div key={'titleRoles'}>
        <span style={{ fontSize: '42px' }}>{t('steps.roles.title.section1')}</span>
      </div>
      <div key={'relevantRolesSection'} style={{ marginTop: '20px' }}>
        <div key={'relevantRolesHeading'} style={{ display: 'flex' }}>
          <Typography style={{ flex: 3 }}></Typography>
          {relevantRoles.map((role) => {
            return (
              <Typography
                key={'roleText-' + role}
                style={{ flex: 2, textAlign: align, fontSize: '20px' }}
              >
                {role}
              </Typography>
            )
          })}
        </div>
        {partnersEle}
        {ownershipSection}
      </div>
    </div>
  )
}

export default Roles
