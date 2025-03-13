import { useTheme } from 'styled-components'

import { useQuery } from '@app/utils/query/useQuery'

import { useQueryOptions } from './useQueryOptions'

export const useZorb = (input: string, type: 'address' | 'name' | 'hash') => {
  const {
    colors: { background: bg, text: fg, accentLight: accent },
  } = useTheme()
  const { queryKey } = useQueryOptions({
    params: { input, type, colors: { bg, fg, accent } },
    functionName: 'zorb',
    queryDependencyType: 'independent',
    keyOnly: true,
  })

  return null
}
