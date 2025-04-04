import { UrlObject } from 'url'

import {
  CogActiveSVG,
  CogSVG,
  DotGridActiveSVG,
  DotGridSVG,
  HeartActiveSVG,
  HeartSVG,
  MagnifyingGlassActiveSVG,
  MagnifyingGlassSVG,
  PersonActiveSVG,
  PersonSVG,
} from '@ensdomains/thorin'

export type PublicRoute =
  | 'search'
  | 'governance'
  | 'community'
  | 'developers'
  | 'support'
  | 'bounty'
  | 'terms'
  | 'privacy'
  | 'oldApp'
  | 'ipfsApp'
  | 'feedback'
export type ConnectedRoute = 'names' | 'profile' | 'favourites' | 'settings'
export type AnyRoute = PublicRoute | ConnectedRoute | 'unknown'

export type RouteItemObj = {
  name: PublicRoute | ConnectedRoute | 'unknown'
  href: string
  label: string
  disabled: boolean
  connected: boolean
  icon?: {
    inactive: any
    active: any
  }
  onlyDropdown?: boolean
}

export const routes: RouteItemObj[] = [
  {
    name: 'search',
    href: '/',
    label: 'navigation.home',
    disabled: false,
    connected: false,
    icon: {
      inactive: MagnifyingGlassSVG,
      active: MagnifyingGlassActiveSVG,
    },
  },
  {
    name: 'names',
    href: '/directory',
    label: 'Browse Agents',
    disabled: false,
    connected: true,
    icon: {
      inactive: DotGridSVG,
      active: DotGridActiveSVG,
    },
  },
  {
    name: 'favourites',
    href: '/my/favourites',
    label: 'navigation.favourites',
    disabled: true,
    connected: true,
    icon: {
      inactive: HeartSVG,
      active: HeartActiveSVG,
    },
  },
  {
    name: 'settings',
    href: '/my/settings',
    label: 'navigation.settings',
    disabled: false,
    connected: true,
    icon: {
      inactive: CogSVG,
      active: CogActiveSVG,
    },
    onlyDropdown: true,
  },
  {
    name: 'profile',
    href: '/my/profile',
    label: 'navigation.profile',
    disabled: false,
    connected: true,
    icon: {
      inactive: PersonSVG,
      active: PersonActiveSVG,
    },
    onlyDropdown: true,
  },
]

export const legacyFavouritesRoute: RouteItemObj = {
  name: 'favourites',
  href: '/legacyfavourites',
  label: 'navigation.favourites',
  disabled: false,
  connected: false,
  icon: {
    inactive: HeartSVG,
    active: HeartActiveSVG,
  },
}

export const getRoute = (name: PublicRoute | ConnectedRoute): RouteItemObj =>
  routes.find((route) => route.name === name) as RouteItemObj

// these rewrites are similar to the next.config.js rewrites
// however the destination property uses the path index instead of a named parameter
// e.g. /profile/:name => /profile?name=$2
export const rewrites = [
  {
    source: '/my/profile',
    destination: '/profile?connected=true',
    flattenedDestination: '/my/profile',
  },
  {
    source: '/names/:address',
    destination: '/my/names?address=$2',
    flattenedDestination: '/names/$2',
    tldPrefix: true,
  },
  {
    source: '/profile/:name',
    destination: '/profile?name=$2',
    flattenedDestination: '/$2',
    tldPrefix: true,
  },
  {
    source: '/expired-profile/:name',
    destination: '/profile?name=$2&expired=true',
    flattenedDestination: '/$2/expired-profile',
    tldPrefix: true,
  },
  {
    source: '/register/:name',
    destination: '/register?name=$2',
    flattenedDestination: '/$2/register',
    tldPrefix: true,
  },
  {
    source: '/import/:name',
    destination: '/import?name=$2',
    flattenedDestination: '/$2/import',
    tldPrefix: true,
  },
  {
    source: '/dotbox/:name',
    destination: '/dotbox?name=$2',
    flattenedDestination: '/$2/dotbox',
    tldPrefix: true,
  },
  {
    source: '/address/:address',
    destination: '/address?address=$2',
    flattenedDestination: '/$2',
  },
]
export const getDestination = (url: UrlObject | string) => {
  const isIPFS = !!process.env.NEXT_PUBLIC_IPFS
  const isObj = typeof url !== 'string'
  let href = isObj ? url.pathname! : url
  const query = new URLSearchParams(isObj ? ((url.query || '') as any) : '')
  for (const rewrite of rewrites) {
    const regex = new RegExp(rewrite.source.replace(/:[^/]+/g, '([^/]+)'))
    const match = regex.exec(href)
    if (match) {
      const values = href.split('/')
      let replacedDestination = (isIPFS ? rewrite.destination : rewrite.flattenedDestination)
        .replace(/\$(\d)/g, (_, n) => values[parseInt(n)])
        .replace('#', '%23')
      if (!isIPFS && rewrite.tldPrefix && !replacedDestination.includes('.')) {
        replacedDestination = `/tld${replacedDestination}`
      }
      const [newPathname, newQuery] = replacedDestination.split('?')
      if (newQuery) {
        const newQueryParams = new URLSearchParams(newQuery)
        newQueryParams.forEach((value, key) => {
          query.set(key, value)
        })
      }
      href = newPathname
    }
  }
  const makeURLString = () => {
    const parsedQuery = query.toString()
    return `${href}${parsedQuery ? `?${parsedQuery}` : ''}`
  }

  if (!isIPFS) {
    if (isObj) {
      return {
        pathname: href,
        query: query.toString(),
      }
    }
    return makeURLString()
  }
  // make absolute url relative
  // when displayed in url bar
  if (href?.startsWith('/')) {
    //  for static html compilation
    href = `.${href}`

    // on the client
    //   document is unavailable when compiling on the server
    if (typeof document !== 'undefined') {
      href = new URL(href, document.baseURI).href
    }
  }
  return makeURLString()
}
