import { useRouter } from 'next/router';
import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, PromiseLikeOfReactNode, Key } from 'react';
import { ReactI18NextChild } from 'react-i18next';
import styled from 'styled-components';

const PartnerContainer = styled.div`
  width: 100%;
 
  overflow: hidden;
  margin-top: 20px;
`;

const PartnerTable = styled.div`
  display: table;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px;
`;

const PartnerRow = styled.div<{ isHeader?: boolean }>`
  display: table-row;
  background: ${(props) => (props.isHeader ? '#f5f5f5' : 'white')};
  font-weight: ${(props) => (props.isHeader ? 'bold' : 'normal')};
`;

const PartnerCell = styled.div<{ isHeader?: boolean }>`
  display: table-cell;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  text-align: left;
  font-size: 14px;
  vertical-align: middle;
  color: ${(props) => (props.isHeader ? '#333' : '#555')};
  font-weight: ${(props) => (props.isHeader ? 'bold' : 'normal')};
  background: ${(props) => (props.isHeader ? '#f5f5f5' : 'white')};
`;


const CompanyPartners = ({ partners, compareToOldValues }: any) => {
  const router = useRouter();

  return (
    <PartnerContainer>
      <PartnerTable>
        {partners.map((partner: {
          [x: string]: {
            [x: string]: any; setValue: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | PromiseLikeOfReactNode | Iterable<ReactI18NextChild> | null | undefined;
          }; domain?: any; name?: any;
        }, idx: Key | null | undefined) => (
          Object.keys(partner).map((key, subIdx) => (
            <PartnerRow key={subIdx}>
              <PartnerCell isHeader>{partner[key]?.label || key}</PartnerCell>
              <PartnerCell>
                {partner[key].oldValue && compareToOldValues ? (
                  <span style={{ color: 'red', textDecoration: 'line-through' }}>
                    {Array.isArray(partner[key].oldValue)
                      ? partner[key].oldValue.join(', ')
                      : partner[key].oldValue}
                  </span>
                ) : null}{' '}
                {Array.isArray(partner[key].setValue)
                  ? partner[key].setValue.join(', ')
                  : partner[key].setValue}
              </PartnerCell>
            </PartnerRow>
          ))
        ))}
      </PartnerTable>
    </PartnerContainer>
  );
};

export {
  CompanyPartners
};