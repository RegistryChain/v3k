import Image from 'next/image'
import { useRouter } from 'next/router'
import { ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import useTransition, { TransitionState } from 'react-transition-state'
import styled, { css, useTheme } from 'styled-components'
import { useAccount } from 'wagmi'

import { Input, MagnifyingGlassSimpleSVG, mq } from '@ensdomains/thorin'

import { useRecentTransactions } from '@app/hooks/transactions/useRecentTransactions'
import { useInitial } from '@app/hooks/useInitial'
import { ModalContext } from '@app/layouts/Basic'
import { legacyFavouritesRoute, routes } from '@app/routes'
import { useBreakpoint } from '@app/utils/BreakpointProvider'

import v3kLogo from '../assets/v3k_logo.png'
import { RouteItem } from './@atoms/RouteItem/RouteItem'
import { HeaderConnect } from './ConnectButton'
import { getEntitiesList } from '@app/hooks/useExecuteWriteToResolver'


// 👇 Result dropdown styles
const SearchResultsDropdown = styled.ul`
  position: absolute;
  top: 48px; /* Adjust depending on your Input height */
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  z-index: 1000;
  max-height: 220px;
  padding: 0;
  margin: 4px 0 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  list-style: none;
`;

const SearchResultItem = styled.li`
  padding: 10px 14px;
  cursor: pointer;
  &:hover {
    background-color: #f4f4f4;
  }
`;

const HeaderWrapper = styled.header(
  ({ theme }) => css`
    --padding-size: ${theme.space['4']};
    padding: var(--padding-size);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    position: sticky;
    top: 0;
  z-index: 9999;
    background-color: white;
    ${mq.md.max(css`
      display: none;
    `)}
  `,
)

const LogoAnchor = styled.a(
  () => css`
    cursor: pointer;
    transition: all 0.15s ease-in-out;

    & > svg {
      vertical-align: bottom;
    }

    &:hover {
      filter: brightness(1.05);
      transform: translateY(-1px);
    }
  `,
)

const NavContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-gap: ${theme.space['3']};
    gap: ${theme.space['3']};
    height: ${theme.space['12']};

    ${mq.lg.min(css`
      flex-gap: ${theme.space['2']};
      gap: ${theme.space['2']};
    `)}
  `,
)

const RouteContainer = styled.div<{ $state: TransitionState }>(
  ({ theme, $state }) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    flex-gap: ${theme.space['1']};
    gap: ${theme.space['1']};
    transition:
      transform 0.15s ease-in-out,
      opacity 0.15s ease-in-out;
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    transform: translateX(125%);
    opacity: 0;

    ${mq.lg.min(css`
      flex-gap: ${theme.space['6']};
      gap: ${theme.space['6']};
      position: relative;
    `)}

    ${$state === 'entered' &&
    css`
      transform: translateX(0%);
      opacity: 1;
    `}
  `,
)

const RouteWrapper = styled.div(
  () => css`
    position: relative;
    display: flex;
  `,
)

// 👇 Wrap the input and result dropdown
const SearchWrapper = styled.div`
  position: relative;
  width: 280px;
  margin: 0 18px;
  ${mq.xl.min(css`
    width: 350px;
  `)}
`;

const AddAgentButton = styled.button(
  ({ theme }) => css`
    font-weight: 700;
    min-width: 120px;
    border: none;
    border-radius: ${theme.radii.full};
    font-size: ${theme.fontSizes.body};
    cursor: pointer;
    transition: all 0.1s ease-in;

    &:hover {
      color: ${theme.colors.accent};
    }
    `
)

const HeaderTitleText = styled.span`
  font-weight: 400;
  margin-top: 10px;
  font-size: 20px; 
  ${mq.lg.min(css`
    font-size: 26px; 
  `)}
  ${mq.xl.min(css`
    font-size: 32px; 
  `)}`


const MobileHeaderWrapper = styled.div`

    display: flex;
    align-items: center;
    padding: 12px 16px;
    background-color: white;
    border-bottom: 1px solid #eee;
    position: sticky;
    top: 0;
    z-index: 9999;
  
`

const MobileLogoText = styled.span`
  font-size: 28px;
  font-weight: 600;
  margin-left: 12px;
  
`

const routesNoSearch = routes.filter(
  (route) => route.name !== 'search' && route.icon && !route.onlyDropdown && !route.disabled,
)

export const Header = () => {
  const { space } = useTheme()
  const router = useRouter()
  const isInitial = useInitial()
  const { isConnected } = useAccount()
  const breakpoints = useBreakpoint()
  const transactions = useRecentTransactions()
  const pendingTransactions = transactions.filter((x) => x.status === 'pending')
  const { setIsAgentModalOpen, setAgentModalPrepopulate } = useContext<any>(ModalContext)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const searchWrapperRef = useRef<HTMLDivElement>(null)
  const routeContainerRef = useRef<HTMLDivElement>(null)

  const [state, toggle] = useTransition({
    timeout: {
      enter: 0,
      exit: 0,
    },
    mountOnEnter: true,
    unmountOnExit: true,
    initialEntered: true,
  })

  const getAgents = async () => {
    const results = await getEntitiesList({
      registrar: 'ai',
      nameSubstring: searchQuery,
      limit: 5
    })
    setSearchResults(results)
  }

  useEffect(() => {
    // Debounce effect: Wait 1 second after typing stops before calling API
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 0)
        getAgents()
    }, 500) // 1000ms = 1 second

    return () => clearTimeout(delayDebounceFn) // Cleanup previous timeout
  }, [searchQuery])

  let RouteItems: ReactNode

  let routesNoSearchWithFavourites = routesNoSearch

  if (globalThis?.localStorage?.getItem('ensFavourites')) {
    routesNoSearchWithFavourites = [...routesNoSearchWithFavourites, legacyFavouritesRoute]
  }

  if (!isInitial) {
    RouteItems = routesNoSearchWithFavourites.map((route) => (
      <RouteItem
        key={route.name}
        route={route}
        asText={breakpoints.lg}
        hasNotification={route.name === 'settings' && pendingTransactions.length > 0}
      />
    ))
  }

  const toggleRoutesShowing = useCallback(
    (evt: FocusEvent) => {
      if (evt.type === 'focusout') {
        toggle(true)
      } else {
        toggle(false)
      }
    },
    [toggle],
  )

  useEffect(() => {
    const searchWrapper = searchWrapperRef.current
    if (searchWrapper) {
      searchWrapper?.addEventListener('focusin', toggleRoutesShowing, false)
      searchWrapper?.addEventListener('focusout', toggleRoutesShowing, false)
    }
    return () => {
      searchWrapper?.removeEventListener('focusin', toggleRoutesShowing, false)
      searchWrapper?.addEventListener('focusout', toggleRoutesShowing, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchWrapperRef.current])
  return (<>
    {breakpoints.xs && !breakpoints.md ? <MobileHeaderWrapper onClick={() => router.push('/')}>
      <Image alt="V3K" width={70} height={70} src={v3kLogo} />
      <MobileLogoText>AGENT STORE</MobileLogoText>
    </MobileHeaderWrapper> : null}

    <HeaderWrapper id="header">
      <NavContainer>

        <div
          style={{ fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex' }}
          onClick={() => router.push('/')}
        >
          <div style={{ maxHeight: "70px" }}>
            <Image alt="" width={70} height={70} src={v3kLogo} />
          </div>
          {breakpoints.md && !breakpoints.lg ? null : <HeaderTitleText>
            AGENT STORE
          </HeaderTitleText>}

        </div>
        <div style={{ flexGrow: 1 }} />
        <RouteWrapper>
          {breakpoints.lg ? <SearchWrapper>
            <Input
              style={{ width: "100%" }}
              data-testid="name-table-header-search"
              size="medium"
              label="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  router.push('/directory?search=' + searchQuery)
                }
              }}
              hideLabel
              onClickAction={() => router.push('/directory?search=' + searchQuery)}
              actionIcon={<MagnifyingGlassSimpleSVG />}
              placeholder={"search"}
            />
            {searchResults.length > 0 && (
              <SearchResultsDropdown>
                {searchResults.slice(0, 5).map((result: any, index: any) => (
                  <SearchResultItem
                    key={index}
                    onClick={() => {
                      window.location.href = "/agent/" + result.entityid
                    }}
                  >
                    {result.name}
                  </SearchResultItem>
                ))}
              </SearchResultsDropdown>
            )}
          </SearchWrapper> : null}
          <RouteContainer
            data-testid="route-container"
            ref={routeContainerRef}
            $state={breakpoints.lg ? 'entered' : state}
          >
            {RouteItems}
            <AddAgentButton
              onClick={() => {
                setAgentModalPrepopulate({})
                setIsAgentModalOpen(true)
              }}
            >
              Add Agent
            </AddAgentButton>
          </RouteContainer>
        </RouteWrapper>
        <HeaderConnect />
      </NavContainer>
    </HeaderWrapper>
  </>)
}
