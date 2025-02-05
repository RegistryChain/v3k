import { useState } from 'react'
import { RxAvatar } from 'react-icons/rx'
import { match, P } from 'ts-pattern'
import { createPublicClient, http, zeroAddress, type Address } from 'viem'
import { normalize } from 'viem/ens'
import { useAccount } from 'wagmi'

import { Spinner } from '@ensdomains/thorin'

import DownDirectionSVG from '@app/assets/SortAscending.svg'
import UpDirectionSVG from '@app/assets/SortDescending.svg'
import { Button } from '@app/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@app/components/ui/table'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { Entity, Partner } from '@app/types/directory'

import * as Styles from './DirectoryTable.styles'

const {
  ButtonContainer,
  EllipsisContainer,
  DirectionButton,
  Status,
  EmptyDetailContainer,
  Container,
  TableContainer,
} = Styles

const itemsPerPage = 25

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

export const DirectoryTable = ({
  data,
  isLoadingNextPage,
  fetchData,
  sortDirection,
  onSortDirectionChange,
  page,
  setPage,
}: DirectoryTableProps) => {
  const router = useRouterWithHistory()
  const tld = 'registrychain.com'
  const { address } = useAccount()

  const isOwner = (entity: any) =>
    entity.partners?.some((partner: Partner) => partner.wallet__address === address)

  const handleClickRow = (entity: Entity) => {
    let domain = null
    try {
      domain = normalize(
        entity.entity__name
          .replace(/[()#@%!*?:"'+,.&\/]/g, '') // Remove unwanted characters
          .replace(/ /g, '-') // Replace spaces with hyphens
          .replace(/-{2,}/g, '-') +
          '.' +
          entity.entity__registrar +
          '.' +
          tld,
      )
    } catch (err) {
      domain = (entity.entity__name + '.' + entity.entity__registrar + '.' + tld).toLowerCase()
    }
    router.push('/entity/' + domain)
  }

  const columns: IColumn<Entity>[] = [
    {
      label: 'Owner',
      key: 'partners',
      render: (row: Entity) => (isOwner(row) && <RxAvatar />) || '',
    },
    {
      label: 'Company Name',
      key: 'entity__name',
      render: (row: Entity) => <EllipsisContainer>{row.entity__name}</EllipsisContainer>,
      actions: () => (
        <DirectionButton
          $active={sortDirection === 'asc'}
          onClick={() => onSortDirectionChange?.(sortDirection === 'asc' ? 'desc' : 'asc')}
        >
          {sortDirection === 'asc' ? <UpDirectionSVG /> : <DownDirectionSVG />}
        </DirectionButton>
      ),
    },
    {
      label: 'Company Type',
      key: 'entity__type',
      render: (row) => <EllipsisContainer>{row.entity__type}</EllipsisContainer>,
    },
    {
      label: 'Address',
      key: 'entity__address',
      render: (row) => <EllipsisContainer>{row.entity__address}</EllipsisContainer>,
    },
    {
      label: 'Registrar',
      key: 'entity__registrar',
      render: (row) => row.entity__registrar,
    },
    // {
    //   label: 'LEI',
    //   key: 'LEI',
    //   render: (row) => row.LEI
    // },
    {
      label: 'Creation Date',
      key: 'entity__formation__date',
      render: (row) =>
        row.entity__formation__date
          ? new Date(row.entity__formation__date).toLocaleDateString()
          : '',
    },
  ]

  const paginatedData = data.slice(page * itemsPerPage, (page + 1) * itemsPerPage)

  const handleNextPage = async () => {
    setPage((prevPage: number) => prevPage + 1)
    await fetchData(page + 1)
  }

  const handlePrevPage = async () => {
    if (page === 0) return
    setPage((prevPage: number) => prevPage - 1)
    await fetchData(page - 1)
  }

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
                  style={{ cursor: 'pointer' }}
                >
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex} className={column.className}>
                      {column.render ? column.render(row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              )),
            )}
        </TableBody>
      </Table>
      <ButtonContainer>
        <Button disabled={page === 0} onClick={handlePrevPage}>
          Previous
        </Button>
        <span>Page {page + 1}</span>
        <Button disabled={isLoadingNextPage} onClick={handleNextPage}>
          Next
        </Button>
      </ButtonContainer>
    </TableContainer>
  )
}
