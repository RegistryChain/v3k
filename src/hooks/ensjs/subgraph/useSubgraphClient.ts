import { useMemo } from 'react'
import { useClient } from 'wagmi'

import { createSubgraphClient } from '@ensdomains/ensjs/subgraph'

import { wagmiConfig } from '@app/utils/query/wagmi'

export const useSubgraphClient = () => {
  const client: any = useClient({ config: wagmiConfig })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => createSubgraphClient({ client }), [client.chain.id])
}
