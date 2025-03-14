import { useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { Address, getContract, http, namehash, parseAbi } from 'viem'
import { sepolia } from 'viem/chains'

import { createEnsPublicClient } from '@ensdomains/ensjs'
import { Name } from '@ensdomains/ensjs/subgraph'

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

  const [sortType, setSortType] = useState<any>('entity__formation__date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [registrar, setRegistrarSelected] = useState<string>('ai')

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchInput, setSearchInput] = useState(searchQuery)
  const [pageNumber, setPageNumber] = useState(0)
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false)
  const [finishedLoading, setFinishedLoading] = useState(false)
  const [connectedIsAdmin, setConnectedIsAdmin] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")

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
    if (connectedIsAdmin) {
      if (selectedStatus === "true") {
        status = { hidden: true }
      } else if (selectedStatus === "false") {
        status = { hidden: false }
      }
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
        params: { ...searchBase, ...status },
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

  useEffect(() => {
    checkConnectedAddressAdmin()
  }, [address])

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
  }, [searchInput, registrar, sortType, sortDirection, selectedStatus])

  const filteredSet = useMemo(
    () =>
      subnameResults.map((record) => {
        const labelName = record.name.split(record.parentName).join('').split('.').join('.')
        const domainId = labelName.split('-').pop().split('.').join('')
        const commonName = labelName
          .split('-')
          .slice(0, labelName.split('-').length - 1)
          .join(' ')

        return { ...record, labelName, commonName, domainId, isPlaceHolder: false }
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
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        connectedIsAdmin={connectedIsAdmin}
      />
      <DirectoryTable
        sortDirection={sortDirection}
        onSortDirectionChange={setSortDirection}
        data={filteredSet}
        isLoadingNextPage={isLoadingNextPage}
        fetchData={getSubs}
        page={pageNumber}
        setPage={setPageNumber}
        connectedIsAdmin={connectedIsAdmin}
        moderateEntity={moderateEntity}
      />
    </TabWrapperWithButtons>
  )
}
