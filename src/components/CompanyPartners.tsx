import { useRouter } from 'next/router'
import {
  JSXElementConstructor,
  Key,
  PromiseLikeOfReactNode,
  ReactElement,
  ReactNode,
  ReactPortal,
} from 'react'
import { ReactI18NextChild } from 'react-i18next'
import styled from 'styled-components'
import { normalize } from 'viem/ens'

import { Partner } from '@app/types/directory'
import { normalizeLabel } from '@app/utils/utils'

const PartnerContainer = styled.div`
  width: 100%;

  overflow: hidden;
  margin-top: 20px;
`

const PartnerTable = styled.div`
  display: table;
  width: 100%;
  border-collapse: collapse;
`

const PartnerRow = styled.div<{ isHeader?: boolean }>`
  display: table-row;
  background: ${(props) => (props.isHeader ? '#f5f5f5' : 'white')};
  font-weight: ${(props) => (props.isHeader ? 'bold' : 'normal')};
  cursor: pointer;
`

const PartnerCell = styled.div<{ isHeader?: boolean }>`
  display: table-cell;
  padding: 12px 16px;
  border: 1px solid #ddd;
  text-align: left;
  font-size: 14px;
  vertical-align: middle;
  color: ${(props) => (props.isHeader ? '#333' : '#555')};
  font-weight: ${(props) => (props.isHeader ? 'bold' : 'normal')};
`

const PartnerLink = styled.a`
  text-decoration: underline;
  color: #007bff;
  &:hover {
    color: #0056b3;
  }
`
const tld = 'entity.id'

const CompanyPartners = ({
  partners,
  compareToOldValues,
}: {
  partners: any[]
  compareToOldValues: any
}) => {
  return (
    <PartnerContainer>
      <PartnerTable>
        {partners?.length > 0
          ? partners.map((partner, idx) => {
              let domain = partner?.domain?.setValue || ''

              return Object.keys(partner)
                .filter(
                  (key) => !['DOB', 'physical__address', 'lockup', 'shares', 'roles'].includes(key),
                )
                .map((key, subIdx) => {
                  const partnerValue = partner[key] as
                    | {
                        label?: string
                        oldValue?: string | string[]
                        setValue?: string | string[]
                      }
                    | string
                    | undefined

                  const isHeader =
                    partnerValue && typeof partnerValue !== 'string'
                      ? partnerValue.label || key
                      : key
                  const oldValue =
                    partnerValue &&
                    typeof partnerValue !== 'string' &&
                    partnerValue.oldValue &&
                    compareToOldValues ? (
                      <span style={{ color: 'red', textDecoration: 'line-through' }}>
                        {Array.isArray(partnerValue.oldValue)
                          ? partnerValue.oldValue.join(', ')
                          : partnerValue.oldValue}
                      </span>
                    ) : null

                  let setValue = ''
                  if (partnerValue && typeof partnerValue !== 'string') {
                    if (Array.isArray(partnerValue.setValue)) {
                      setValue = partnerValue.setValue.join(', ')
                    } else {
                      setValue = partnerValue.setValue ?? ''
                    }
                  }

                  return (
                    <PartnerRow
                      key={subIdx}
                      onClick={() => {
                        if (!domain.includes('.ai.')) return 'https://entity.id/entity/' + domain
                        return (window.location.href = '/agent/' + domain)
                      }}
                    >
                      <PartnerCell isHeader>{isHeader}</PartnerCell>
                      <PartnerCell>
                        {oldValue} {setValue}
                      </PartnerCell>
                    </PartnerRow>
                  )
                })
            })
          : null}
      </PartnerTable>
    </PartnerContainer>
  )
}

export { CompanyPartners }
