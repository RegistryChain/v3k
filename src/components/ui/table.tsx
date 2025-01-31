import styled from "styled-components";
import * as React from "react";

// Styled Components
const StyledTableWrapper = styled.div`
  position: relative;
  width: 100%;
  overflow: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  caption-side: bottom;
  font-size: 0.875rem; 
  border-collapse: separate;
  border-spacing: 0 10px;

`;

const StyledTableHeader = styled.thead`
  background: white;

  &:hover {
    background: white;
  }

  tr {
    border-bottom: 2px solid #e5e7eb;
  }
`;

const StyledTableBody = styled.tbody`
  tr:last-child {
    border-bottom: none;
  }
`;

const StyledTableFooter = styled.tfoot`
  border-top: 1px solid #e5e7eb;
  background: rgba(229, 231, 235, 0.5);
  font-weight: 500;
  tr:last-child {
    border-bottom: none;
  }
`;

const StyledTableRow = styled.tr`
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;

  td {
    background: var(--color-gray-100);
    color: #494949;
    font-weight: 500;
  }
  
  &:hover td {
    background: var(--color-gray-200);
  }
`;

const StyledTableHead = styled.th`
  height: 2.5rem;
  padding: 0.5rem;
  text-align: left;
  vertical-align: middle;
  font-weight: 600;
  color: #6b7280;
`;

const StyledTableCell = styled.td`
  padding: 1rem 0.5rem;
  vertical-align: middle;
  white-space: nowrap;
`;

const StyledTableCaption = styled.caption`
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
`;
interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  className?: string;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <StyledTableWrapper className={className}>
      <StyledTable ref={ref} {...props} />
    </StyledTableWrapper>
  )
);

Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ ...props }, ref) => <StyledTableHeader ref={ref} {...props} />);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ ...props }, ref) => <StyledTableBody ref={ref} {...props} />);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ ...props }, ref) => <StyledTableFooter ref={ref} {...props} />);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ ...props }, ref) => <StyledTableRow ref={ref} {...props} />);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ ...props }, ref) => <StyledTableHead ref={ref} {...props} />);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ ...props }, ref) => <StyledTableCell ref={ref} {...props} />);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ ...props }, ref) => <StyledTableCaption ref={ref} {...props} />);
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
