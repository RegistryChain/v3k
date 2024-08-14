import { useCallback, useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { match, P } from 'ts-pattern'
import { createPublicClient, http, type Address } from 'viem'

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
import { useQueryParameterState } from '@app/hooks/useQueryParameterState'
import { sepolia } from 'viem/chains'
import { infuraUrl } from '@app/utils/query/wagmi'
import { createEnsPublicClient } from '@ensdomains/ensjs'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useAccount } from 'wagmi'

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

type SubnameListViewProps = {

}

export const SubnameListView = ({}: SubnameListViewProps) => {
  const router = useRouterWithHistory()
  const { address } = useAccount()

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const [selectedNames, setSelectedNames] = useState<Name[]>([])
  const handleClickName = (name: Name) => () => {
        router.push("/profile/" + name.name)
  }

  const [sortType, setSortType] = useQueryParameterState<SortType>('sort', 'expiryDate')
  const [sortDirection, setSortDirection] = useQueryParameterState<SortDirection>(
    'direction',
    'asc',
  )
  const [searchQuery, setSearchQuery] = useQueryParameterState<string>('search', '')
  const [searchInput, setSearchInput] = useState(searchQuery)

  const [subnameResults, setSubnameResults] = useState<any[]>([])
  const [subnameResLoaded, setSubnameResLoaded] = useState<Boolean>(false)
  

  const client = useMemo(() => createEnsPublicClient({
    chain: sepolia,
    transport: http(infuraUrl('sepolia'))
  }), [])

  const getSubs = async () => {
    const results = await getSubnames(client, { name: 'publicregistry.eth', pageSize: 1000})
    setSubnameResults(results)
    setSubnameResLoaded(true)
  }

  useEffect(() => {
    getSubs()
  }, [client])


  const filteredSet = subnameResults.map(name =>  {
      const labelName = name.name.split(name.parentName).join("").split(".").join(".")
      const domainId = labelName.split("-").pop().split(".").join("")
      const commonName = labelName.split("-").slice(0,labelName.split("-").length -1).join(" ")
      return {...name, labelName, commonName, domainId}
  }).filter(name => name.parentName === "publicregistry.eth" && (name.labelName.includes(searchInput) || searchInput === ""))

  return (
    <TabWrapperWithButtons>
      <NameTableHeader
        mode={"view"}
        sortType={sortType}
        sortTypeOptionValues={['expiryDate', 'labelName', 'createdAt']}
        sortDirection={sortDirection}
        searchQuery={searchInput}
        selectedCount={selectedNames.length}
        onModeChange={(m) => {
          setSelectedNames([])
        }}
        onSortDirectionChange={setSortDirection}
        onSortTypeChange={setSortType}
        onSearchChange={(s) => {
          setSearchInput(s)
        }}
      >
      </NameTableHeader>
      <div data-testid="names-list">
        {match([isMounted, subnameResLoaded, filteredSet?.length, searchQuery])
          .with([false, P._, P._, P._], () => null)
          .with([true, false, 0, P._], () => (
            <EmptyDetailContainer>
              <Spinner color="accent" />
            </EmptyDetailContainer>
          ))
          .with([true, true, 0, P._], () => {
            return (
            <EmptyDetailContainer>No entities found.</EmptyDetailContainer>
          )
        })
          .with([true, true, filteredSet?.length, P._], () => {
            return (
                <InfiniteScrollContainer onIntersectingChange={() => null}>
                    <div>
                        {filteredSet.map((name) => {
                            return (
                                <TaggedNameItem
                                    isOwner={address === name.owner}
                                    name={name.commonName + ' [' + name.domainId + "]" || ""}
                                    key={name.id}
                                    mode={"view"}
                                    selected={false}
                                    disabled={false}
                                    onClick={handleClickName(name)}
                                />)
                        })}
                    </div>
                </InfiniteScrollContainer>
            )
            })
          .otherwise(() => `${subnameResults.length}`)}
      </div>
      <Footer />
    </TabWrapperWithButtons>
  )
}
