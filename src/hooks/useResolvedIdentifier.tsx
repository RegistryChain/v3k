import { useEffect, useState } from 'react'
import { Address, isAddress, namehash, zeroAddress } from 'viem'
import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import { checkOwner } from '@app/hooks/useCheckOwner'

export function useResolvedIdentifier(rawIdentifier: string | undefined, publicClient: any) {
    const [resolved, setResolved] = useState<{
        primaryName: string | undefined,
        owner: string,
        loading: boolean
    }>({
        primaryName: undefined,
        owner: zeroAddress,
        loading: true,
    })

    const primary = usePrimaryName({ address: rawIdentifier as any })
    useEffect(() => {
        const resolve = async () => {
            if (!rawIdentifier) return

            let primaryName = rawIdentifier
            let owner: Address = zeroAddress
            let ensName = ""
            if (isAddress(rawIdentifier)) {
                ensName = primary?.data?.name
                if (ensName) {
                    primaryName = ensName
                }
                owner = rawIdentifier
            } else {
                const nameHash = namehash(rawIdentifier)
                owner = await checkOwner(publicClient, nameHash) || zeroAddress
            }

            if (!resolved?.primaryName || (resolved?.primaryName !== ensName && ensName)) {
                setResolved({ primaryName, owner, loading: false })
            }
        }

        resolve()
    }, [rawIdentifier, primary?.data?.name])

    return resolved
}
