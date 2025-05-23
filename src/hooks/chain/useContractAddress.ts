import { useClient } from 'wagmi'

import { ClientWithEns } from '@app/types'
import { getSupportedChainContractAddress } from '@app/utils/getSupportedChainContractAddress'
import { wagmiConfig } from '@app/utils/query/wagmi'

export const useContractAddress = <
  TContractName extends Extract<keyof ClientWithEns['chain']['contracts'], string>,
>({
  contract,
  blockNumber,
}: {
  contract: TContractName
  blockNumber?: bigint
}) => {
  const client: any = useClient({ config: wagmiConfig })

  return getSupportedChainContractAddress({
    client,
    contract,
    blockNumber,
  })
}
