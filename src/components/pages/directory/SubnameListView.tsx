import { useEffect, useMemo, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import { Address, getContract, http, isAddressEqual, namehash, parseAbi } from 'viem'
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
import { executeWriteToResolver, logFrontendError } from '@app/hooks/useExecuteWriteToResolver'
import { DirectorySource, getDirectoryEntities } from '@app/utils/directoryGateway'
import { infuraUrl } from '@app/utils/query/wagmi'

import contractAddresses from '../../../constants/contractAddresses.json'
import l1abi from '../../../constants/l1abi.json'

import { getPrivyWalletClient } from '@app/utils/utils'
import { useRouter } from 'next/router'
import { useWallets } from '@privy-io/react-auth'

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

  const [sortType, setSortType] = useState<any>('_id')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [source, setSource] = useState<DirectorySource>('all')
  const [withImagesOnly, setWithImagesOnly] = useState(false)

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [searchInput, setSearchInput] = useState("")
  const [pageNumber, setPageNumber] = useState(0)
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false)
  const [finishedLoading, setFinishedLoading] = useState(false)
  const [connectedIsAdmin, setConnectedIsAdmin] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")

  const [subnameResults, setSubnameResults] = useState<any[]>([])
  const [loadError, setLoadError] = useState('')
  const requestId = useRef(0)

  const { wallets } = useWallets();      // Privy hook

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
          args: [namehash(entityDomain), operation],
          abi: l1abi,
          address: contractAddresses['DatabaseResolver'],
        }
        const wallet = await getPrivyWalletClient(wallets.find(w => w.walletClientType === 'embedded') || wallets[0])
        await executeWriteToResolver(wallet, formationPrep, null)
        getSubs(pageNumber)
      }
    } catch (err) {
      logFrontendError({
        error: err,
        message: '1 - Failed to moderate entity in SubnameListView',
        functionName: 'moderateEntity',
        address,
        args: { entityDomain, operation, resolver: contractAddresses['DatabaseResolver'] },
      })
    }
  }

  const getSubs = async (page: number = pageNumber, resetResults = false) => {
    const currentRequest = ++requestId.current
    setIsLoadingNextPage(true)
    setLoadError('')
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
      const results = await getDirectoryEntities({
        source,
        withImagesOnly,
        nameSubstring: searchInput,
        page,
        sortDirection,
        sortType,
        address,
        params: { ...status, ...category },
      })

      if (currentRequest === requestId.current) {
        setSubnameResults(results)
        setFinishedLoading(true)
      }
    } catch (err) {
      if (currentRequest === requestId.current) {
        setLoadError('We couldn’t load the agents. Please try again.')
        setSubnameResults([])
        setFinishedLoading(true)
      }
    } finally {
      if (currentRequest === requestId.current) setIsLoadingNextPage(false)
    }
  }

  const checkConnectedAddressAdmin = async () => {
    try {
      // const registrar: any = await getContract({
      //   client: publicClient,
      //   abi: parseAbi([
      //     'function REGISTRAR_ADMIN_ROLE() view returns (bytes32)',
      //     'function hasRole(bytes32, address) view returns (bool)',
      //   ]),
      //   address: contractAddresses["ai.entity.id"] as Address,
      // })
      // const roleHash = await registrar.read.REGISTRAR_ADMIN_ROLE()
      // const isAdmin = await registrar.read.hasRole([roleHash, address])
      if (address) {
        const isAdmin = isAddressEqual(address, "0x1CA2b10c61D0d92f2096209385c6cB33E3691b5E") || isAddressEqual(address, "0xd873FaFd02351e6474906CD9233B454117b834DF") || isAddressEqual(address, "0x3Af9EB97d58212f0CF88B43Cf6f78434FEbbFCec") || isAddressEqual(address, "0xA72Ab9C4B2828aC2CB6c9C617D3e81BFEe23C0b6") || isAddressEqual(address, "0x761662d41f60A48Cf94af6f9e626D36963493767")

        setConnectedIsAdmin(isAdmin)
      }
    } catch (err: any) {
      logFrontendError({
        error: err,
        message: '3 - Failed to verify admin role in SubnameListView',
        functionName: 'checkConnectedAddressAdmin',
        address,
        args: [],
      })
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
    const nextSource = router.query.source
    setSource(nextSource === 'erc8004' || nextSource === 'other' ? nextSource : 'all')
  }, [router.query.source])

  useEffect(() => {
    setWithImagesOnly(router.query.images === 'with')
  }, [router.query.images])

  const changeSource = (nextSource: DirectorySource) => {
    setSource(nextSource)
    router.replace({ pathname: router.pathname, query: { ...router.query, source: nextSource } }, undefined, { shallow: true })
  }

  const changeImagesFilter = (withImages: boolean) => {
    setWithImagesOnly(withImages)
    router.replace({ pathname: router.pathname, query: { ...router.query, images: withImages ? 'with' : 'all' } }, undefined, { shallow: true })
  }

  useEffect(() => {
    checkConnectedAddressAdmin()
  }, [address])

  // Debounce effect: Wait 1 second after typing stops before calling API
  useEffect(() => {
    ++requestId.current
    setIsLoadingNextPage(true)
    const delayDebounceFn = setTimeout(() => {
      setFinishedLoading(false)
      setPageNumber(0)
      getSubs(0, true)
    }, 600) // 1000ms = 1 second

    return () => clearTimeout(delayDebounceFn) // Cleanup previous timeout
  }, [searchInput, source, withImagesOnly, sortType, sortDirection, selectedStatus, selectedCategory, connectedIsAdmin, address])


  return (
    <TabWrapperWithButtons>
      <div style={{ padding: '16px 18px 0' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: 700, lineHeight: 1.2 }}>AI agent directory</h1>
        <p style={{ margin: '0 0 12px', color: '#666' }}>Browse AI entities indexed by Entity.ID, including ERC-8004 agents. Newest additions appear first.</p>
      </div>
      <NameTableHeader
        displaySearch={false}
        mode={'view'}
        sortType={sortType}
        sortTypeOptionValues={['birthdate', 'name']}
        sortDirection={sortDirection}
        agentSource={source}
        onAgentSourceChange={changeSource}
        withImagesOnly={withImagesOnly}
        onImagesFilterChange={changeImagesFilter}
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
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        connectedIsAdmin={connectedIsAdmin}
      />
      {isLoadingNextPage && <div style={{ display: 'flex', justifyContent: 'center', marginTop: "18px" }}>
        <Spinner color="accent" size="large" />
      </div>}
      {!isLoadingNextPage && loadError && (
        <div role="alert" style={{ padding: '24px', textAlign: 'center' }}>
          <p>{loadError}</p>
          <Button onClick={() => getSubs(pageNumber)}>Try again</Button>
        </div>
      )}
      {!isLoadingNextPage && !loadError &&
        <DirectoryTable
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          data={subnameResults}
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
