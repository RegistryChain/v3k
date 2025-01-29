import { useState } from "react"

import { normalize } from 'viem/ens'
import { useAccount } from 'wagmi'
import { createPublicClient, http, zeroAddress, type Address } from 'viem'

import DownDirectionSVG from '@app/assets/SortAscending.svg'
import UpDirectionSVG from '@app/assets/SortDescending.svg'
import { CheckButton } from '@app/components/@atoms/CheckButton/CheckButton'
import { useRouterWithHistory } from "@app/hooks/useRouterWithHistory"
import { Entity } from "@app/types/directory"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@app/components/ui/table"
import { Spinner } from "@ensdomains/thorin"
import { EllipsisContainer, DirectionButton, Status, EmptyDetailContainer, Container, TableContainer } from "./DirectoryTable.styles"
import { Button } from "@app/components/ui/button"
import { match, P } from "ts-pattern"

const itemsPerPage = 25;

export interface IColumn<T> {
  label: string
  key: string
  render?: (row: T) => JSX.Element | string
  className?: string
  actions?: () => JSX.Element
}

interface DirectoryTableProps {
  data: Entity[]
  isLoadingNextPage: boolean
  fetchData: (pageNumber: number) => Promise<void>
  sortDirection: 'asc' | 'desc'
  onSortDirectionChange: (direction: 'asc' | 'desc') => void
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
}

export const DirectoryTable = ({ data, isLoadingNextPage, fetchData, sortDirection, onSortDirectionChange, page, setPage }: DirectoryTableProps) => {
  const router = useRouterWithHistory()
  const tld = 'chaser.finance'
  const { address } = useAccount()

  const isOwner = (entity: any) => address === entity.owner && entity.owner && entity.owner !== zeroAddress

  const handleClickRow = (entity: any) => () => {
    let domain = null
    try {
      domain = normalize(
        entity.company__name
          .replace(/[()#@%!*?:"'+,.&\/]/g, '') // Remove unwanted characters
          .replace(/ /g, '-') // Replace spaces with hyphens
          .replace(/-{2,}/g, '-') +
        '.' +
        entity.company__registrar +
        '.' +
        tld,
      )
    } catch (err) {
      domain = (entity.company__name + '.' + entity.company__registrar + '.' + tld).toLowerCase()
    }
    router.push('/entity/' + domain)
  }

  const columns: IColumn<Entity>[] = [
    {
      label: 'Company Name',
      key: 'company__name',
      render: (row: Entity) => <EllipsisContainer>{row.company__name}</EllipsisContainer>,
      actions: () => (
        <DirectionButton
          $active={sortDirection === 'asc'}
          onClick={() => onSortDirectionChange?.(sortDirection === 'asc' ? 'desc' : 'asc')}
        >
          {sortDirection === 'asc' ? <UpDirectionSVG /> : <DownDirectionSVG />}
        </DirectionButton>
      )
    },
    {
      label: 'Company Type',
      key: 'company__type',
      render: (row) => <EllipsisContainer>{row.company__type}</EllipsisContainer>
    },
    {
      label: 'Address',
      key: 'company__address',
      render: (row) => <EllipsisContainer>{row.company__address}</EllipsisContainer>
    },
    {
      label: 'Registrar',
      key: 'company__registrar',
      render: (row) => row.company__registrar
    },
    // {
    //   label: 'LEI',
    //   key: 'LEI',
    //   render: (row) => row.LEI
    // },
    {
      label: 'Status',
      key: 'company__status__GLEIF',
      render: (row) => (
        <Status $color={row.company__status__GLEIF.toLowerCase() === 'active' ? 'green' : ''}>
          {row.company__status__GLEIF !== 'NULL' ? row.company__status__GLEIF : 'Unknown'}
        </Status>
      )
    },
    {
      label: 'Creation Date',
      key: 'company__formation__date',
      render: (row) => row.company__formation__date ? new Date(row.company__formation__date).toLocaleDateString() : ''
    },
  ]

  const paginatedData = data.slice(page * itemsPerPage, (page + 1) * itemsPerPage);


  const handleNextPage = async () => {
    setPage((prevPage: number) => prevPage + 1);
    await fetchData(page + 1);
  };

  const handlePrevPage = async () => {
    if (page === 0) return;
    setPage((prevPage: number) => prevPage - 1);
    await fetchData(page - 1);
  };

  return (
    <TableContainer>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                <Container>
                  {column.label}
                  {column.actions ? column.actions() : ''}
                </Container>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>

          {match([isLoadingNextPage, paginatedData?.length ?? 0])
            .with([true, P._], () => (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyDetailContainer>
                    <Spinner color="accent" />
                  </EmptyDetailContainer>
                </TableCell>
              </TableRow>
            ))
            .with([false, 0], () => (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyDetailContainer>No entities found</EmptyDetailContainer>
                </TableCell>
              </TableRow>
            ))
            .otherwise(() =>
              paginatedData.map((row: any, index: number) => (
                <TableRow
                  key={row.id}
                  onClick={() => handleClickRow(row)}
                  style={{ cursor: "pointer" }}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      {isOwner(row) && <CheckButton />}
                      {column.render ? column.render(row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
        </TableBody>
      </Table>
      <div className="flex justify-between items-center mt-4 border-0">
        <Button
          disabled={page === 0}
          onClick={handlePrevPage}
        >
          Previous
        </Button>
        <span>Page {page + 1}</span>
        <Button
          disabled={isLoadingNextPage}
          onClick={handleNextPage}
        >
          Next
        </Button>
      </div>
    </TableContainer>
  )
}