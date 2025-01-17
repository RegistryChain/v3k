import { useCallback, useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { match, P } from 'ts-pattern'
import { createPublicClient, http, zeroAddress, type Address } from 'viem'
import { sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'
import { useAccount } from 'wagmi'

import { createEnsPublicClient } from '@ensdomains/ensjs'
import { getSubnames, Name } from '@ensdomains/ensjs/subgraph'
import { Button, Spinner } from '@ensdomains/thorin'

import { InfiniteScrollContainer } from '@app/components/@atoms/InfiniteScrollContainer/InfiniteScrollContainer'
import { TaggedNameItem } from '@app/components/@atoms/NameDetailItem/TaggedNameItem'
import {
  NameTableHeader,
  SortDirection,
  SortType,
} from '@app/components/@molecules/NameTableHeader/NameTableHeader'
import { TabWrapper } from '@app/components/pages/profile/TabWrapper'
import { getEntitiesList } from '@app/hooks/useExecuteWriteToResolver'
import { useQueryParameterState } from '@app/hooks/useQueryParameterState'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { infuraUrl } from '@app/utils/query/wagmi'

const EmptyDetailContainer = styled.div(
  ({ theme }) => css`
    padding: ${theme.space['4']};
    display: flex;
    justify-content: center;
    align-items: center;
  `,
)

const TabWrapperWithButtons = styled(TabWrapper)(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: normal;
    justify-content: flex-start;
    width: 100%;
    max-width: 100%;
    background: ${theme.colors.backgroundPrimary};
  `,
)

const Footer = styled.div(
  ({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${theme.space['8']};
    border-top: 1px solid ${theme.colors.border};
  `,
)

type SubnameListViewProps = {}

export const SubnameListView = ({}: SubnameListViewProps) => {
  const router = useRouterWithHistory()
  const { address } = useAccount()
  const tld = 'chaser.finance'

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const [selectedNames, setSelectedNames] = useState<Name[]>([])

  const handleClickName = (entity: any) => () => {
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

  const [sortType, setSortType] = useState<any>('company__formation__date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [registrar, setRegistrarSelected] = useState<string>('any')

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchInput, setSearchInput] = useState(searchQuery)
  const [pageNumber, setPageNumber] = useState(0)
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false)
  const [finishedLoading, setFinishedLoading] = useState(false)

  const [subnameResults, setSubnameResults] = useState<any[]>([])
  const [subnameResLoaded, setSubnameResLoaded] = useState<Boolean>(false)

  const client: any = useMemo(
    () =>
      createEnsPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )

  const getSubs = async (currentRes: any[], page: number = pageNumber) => {
    try {
      const results = await getEntitiesList({
        registrar,
        nameSubstring: searchInput,
        page,
        sortDirection,
        sortType,
      })

      setSubnameResults([...currentRes, ...results])
      setIsLoadingNextPage(false)
      if (results.length !== 25) {
        setFinishedLoading(true)
      }
    } catch (err) {
      console.log(err)
    }
    setSubnameResLoaded(true)
  }

  useEffect(() => {
    setIsLoadingNextPage(true)
    if (pageNumber !== 0) {
      getSubs(subnameResults, pageNumber)
    }
  }, [pageNumber])

  useEffect(() => {
    setPageNumber(0)
    getSubs([], 0)
  }, [client, searchInput, registrar, sortType, sortDirection])

  const filteredSet = subnameResults.map((name) => {
    const labelName = name.name.split(name.parentName).join('').split('.').join('.')
    const domainId = labelName.split('-').pop().split('.').join('')
    const commonName = labelName
      .split('-')
      .slice(0, labelName.split('-').length - 1)
      .join(' ')
    return { ...name, labelName, commonName, domainId }
  })

  return (
    <TabWrapperWithButtons>
      <NameTableHeader
        mode={'view'}
        sortType={sortType}
        sortTypeOptionValues={['company__formation__date', 'name']}
        sortDirection={sortDirection}
        registrar={registrar}
        registrarOptionValues={['any', 'public', 'US-WY', 'US-CA', 'US-DE']}
        searchQuery={searchInput}
        selectedCount={selectedNames.length}
        onModeChange={(m) => {
          setSelectedNames([])
        }}
        onRegistrarChange={setRegistrarSelected}
        onSortDirectionChange={setSortDirection}
        onSortTypeChange={setSortType}
        onSearchChange={(s) => {
          setSearchInput(s)
        }}
      ></NameTableHeader>
      <div data-testid="names-list">
        {match([isMounted, subnameResLoaded, filteredSet?.length, searchQuery])
          .with([false, P._, P._, P._], () => null)
          .with([true, false, 0, P._], () => (
            <EmptyDetailContainer>
              <Spinner color="accent" />
            </EmptyDetailContainer>
          ))
          .with([true, true, 0, P._], () => {
            return <EmptyDetailContainer>No entities found.</EmptyDetailContainer>
          })
          .with([true, true, filteredSet?.length, P._], () => {
            return (
              <>
                <InfiniteScrollContainer
                  onIntersectingChange={(isVisible) => {
                    if (isVisible && !isLoadingNextPage && !finishedLoading) {
                      setPageNumber(pageNumber + 1)
                    }
                  }}
                  offset="150px"
                >
                  <div>
                    {filteredSet.map((entity) => {
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
                        domain = (
                          entity.company__name +
                          '.' +
                          entity.company__registrar +
                          '.' +
                          tld
                        ).toLowerCase()
                      }
                      return (
                        <TaggedNameItem
                          isOwner={
                            address === entity.owner && entity.owner && entity.owner !== zeroAddress
                          }
                          name={entity.company__name + ' (' + domain + ')'}
                          key={entity.LEI}
                          mode={'view'}
                          selected={false}
                          disabled={false}
                          onClick={handleClickName(entity)}
                        />
                      )
                    })}
                  </div>
                </InfiniteScrollContainer>
                {isLoadingNextPage && !finishedLoading ? (
                  <EmptyDetailContainer>
                    <Spinner color="accent" />
                  </EmptyDetailContainer>
                ) : null}
              </>
            )
          })
          .otherwise(() => `${subnameResults.length}`)}
      </div>
      <Footer />
    </TabWrapperWithButtons>
  )
}
