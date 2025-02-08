import { match, P } from 'ts-pattern'
import { normalize } from 'viem/ens'

import App1 from '@app/assets/app-1.svg';
import App2 from '@app/assets/app-2.svg';
import App3 from '@app/assets/app-3.svg';
import Star from '@app/assets/star.svg';

import { Spinner } from '@ensdomains/thorin'

import { Button } from '@app/components/ui/button'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { Entity } from '@app/types/directory'

import * as Styles from './TilesView.styles'

const getRandomImage = () => {
  const images = [<App1 />, <App2 />, <App3 />]
  return images[Math.floor(Math.random() * images.length)]
}

const getRandomRatingNumber = () => {
  return (Math.floor(Math.random() * 20) + 38) / 10
}

const {
  ButtonContainer,
  AppContainer,
  EmptyDetailContainer,
  Container,
  Image,
  AppsGrid,
  Rating,
  StarContainer
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
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
}

export const TilesView = ({
  data,
  isLoadingNextPage,
  fetchData,
  page,
  setPage,
}: DirectoryTableProps) => {
  const router = useRouterWithHistory()
  const tld = 'entity.id'


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
    <Container>
      <AppsGrid>
        {match([isLoadingNextPage, paginatedData?.length ?? 0])
          .with([true, P._], () => (
            <div>
              <div>
                <EmptyDetailContainer>
                  <Spinner color="accent" />
                </EmptyDetailContainer>
              </div>
            </div>
          ))
          .with([false, 0], () => (
            <div>
              <div>
                <EmptyDetailContainer>No apps found</EmptyDetailContainer>
              </div>
            </div>
          ))
          .otherwise(() =>
            paginatedData.map((row: any, index: number) => (
              <AppContainer
                key={row.id}
                onClick={() => handleClickRow(row)}
                style={{ cursor: 'pointer' }}
              >
                <Image>
                  {getRandomImage()}
                </Image>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                  <div style={{ color: '#333', fontSize: '1.2rem', fontWeight: 600 }}>
                    {row.entity__name}
                  </div>
                  <Rating>
                    <strong>{getRandomRatingNumber()}</strong>
                    <StarContainer>
                      <Star />
                    </StarContainer>
                    Free to use
                  </Rating>
                  <div style={{ color: '#636769', fontSize: '0.8rem' }}>Lorem ipsum dolor sit amet, consectetur adipiscing elit</div>
                </div>
              </AppContainer>
            )),
          )}
      </AppsGrid>

      <ButtonContainer>
        <Button disabled={page === 0} onClick={handlePrevPage}>
          Previous
        </Button>
        <span>Page {page + 1}</span>
        <Button disabled={isLoadingNextPage} onClick={handleNextPage}>
          Next
        </Button>
      </ButtonContainer>
    </Container>
  )
}
