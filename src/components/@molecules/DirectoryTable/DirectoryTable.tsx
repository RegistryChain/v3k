import { RxAvatar } from 'react-icons/rx'
import { normalize } from 'viem/ens'
import { useAccount } from 'wagmi'

import DownDirectionSVG from '@app/assets/SortAscending.svg'
import UpDirectionSVG from '@app/assets/SortDescending.svg'
import { AgentGrid } from '@app/components/pages/landingPage/AgentGrid'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { Entity, Partner } from '@app/types/directory'

import * as Styles from './DirectoryTable.styles'
import { Button } from '@mui/material'
import { Typography } from '@ensdomains/thorin'

const { ButtonContainer } = Styles

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
  connectedIsAdmin: boolean,
  moderateEntity: any
  finishedLoading: boolean
}

export const DirectoryTable = ({
  data,
  isLoadingNextPage,
  finishedLoading,
  fetchData,
  sortDirection,
  onSortDirectionChange,
  page,
  setPage,
  connectedIsAdmin,
  moderateEntity
}: DirectoryTableProps) => {

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
    <div>
      {data?.length > 0 || !finishedLoading ? <AgentGrid connectedIsAdmin={connectedIsAdmin} moderateEntity={moderateEntity} boxes={data} onRate={() => null} /> : <Typography fontVariant="headingTwo">No agents found!</Typography>}

      <ButtonContainer>
        <Button disabled={page === 0} onClick={handlePrevPage}>
          Previous
        </Button>
        <span>Page {page + 1}</span>
        <Button disabled={isLoadingNextPage} onClick={handleNextPage}>
          Next
        </Button>
      </ButtonContainer>
    </div>
  )
}
