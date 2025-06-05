import { useMemo } from 'react'

export const useChainName = () => {
  return useMemo(() => {
    return 'sepolia'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
