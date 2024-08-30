import { useMemo } from 'react'
import { useChainId, useConfig } from 'wagmi'

import { getChainName } from '@app/utils/getChainName'

export const useChainName = () => {
  const config: any = useConfig()
  const chainId: any = useChainId()

  return useMemo(() => {
    return getChainName(config, { chainId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])
}
