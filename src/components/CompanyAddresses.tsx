import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, PromiseLikeOfReactNode, Key } from "react";
import { ReactI18NextChild } from "react-i18next";
import styled from "styled-components";
import { zeroAddress } from 'viem'
import { Attestation } from "./Attestation";

const AddressContainer = styled.div`
  width: 100%;
  margin-top: 20px;
`;

const AddressTable = styled.div`
  display: table;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px;
`;

const AddressRow = styled.div`
  display: table-row;
  background: white;
`;

const AddressCell = styled.div<{ isHeader?: boolean }>`
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

const AddressLink = styled.a`
  text-decoration: underline;
  color: #007bff;
  &:hover {
    color: #0056b3;
  }
`;

const CompanyAddresses = ({ addressesObj }: any) => {
  return (
    <AddressContainer>
      <AddressTable>
        {addressesObj.map((addressObj: { key: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | PromiseLikeOfReactNode | Iterable<ReactI18NextChild> | null | undefined; value: string | number | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | PromiseLikeOfReactNode | null | undefined; }, idx: Key | null | undefined) => (
          <AddressRow key={idx}>
            <AddressCell isHeader>{addressObj.key}</AddressCell>
            <AddressCell>
              {addressObj.value && addressObj.value !== zeroAddress ? (
                <AddressLink href={`https://sepolia.etherscan.io/address/${addressObj.value}`} target="_blank">
                  {addressObj.value} {' '}
                  <Attestation userAddress={addressObj.value}></Attestation>
                </AddressLink>
              ) : addressObj.value
              }
            </AddressCell>
          </AddressRow>
        ))}
      </AddressTable>
    </AddressContainer>
  );
};

export {
  CompanyAddresses
};