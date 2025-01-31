import { Key } from 'react'
import styled from 'styled-components'

import { CheckmarkSymbol } from './CheckmarkSymbol'
import { ExclamationSymbol } from './ExclamationSymbol'

const CompanyContainer = styled.div`
  width: 100%;
  overflow: hidden;
`

const StyledTable = styled.div`
  display: table;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px;
`

const Row = styled.div<{ isHeader?: boolean }>`
  display: table-row;
  background: ${(props) => (props.isHeader ? '#f5f5f5' : 'white')};
  font-weight: ${(props) => (props.isHeader ? 'bold' : 'normal')};
`

const Cell = styled.div<{ isHeader?: boolean }>`
  display: table-cell;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  text-align: left;
  font-size: 14px;
  vertical-align: middle;
  color: ${(props) => (props.isHeader ? '#333' : '#555')};
  font-weight: ${(props) => (props.isHeader ? 'bold' : 'normal')};
  background: ${(props) => (props.isHeader ? '#f5f5f5' : 'white')};
`

const StatusIndicator = styled.span`
  display: inline-flex;
  align-items: center;
  &::before {
    content: '\u25CF';
    color: green;
    margin-right: 8px;
  }
`

const CompanyInfo = ({ headerSection, filteredCompanyData, fields }: any) => {
  return (
    <CompanyContainer>
      <StyledTable>
        {filteredCompanyData?.map((field: string, idx: Key | null | undefined) => {
          const key = fields[field].label || field

          const differenceCondition =
            fields.jurisdictionalSource?.setValue?.[field]?.toUpperCase() !==
              fields[field]?.setValue?.toUpperCase() &&
            fields.jurisdictionalSource?.setValue?.[field]

          const sameCondition =
            fields.jurisdictionalSource?.setValue?.[field]?.toUpperCase() ===
            fields[field]?.setValue?.toUpperCase()

          return (
            <Row key={idx}>
              <Cell isHeader>
                <div style={{ display: 'flex' }}>
                  {key}
                  {differenceCondition ? (
                    <div style={{ marginLeft: '4px', alignItems: 'center' }}>
                      <ExclamationSymbol
                        tooltipText={
                          fields[field].label +
                          ' is not matching on jurisdictional registrar source'
                        }
                      />
                    </div>
                  ) : (
                    ''
                  )}
                  {sameCondition ? (
                    <CheckmarkSymbol
                      tooltipText={fields[field].label + ' is matches on  registrar source'}
                    />
                  ) : null}
                </div>
              </Cell>
              <Cell>
                {field === 'status' ? (
                  <StatusIndicator>{fields[field].setValue}</StatusIndicator>
                ) : (
                  fields[field].setValue
                )}
              </Cell>
            </Row>
          )
        })}
      </StyledTable>
    </CompanyContainer>
  )
}

export default CompanyInfo
