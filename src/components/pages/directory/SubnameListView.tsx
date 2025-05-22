import { useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { Address, getContract, http, namehash, parseAbi } from 'viem'
import { sepolia } from 'viem/chains'

import { createEnsPublicClient } from '@ensdomains/ensjs'
import { Name } from '@ensdomains/ensjs/subgraph'
import { mq, Spinner, Button } from '@ensdomains/thorin'

import { DirectoryTable } from '@app/components/@molecules/DirectoryTable/DirectoryTable'
import {
  NameTableHeader,
  SortDirection,
} from '@app/components/@molecules/NameTableHeader/NameTableHeader'
import { TabWrapper } from '@app/components/pages/profile/TabWrapper'
import { executeWriteToResolver, getEntitiesList } from '@app/hooks/useExecuteWriteToResolver'
import { infuraUrl } from '@app/utils/query/wagmi'

import contractAddresses from '../../../constants/contractAddresses.json'
import l1abi from '../../../constants/l1abi.json'

import { getWalletClient } from '@app/utils/utils'
import { useRouter } from 'next/router'

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

export const SubnameListView = ({ address }: any) => {
  const [selectedNames, setSelectedNames] = useState<Name[]>([])

  const [sortType, setSortType] = useState<any>('birthdate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [registrar, setRegistrarSelected] = useState<string>('ai')

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchInput, setSearchInput] = useState("")
  const [pageNumber, setPageNumber] = useState(0)
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false)
  const [finishedLoading, setFinishedLoading] = useState(false)
  const [connectedIsAdmin, setConnectedIsAdmin] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  const [subnameResults, setSubnameResults] = useState<any[]>([])

  const jurisList = ['ai']

  const publicClient: any = useMemo(
    () =>
      createEnsPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )

  const moderateEntity = async (entityDomain: string, operation: any) => {
    try {
      if (address && entityDomain) {
        const formationPrep = {
          functionName: 'moderateEntity',
          args: [
            namehash(entityDomain),
            operation
          ],
          abi: l1abi,
          address: contractAddresses['DatabaseResolver'],
        }

        await executeWriteToResolver(getWalletClient(address as Address), formationPrep, null)
        getSubs(pageNumber)
      }
    } catch (err) { }
  }

  const getSubs = async (page: number = pageNumber, resetResults = false) => {
    setIsLoadingNextPage(true)
    let status = {}
    let category = {}
    if (connectedIsAdmin) {
      if (selectedStatus === "true") {
        status = { "v3k__hidden": true }
      } else if (selectedStatus === "false") {
        status = { "v3k__hidden": false }
      }
    }
    if (selectedCategory) {
      category = { category: selectedCategory }
    }
    try {
      let searchBase = searchInput ? {} : { avatar: 'https' }
      const results = await getEntitiesList({
        registrar,
        nameSubstring: searchInput,
        page,
        sortDirection,
        sortType,
        address,
        params: { ...searchBase, ...status, ...category },
      })

      setSubnameResults(results)
      setFinishedLoading(true)
    } catch (err) {
      console.log(err)
    } finally {
      setIsLoadingNextPage(false)

    }
  }

  const checkConnectedAddressAdmin = async () => {

    const registrar: any = await getContract({
      client: publicClient,
      abi: [...parseAbi(['function REGISTRAR_ADMIN_ROLE() view returns (bytes32)', 'function hasRole(bytes32, address) view returns (bool)'])],
      address: contractAddresses["ai.entity.id"] as Address,
    })
    try {
      let roleHash = await registrar.read.REGISTRAR_ADMIN_ROLE()
      let isAdmin = await registrar.read.hasRole([roleHash, address])
      setConnectedIsAdmin(isAdmin)
    } catch (err: any) {
      console.log('ERROR GETTING CONNECTED WALLET ADMIN LEVEL: ', err.message)
    }
  }
  const router = useRouter()
  useEffect(() => {
    const search = typeof router.query.search === 'string' ? router.query.search : ''
    setSearchQuery(search)
    setSearchInput(search)
  }, [router.query.search])

  useEffect(() => {
    checkConnectedAddressAdmin()
  }, [address])

  useEffect(() => {
    if (pageNumber !== 0) {
      setFinishedLoading(false)
      getSubs(pageNumber)
    }
  }, [pageNumber])

  // Debounce effect: Wait 1 second after typing stops before calling API
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFinishedLoading(false)
      setPageNumber(0)
      getSubs(0, true)
    }, 600) // 1000ms = 1 second

    return () => clearTimeout(delayDebounceFn) // Cleanup previous timeout
  }, [searchInput, registrar, sortType, sortDirection, selectedStatus, selectedCategory])

  const filteredSet = useMemo(
    () => {
      return subnameResults.map((record) => {
        const labelName = record.name.split(record.parentName).join('').split('.').join('.')
        const domainId = labelName.split('-').pop().split('.').join('')
        const commonName = labelName
          .split('-')
          .slice(0, labelName.split('-').length - 1)
          .join(' ')

        return { ...record, labelName, commonName, domainId, isPlaceHolder: false }
      })
    },
    [subnameResults, pageNumber, searchInput, sortType, sortDirection, registrar],
  )

  return (
    <TabWrapperWithButtons>
      <NameTableHeader
        displaySearch={false}
        mode={'view'}
        sortType={sortType}
        sortTypeOptionValues={['birthdate', 'name']}
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
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        connectedIsAdmin={connectedIsAdmin}
      />
      {isLoadingNextPage ? <div style={{ display: 'flex', justifyContent: 'center', marginTop: "18px" }}>
        <Spinner color="accent" size="large" />
      </div> :
        <DirectoryTable
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          data={filteredSet}
          isLoadingNextPage={isLoadingNextPage}
          finishedLoading={finishedLoading}
          fetchData={getSubs}
          page={pageNumber}
          setPage={setPageNumber}
          connectedIsAdmin={connectedIsAdmin}
          moderateEntity={moderateEntity}
        />}
    </TabWrapperWithButtons>
  )
}
