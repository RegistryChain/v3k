import { useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { http } from 'viem'
import { sepolia } from 'viem/chains'

import { createEnsPublicClient } from '@ensdomains/ensjs'
import { Name } from '@ensdomains/ensjs/subgraph'

import { DirectoryTable } from '@app/components/@molecules/DirectoryTable/DirectoryTable'
import {
  NameTableHeader,
  SortDirection,
} from '@app/components/@molecules/NameTableHeader/NameTableHeader'
import { TabWrapper } from '@app/components/pages/profile/TabWrapper'
import { getEntitiesList } from '@app/hooks/useExecuteWriteToResolver'
import { infuraUrl } from '@app/utils/query/wagmi'

import entityTypesObj from '../../../constants/entityTypes.json'
import { TilesView } from '@app/components/TilesView/TilesView'

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

export const SubnameListView = () => {
  const [selectedNames, setSelectedNames] = useState<Name[]>([])

  const [sortType, setSortType] = useState<any>('entity__formation__date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [registrar, setRegistrarSelected] = useState<string>('AI')

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchInput, setSearchInput] = useState(searchQuery)
  const [pageNumber, setPageNumber] = useState(0)
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false)
  const [finishedLoading, setFinishedLoading] = useState(false)

  const [subnameResults, setSubnameResults] = useState<any[]>([])

  const jurisList = useMemo(() => {
    // const list = {}
    // entityTypesObj.forEach((x) => {
    //   list[x.countryJurisdictionCode] = true
    // })
    // return Object.keys(list)
    return ['AI']
  }, [entityTypesObj])

  const client: any = useMemo(
    () =>
      createEnsPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )

  const getSubs = async (page: number = pageNumber, resetResults = false) => {
    setIsLoadingNextPage(true)
    try {
      const results = await getEntitiesList({
        registrar,
        nameSubstring: searchInput,
        page,
        sortDirection,
        sortType,
      })

      setSubnameResults((prevResults) => (resetResults ? results : [...prevResults, ...results]))
      if (results.length !== 25) {
        setFinishedLoading(true)
      }
    } catch (err) {
      console.log(err)
    } finally {
      setIsLoadingNextPage(false)
    }
  }

  useEffect(() => {
    if (pageNumber !== 0) {
      getSubs(pageNumber)
    }
  }, [pageNumber])

  // Debounce effect: Wait 1 second after typing stops before calling API
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPageNumber(0)
      getSubs(0, true)
    }, 1000) // 1000ms = 1 second

    return () => clearTimeout(delayDebounceFn) // Cleanup previous timeout
  }, [searchInput, registrar, sortType, sortDirection])

  const filteredSet = useMemo(
    () =>
      subnameResults.map((record) => {
        const labelName = record.name.split(record.parentName).join('').split('.').join('.')
        const domainId = labelName.split('-').pop().split('.').join('')
        const commonName = labelName
          .split('-')
          .slice(0, labelName.split('-').length - 1)
          .join(' ')
        return { ...record, labelName, commonName, domainId }
      }),
    [subnameResults, pageNumber, searchInput, sortType, sortDirection, registrar],
  )

  return (
    <TabWrapperWithButtons>
      <NameTableHeader
        mode={'view'}
        sortType={sortType}
        sortTypeOptionValues={['entity__formation__date', 'name']}
        sortDirection={sortDirection}
        registrar={registrar}
        registrarOptionValues={jurisList}
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
      />

      <TilesView
        data={filteredSet}
        isLoadingNextPage={isLoadingNextPage}
        fetchData={getSubs}
        page={pageNumber}
        setPage={setPageNumber}
      />
    </TabWrapperWithButtons>
  )
}
