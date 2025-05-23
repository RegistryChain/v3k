import { QueryClient, useQueryClient } from '@tanstack/react-query'
import {
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import useTransition, { TransitionState } from 'react-transition-state'
import styled, { css } from 'styled-components'
import { Address, isAddress, namehash } from 'viem'
import { useAccount, useChainId } from 'wagmi'

import {
  GetExpiryReturnType,
  GetPriceReturnType,
  GetWrapperDataReturnType,
} from '@ensdomains/ensjs/public'
import {
  BackdropSurface,
  Input,
  MagnifyingGlassSimpleSVG,
  mq,
  Portal,
  Typography,
} from '@ensdomains/thorin'

import { SupportedChain } from '@app/constants/chains'
import {
  UseDotBoxAvailabilityOnchainQueryKey,
  UseDotBoxAvailabilityOnchainReturnType,
} from '@app/hooks/dotbox/useDotBoxAvailabilityOnchain'
import {
  UseAddressRecordQueryKey,
  UseAddressRecordReturnType,
} from '@app/hooks/ensjs/public/useAddressRecord'
import { UseExpiryQueryKey } from '@app/hooks/ensjs/public/useExpiry'
import { UseOwnerQueryKey, UseOwnerReturnType } from '@app/hooks/ensjs/public/useOwner'
import { UsePriceQueryKey } from '@app/hooks/ensjs/public/usePrice'
import { UseWrapperDataQueryKey } from '@app/hooks/ensjs/public/useWrapperData'
import { useLocalStorage } from '@app/hooks/useLocalStorage'
import { createQueryKey } from '@app/hooks/useQueryOptions'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useValidate, validate } from '@app/hooks/useValidate'
import { useElementSize } from '@app/hooks/useWindowSize'
import { CreateQueryKey, GenericQueryKey } from '@app/types'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { getRegistrationStatus } from '@app/utils/registrationStatus'
import { thread, yearsToSeconds } from '@app/utils/utils'

import { getBoxNameStatus, SearchResult } from './SearchResult'
import { HistoryItem, SearchHandler, SearchItem } from './types'
import { useWallets } from '@privy-io/react-auth'

const Container = styled.div<{ $size: 'medium' | 'extraLarge' }>(
  ({ $size }) => css`
    width: 100%;
    position: relative;
    ${$size === 'extraLarge' &&
    mq.sm.min(css`
      padding-left: 48px;
      padding-right: 48px;
    `)}
  `,
)

const SearchResultsContainer = styled.div<{
  $state: TransitionState
}>(
  ({ theme, $state }) => css`
    position: absolute;
    width: 100%;
    height: min-content;
    top: calc(100% + ${theme.space['3']});

    background-color: #f7f7f7;
    box-shadow: 0 2px 12px ${theme.colors.border};
    border-radius: ${theme.radii.extraLarge};
    border: ${theme.borderWidths.px} ${theme.borderStyles.solid} ${theme.colors.border};
    &[data-error='true'] {
      border-color: ${theme.colors.red};
    }

    overflow: hidden;

    opacity: 0;
    z-index: 1000;
    transform: translateY(-${theme.space['2']});
    transition:
      0.35s all cubic-bezier(1, 0, 0.22, 1.6),
      0s border-color linear 0s,
      0s width linear 0s;

    ${$state === 'entered'
      ? css`
          opacity: 1;
          transform: translateY(0px);
        `
      : css`
          & > div {
            cursor: default;
          }
        `}
  `,
)

const createCachedQueryDataGetter =
  ({
    queryClient,
    chainId,
    address,
  }: {
    queryClient: QueryClient
    chainId: SupportedChain['id']
    address: Address | undefined
  }) =>
    <TData, TQueryKey extends GenericQueryKey<'standard'>>({
      functionName,
      params,
    }: {
      functionName: TQueryKey[4]
      params: TQueryKey[0]
    }) => {
      return queryClient.getQueryData<
        TData,
        CreateQueryKey<typeof params, typeof functionName, 'standard'>
      >(
        createQueryKey({
          address,
          chainId,
          functionName,
          queryDependencyType: 'standard',
          params,
        }),
      )
    }

const getRouteForSearchItem = ({
  address,
  chainId,
  queryClient,
  selectedItem,
}: {
  address: Address | undefined
  chainId: SupportedChain['id']
  queryClient: QueryClient
  selectedItem: Exclude<SearchItem, { nameType: 'error' } | { nameType: 'text' }>
}) => {
  if (selectedItem.nameType === 'address') return `/address/${selectedItem.text}`

  const getCachedQueryData = createCachedQueryDataGetter({ queryClient, chainId, address })
  if (selectedItem.nameType === 'box') {
    const isAvailableOnchain = getCachedQueryData<
      UseDotBoxAvailabilityOnchainReturnType,
      UseDotBoxAvailabilityOnchainQueryKey
    >({
      functionName: 'getDotBoxAvailabilityOnchain',
      params: { name: selectedItem.text, isValid: selectedItem.isValid },
    })
    const boxStatus = getBoxNameStatus({
      isValid: selectedItem.isValid,
      isAvailable: isAvailableOnchain,
    })
    if (boxStatus === 'available') return `/dotbox/${selectedItem.text}`
  }

  if (
    selectedItem.nameType === 'eth' ||
    selectedItem.nameType === 'dns' ||
    selectedItem.nameType === 'registry'
  ) {
    const ownerData = getCachedQueryData<UseOwnerReturnType, UseOwnerQueryKey>({
      functionName: 'getOwner',
      params: { name: selectedItem.text },
    })
    const wrapperData = getCachedQueryData<GetWrapperDataReturnType, UseWrapperDataQueryKey>({
      functionName: 'getWrapperData',
      params: { name: selectedItem.text },
    })
    const expiryData = getCachedQueryData<GetExpiryReturnType, UseExpiryQueryKey>({
      functionName: 'getExpiry',
      params: { name: selectedItem.text },
    })
    const priceData = getCachedQueryData<GetPriceReturnType, UsePriceQueryKey>({
      functionName: 'getPrice',
      params: { nameOrNames: selectedItem.text, duration: yearsToSeconds(1) },
    })
    const addrData = getCachedQueryData<UseAddressRecordReturnType, UseAddressRecordQueryKey>({
      functionName: 'getAddressRecord',
      params: { name: selectedItem.text },
    })

    if (typeof ownerData !== 'undefined') {
      const registrationStatus = getRegistrationStatus({
        timestamp: Date.now(),
        validation: validate(selectedItem.text),
        ownerData,
        wrapperData,
        expiryData,
        priceData,
        addrData,
        supportedTLD: true,
      })
      if (registrationStatus === 'available') return `/register/${selectedItem.text}`
      if (registrationStatus === 'notImported') return `/import/${selectedItem.text}`
    }
  }

  return `/profile/${selectedItem.text}`
}

type CreateSearchHandlerProps = {
  address: Address | undefined
  chainId: any
  dropdownItems: SearchItem[]
  router: ReturnType<typeof useRouterWithHistory>
  searchInputRef: RefObject<HTMLInputElement>
  setHistory: Dispatch<SetStateAction<HistoryItem[]>>
  setInputVal: Dispatch<SetStateAction<string>>
  queryClient: QueryClient
}

const createSearchHandler =
  ({
    address,
    chainId,
    dropdownItems,
    router,
    searchInputRef,
    setHistory,
    setInputVal,
    queryClient,
  }: CreateSearchHandlerProps): SearchHandler =>
    (index: number) => {
      if (index === -1) return
      const selectedItem = dropdownItems[index]
      if (!selectedItem?.text) return
      const { text, nameType } = selectedItem
      if (nameType === 'error' || nameType === 'text') return

      setHistory((prev: HistoryItem[]) => [
        ...prev.filter((item) => !(item.text === text && item.nameType === nameType)),
        { lastAccessed: Date.now(), nameType, text, isValid: selectedItem.isValid },
      ])

      const path = getRouteForSearchItem({ address, chainId, queryClient, selectedItem })
      setInputVal('')
      searchInputRef.current?.blur()
      router.pushWithHistory(path)
    }

type UseAddEventListenersProps = {
  searchInputRef: RefObject<HTMLInputElement>
  handleKeyDown: (e: KeyboardEvent) => void
  handleFocusIn: (e: FocusEvent) => void
  handleFocusOut: (e: FocusEvent) => void
}

const useAddEventListeners = ({
  searchInputRef,
  handleKeyDown,
  handleFocusIn,
  handleFocusOut,
}: UseAddEventListenersProps) => {
  useEffect(() => {
    const searchInput = searchInputRef.current
    if (searchInput) {
      searchInput?.addEventListener('keydown', handleKeyDown)
      searchInput?.addEventListener('focusin', handleFocusIn)
      searchInput?.addEventListener('focusout', handleFocusOut)
      return () => {
        searchInput?.removeEventListener('keydown', handleKeyDown)
        searchInput?.removeEventListener('focusin', handleFocusIn)
        searchInput?.removeEventListener('focusout', handleFocusOut)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleFocusIn, handleFocusOut, handleKeyDown, searchInputRef.current])
}

type HandleKeyDownProps = {
  dropdownItems: SearchItem[]
  handleSearch: SearchHandler
  selected: number
  setSelected: Dispatch<SetStateAction<number>>
}

const handleKeyDown =
  ({ dropdownItems, handleSearch, selected, setSelected }: HandleKeyDownProps) =>
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch(selected)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((prev: number) => (prev - 1 + dropdownItems.length) % dropdownItems.length)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((prev: number) => (prev + 1) % dropdownItems.length)
      }
    }

const useSelectionManager = ({
  inputVal,
  setSelected,
  state,
}: {
  inputVal: string
  setSelected: Dispatch<SetStateAction<number>>
  state: TransitionState
}) => {
  useEffect(() => {
    if (inputVal === '') {
      setSelected(-1)
    } else {
      setSelected(0)
    }
  }, [inputVal, setSelected])

  useEffect(() => {
    if (state === 'unmounted') {
      setSelected(-1)
    }
  }, [state, setSelected])
}

export const RegistrarInput = ({
  size = 'extraLarge',
  field,
  entityTypes,
  value,
  setValue,
  permittedJurisdictions,
}: any) => {
  const router = useRouterWithHistory()
  const queryClient = useQueryClient()
  const breakpoints = useBreakpoint()
  const { wallets } = useWallets();      // Privy hook
  const address = useMemo(() => wallets[0]?.address, [wallets]) as Address
  const chainId: any = useChainId()

  const [project, setProject] = useState('REGISTRYCHAIN')
  const [inputVal, setInputVal] = useState('')

  const [state, toggle] = useTransition({
    enter: true,
    exit: true,
    preEnter: true,
    preExit: true,
    mountOnEnter: true,
    unmountOnExit: true,
    timeout: {
      enter: 0,
      exit: 350,
    },
  })

  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchInputContainerRef = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(searchInputContainerRef.current)

  const [selected, setSelected] = useState(0)
  const [usingPlaceholder, setUsingPlaceholder] = useState(false)

  const [history, setHistory] = useLocalStorage<HistoryItem[]>('search-history-v2', [])
  // const [registrarList, setRegistrarList] = useState<HistoryItem[]>([{ lastAccessed: Date.now(), nameType: "eth", text: "publicregistry.eth"}])

  const handleFocusIn = useCallback(() => toggle(true), [toggle])
  const handleFocusOut = useCallback(() => toggle(false), [toggle])

  const dropdownItems: any = [{ isHistory: '', text: '', nameType: '' }]

  const [countries, setCountries]: any = useState([])

  const uniqueCountries = useMemo(() => {
    const uniques: any[] = []
    const filteredEntityTypes = entityTypes
    filteredEntityTypes.forEach((x: any) => {
      if (
        !uniques.find((u: any) => {
          const uJuris = u?.formationJurisdiction
            ? u?.formationJurisdiction + ' ' + u.formationCountry
            : u.formationCountry
          const xJuris = x?.formationJurisdiction
            ? x?.formationJurisdiction + ' ' + x.formationCountry
            : x.formationCountry
          return uJuris === xJuris
        })
      ) {
        uniques.push(x)
      }
    })
    return uniques
  }, [entityTypes])

  useEffect(() => {
    const validCountries: any[] = []
    const inputUpper = inputVal.toUpperCase()

    if (inputUpper?.length > 0) {
      const publicJuris: any = uniqueCountries.find((x) => x.countryJurisdictionCode === 'public')
      if (publicJuris) {
        validCountries.push(publicJuris)
      }
      for (let i = 0; i < uniqueCountries.length; i++) {
        const uJuris = uniqueCountries[i]?.formationJurisdiction
          ? uniqueCountries[i]?.formationJurisdiction + ' ' + uniqueCountries[i].formationCountry
          : uniqueCountries[i].formationCountry
        const countryUppercase = uJuris.toUpperCase()
        if (validCountries.length >= 5) break
        const inValidCountries = validCountries.find((x) => {
          const xJuris = x?.formationJurisdiction
            ? x?.formationJurisdiction + ' ' + x.formationCountry
            : x.formationCountry
          return xJuris.toUpperCase() === countryUppercase
        })
        if (
          countryUppercase.includes(inputUpper) &&
          inputUpper !== value.toUpperCase() &&
          !inValidCountries
        ) {
          validCountries.push(uniqueCountries[i])
        }
      }
      setCountries(validCountries)
    }
  }, [inputVal])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(
    createSearchHandler({
      address,
      chainId,
      dropdownItems,
      queryClient,
      router,
      searchInputRef,
      setHistory,
      setInputVal,
    }),
    [address, chainId, dropdownItems, queryClient, router, searchInputRef, setHistory, setInputVal],
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleKeyDownCb = useCallback(
    handleKeyDown({ dropdownItems, handleSearch, selected, setSelected }),
    [handleSearch, setSelected, dropdownItems.length, selected],
  )

  useAddEventListeners({
    searchInputRef,
    handleKeyDown: handleKeyDownCb,
    handleFocusIn,
    handleFocusOut,
  })

  useSelectionManager({ inputVal, setSelected, state })

  const [showNamesState, setShowNamesState] = useState<Boolean>(false)
  const SearchResultsElement = (
    <SearchResultsContainer
      style={{
        width: width === Infinity ? undefined : width,
      }}
      // onMouseLeave={() => inputVal === '' && setSelected(-1)}
      $state={state}
      data-testid="search-input-results"
    >
      {dropdownItems.map((searchItem: any, index: any) => (
        <SearchResult
          clickCallback={handleSearch}
          hoverCallback={setSelected}
          index={index}
          selected={index === selected}
          searchItem={searchItem}
          key={
            searchItem.isHistory
              ? `${searchItem.nameType}-${searchItem.text}`
              : `${searchItem.nameType}`
          }
          usingPlaceholder={searchItem.isHistory ? false : usingPlaceholder}
        />
      ))}
    </SearchResultsContainer>
  )

  return (
    <Container data-testid="search-input-desktop" $size={size}>
      <Input
        data-testid="name-table-header-search"
        size="medium"
        label="search"
        value={inputVal}
        onFocus={() => {
          setShowNamesState(true)
        }}
        onChange={(e) => {
          setInputVal(e.target.value)
          setShowNamesState(true)
        }}
        hideLabel
        icon={<MagnifyingGlassSimpleSVG />}
        placeholder={field}
      />
      <div
        style={{
          position: 'absolute',
          zIndex: 1000,
          width: '100%',
          paddingLeft: '2px',
          paddingRight: breakpoints.md ? '100px' : '0px',
          cursor: 'pointer',
          borderRadius: '8px',
        }}
      >
        {countries?.length > 0 && showNamesState && inputVal !== value ? (
          <div>
            {countries.map((x: any, idx: any) => {
              const style = { color: '#3888FF', paddingLeft: '20px' }
              const xJuris = x?.formationJurisdiction
                ? x.formationJurisdiction + ' - ' + x.formationCountry
                : x.formationCountry

              const permittedJurisCondition =
                !permittedJurisdictions.includes(x.countryJurisdictionCode?.toLowerCase()) &&
                permittedJurisdictions.length !== 0

              return (
                <div
                  style={{
                    ...style,
                    // cursor: !permittedJurisdictions.includes(x.countryJurisdictionCode?.toLowerCase()) ? 'not-allowed' : 'pointer',
                    backgroundColor: permittedJurisCondition ? '#ebe5e5' : 'white',
                    color: permittedJurisCondition ? 'rgb(41 116 229)' : '#3888FF',
                    paddingBottom: idx === countries.length - 1 ? '8px' : '0px',
                    borderBottomLeftRadius: idx === countries.length - 1 ? '8px' : '0px',
                    borderBottomRightRadius: idx === countries.length - 1 ? '8px' : '0px',
                    width: '100%',
                    height: '50px',
                    paddingTop: '12px',
                    fontSize: '18px',
                  }}
                  onClick={() => {
                    const code = x.countryJurisdictionCode
                      ? x.countryJurisdictionCode
                      : x.countryCode
                    // if (code !== 'public') return null
                    setValue(code)
                    setInputVal(xJuris)
                    setShowNamesState(false)
                  }}
                >
                  <span>{xJuris}</span>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </Container>
  )
}
