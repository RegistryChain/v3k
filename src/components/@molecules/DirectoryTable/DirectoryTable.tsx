import { RxAvatar } from 'react-icons/rx'
import { normalize } from 'viem/ens'
import { useAccount } from 'wagmi'

import DownDirectionSVG from '@app/assets/SortAscending.svg'
import UpDirectionSVG from '@app/assets/SortDescending.svg'
import { AgentGrid } from '@app/components/pages/landingPage/AgentGrid'
import { Button } from '@app/components/ui/button'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { Entity, Partner } from '@app/types/directory'

import * as Styles from './DirectoryTable.styles'

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
  const tld = 'entity.id'
  const { address } = useAccount()

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
    <div>
      <AgentGrid boxes={paginatedData} onRate={() => null} />
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
