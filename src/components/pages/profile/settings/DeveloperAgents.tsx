import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, UseFormReturn, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { Address, getContract, labelhash, namehash, zeroAddress } from 'viem'
import { useClient } from 'wagmi'

import { getDecodedName, Name } from '@ensdomains/ensjs/subgraph'
import { decodeLabelhash, isEncodedLabelhash, saveName } from '@ensdomains/ensjs/utils'
import { Button, Dialog, Heading, Typography } from '@ensdomains/thorin'

import { DialogHeadingWithBorder } from '@app/components/@molecules/DialogComponentVariants/DialogHeadinWithBorder'
import {
    NameTableHeader,
    SortDirection,
    SortType,
} from '@app/components/@molecules/NameTableHeader/NameTableHeader'
import { SpinnerRow } from '@app/components/@molecules/ScrollBoxWithSpinner'
import l1abi from '@app/constants/l1abi.json'

import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import { useNamesForAddress } from '@app/hooks/ensjs/subgraph/useNamesForAddress'
import { useResolverStatus } from '@app/hooks/resolver/useResolverStatus'
import useDebouncedCallback from '@app/hooks/useDebouncedCallback'
import { useIsWrapped } from '@app/hooks/useIsWrapped'
import { useProfile } from '@app/hooks/useProfile'
import { createQueryKey } from '@app/hooks/useQueryOptions'
import {
    nameToFormData,
    UnknownLabelsForm,
    FormData as UnknownLabelsFormData,
} from '@app/transaction-flow/input/UnknownLabels/views/UnknownLabelsForm'
import { TransactionDialogPassthrough } from '@app/transaction-flow/types'

import { getEntitiesList, getResolverAddress } from '@app/hooks/useExecuteWriteToResolver'
import { getPrivyWalletClient, getPublicClient, normalizeLabel } from '@app/utils/utils'
import { useRouter } from 'next/navigation'
import { TaggedNameItem } from '@app/components/@atoms/NameDetailItem/TaggedNameItem'
import { useWallets } from '@privy-io/react-auth'
import { wagmiConfig } from '@app/utils/query/wagmi'

const DEFAULT_PAGE_SIZE = 100

export const hasEncodedLabel = (name: string) =>
    name.split('.').some((label) => isEncodedLabelhash(label))

export const getNameFromUnknownLabels = (
    name: string,
    unknownLabels: UnknownLabelsFormData['unknownLabels'],
) => {
    const [tld, ...reversedLabels] = name.split('.').reverse()
    const labels = reversedLabels.reverse()
    const processedLabels = labels.map((label, index) => {
        const unknownLabel = unknownLabels.labels[index]
        if (
            !!unknownLabel &&
            isEncodedLabelhash(label) &&
            decodeLabelhash(label) === unknownLabel.label &&
            unknownLabel.label === labelhash(unknownLabel.value)
        )
            return unknownLabel.value
        return label
    })
    return [...processedLabels, tld].join('.')
}



type FormData = {
    name?: Name
} & UnknownLabelsFormData

const LoadingContainer = styled.div(
    ({ theme }) => css`
    display: flex;
    flex-direction: column;
    min-height: ${theme.space['72']};
    justify-content: center;
    align-items: center;
    gap: 0;
  `,
)

const NameTableHeaderWrapper = styled.div(
    ({ theme }) => css`
    width: calc(100% + 2 * ${theme.space['4']});
    margin: 0 -${theme.space['4']} -${theme.space['4']};
    border-bottom: 1px solid ${theme.colors.border};
    > div {
      border-bottom: none;
    }
    @media (min-width: ${theme.breakpoints.sm}px) {
      width: calc(100% + 2 * ${theme.space['6']});
      margin: 0 -${theme.space['6']} -${theme.space['6']};
    }
  `,
)

const ErrorContainer = styled.div(
    ({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${theme.space['4']};
  `,
)


const ScrollableDialogContent = styled.div`
    height: 400px;
  overflow: scroll;

  /* Scrollbar styles */
  &::-webkit-scrollbar {
    width: ${({ theme }) => theme.space["1.5"]}; /* Adjust width */
    height: ${({ theme }) => theme.space["1.5"]}; /* Adjust height */
    background-color: transparent;
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
    margin: 0 ${({ theme }) => theme.space["3"]};
  }

  &::-webkit-scrollbar-thumb {
    border-radius: ${({ theme }) => theme.radii.full};
    border-right-style: inset;
    border-right-width: calc(100vw + 100vh);
    border-color: inherit;
  }

  &::-webkit-scrollbar-button {
    display: none;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.greyPrimary};
  }
`;


const DeveloperAgents = ({ address, record }: any) => {
    const { t } = useTranslation('transactionFlow')
    const formRef = useRef<HTMLFormElement>(null)
    const queryClient = useQueryClient()

    const form = useForm<FormData>({
        mode: 'onChange',
        defaultValues: {
            name: undefined,
            unknownLabels: {
                tld: '',
                labels: [],
            },
        },
    })
    const { handleSubmit, control, setValue } = form

    const client: any = useClient({ config: wagmiConfig })

    const [sortType, setSortType] = useState<SortType>('labelName')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
    const [searchInput, setSearchInput] = useState('')
    const [searchQuery, _setSearchQuery] = useState('')
    const [offchainEntities, setOffchainEntities] = useState([])
    const setSearchQuery = useDebouncedCallback(_setSearchQuery, 300, [])
    const router = useRouter()
    const { wallets } = useWallets();      // Privy hook

    const currentPrimary = usePrimaryName({ address })
    const {
        data: namesData,
        hasNextPage,
        fetchNextPage: loadMoreNames,
        isLoading: isLoadingNames,
    } = useNamesForAddress({
        address,
        orderBy: sortType,
        orderDirection: sortDirection,
        filter: {
            searchString: searchQuery,
        },
        pageSize: DEFAULT_PAGE_SIZE,
    })


    // Filter out the primary name's data
    const filteredNamesPages = useMemo(() => {

        let maps: any[] = namesData?.pages?.map((page: Name[]) =>
            page.filter((name: Name) => name?.name !== currentPrimary?.data?.name && name?.name?.includes('ai')),
        ) || []


        if (offchainEntities) {

            const formattedEntities = offchainEntities.map((entity: any) => {
                return { id: entity.nodehash, isMigrated: true, labelName: entity.name, truncatedName: entity.entityid, labelHash: labelhash(normalizeLabel(entity.entityid.split('.')[0])), name: entity.entityid, owner: entity.owner, parent: "ai.entity.id", resolvedAddress: entity.address }
            })
            maps = [...maps, formattedEntities]
        }
        return maps
    }, [namesData, address, offchainEntities])


    const getOwnerEntities = async () => {
        const entities = await getEntitiesList({
            registrar: "ai",
            limit: 20,
            nameSubstring: searchInput,
            params: {
                $or: [
                    { owner: address },
                    { partners: { $elemMatch: { walletaddress: address } } }
                ]
            },
            address
        })
        setOffchainEntities(entities)
    }


    useEffect(() => {

        getOwnerEntities()
    }, [searchInput])

    const selectedName = useWatch({
        control,
        name: 'name',
    })

    const dispatchTransactions = async (name: string) => {

        const client = getPublicClient()
        let resolverToUse: any = await getResolverAddress(client, name)
        const wallet = await getPrivyWalletClient(wallets.find(w => w.walletClientType === 'embedded') || wallets[0])

        const revRes: any = getContract({
            address: "0xcf75b92126b02c9811d8c632144288a3eb84afc8",
            abi: l1abi,
            client: wallet,
        })

        try {
            const tx = await revRes.write.setNameForAddr([address, address, resolverToUse, name])
            const txRes = await client?.waitForTransactionReceipt({
                hash: tx,
            })

            if (txRes.status === 'success') {
                router.refresh()

            }
        } catch (err) {
            console.log(err, 'Failure')
        }
    }

    // Checks if name has encoded labels and attempts decrypt them if they exist
    const validateKey = (input: string) =>
        createQueryKey({
            queryDependencyType: 'independent',
            params: { input },
            functionName: 'validate',
        })
    const { mutate: mutateName, isPending: isMutationLoading } = useMutation({
        mutationFn: async (data: FormData) => {
            console.log('IN DISPATCH', data)
            if (!data.name?.name) throw new Error('no_name')

            let validName = data.name.name
            if (!hasEncodedLabel(validName)) return validName

            // build name from unkown labels
            validName = getNameFromUnknownLabels(validName, data.unknownLabels)
            if (!hasEncodedLabel(validName)) {
                saveName(validName)
                queryClient.resetQueries({ queryKey: validateKey(data.name?.name) })
                return validName
            }

            // Attempt to decrypt name
            validName = (await getDecodedName(client, {
                name: validName,
                allowIncomplete: true,
            })) as string
            if (!hasEncodedLabel(validName)) {
                saveName(validName)
                queryClient.resetQueries({ queryKey: validateKey(data.name?.name) })
                return validName
            }

            throw new Error('invalid_name')
        },
        onSuccess: (name) => {
            console.log('Setting Developer Profile Name')
            dispatchTransactions(name)
        },
        onError: (error, variables) => {
            if (!(error instanceof Error)) return
            if (error.message === 'invalid_name') {
                setValue('unknownLabels', nameToFormData(variables.name?.name || '').unknownLabels)
            }
        },
    })


    const isLoading = isLoadingNames || isMutationLoading

    // Show header if more than one page has been loaded, if only one page has been loaded but there is another page, or if there is an active search query
    const showHeader =
        (!!namesData && filteredNamesPages.length > 1 && !searchQuery) || hasNextPage || !!searchQuery

    const hasNoEligibleNames =
        filteredNamesPages.length === 0

    if (isLoading)
        return (
            <Dialog.Content hideDividers fullWidth>
                <LoadingContainer>
                    <Heading>{t('loading', { ns: 'common' })}</Heading>
                    <SpinnerRow />
                </LoadingContainer>
            </Dialog.Content>
        )

    return (
        <div style={{ width: "100%", bottom: "initial", padding: "0" }}>
            <div style={{ padding: "0 10%", width: "100%", borderRadius: "16px", gap: "1.5rem", maxHeight: "min(90vh, 36rem)", border: "1px solid hsl(0 0% 91%)" }}>
                <DialogHeadingWithBorder title={t('input.developerAgents.title')} />
                {showHeader && (
                    <NameTableHeaderWrapper>
                        <NameTableHeader
                            data-testid="primary-names-modal-header"
                            mode="view"
                            selectable={false}
                            sortType={sortType}
                            sortTypeOptionValues={['labelName', 'createdAt', 'expiryDate']}
                            sortDirection={sortDirection}
                            searchQuery={searchInput}
                            selectedCount={0}
                            onSortTypeChange={(type: any) => setSortType(type as SortType)}
                            onSortDirectionChange={setSortDirection}
                            onSearchChange={(search) => {
                                setSearchInput(search)
                                setSearchQuery(search)
                            }}
                        />
                    </NameTableHeaderWrapper>
                )}
                <ScrollableDialogContent
                    as="form"
                    onSubmit={handleSubmit((data) => mutateName(data))}
                >
                    {(filteredNamesPages[0].length > 0 || offchainEntities?.length > 0) ? (
                        <>
                            {filteredNamesPages?.map((page: Name[]) =>
                                page.map((name: Name) => (
                                    <TaggedNameItem
                                        key={name.id}
                                        {...name}
                                        mode="select"
                                        selected={selectedName?.name === name.name}
                                        onClick={() => {
                                            router.push('/agent/' + name.name)
                                        }}
                                    />
                                )),
                            )}
                        </>
                    ) : (
                        <ErrorContainer>
                            <Typography fontVariant="bodyBold" color="grey">
                                {hasNoEligibleNames
                                    ? t('input.developerAgents.errors.noEligibleNames')
                                    : t('input.developerAgents.errors.noNamesFound')}
                            </Typography>
                        </ErrorContainer>
                    )}
                </ScrollableDialogContent>

            </div>
        </div>
    )
}

export default DeveloperAgents
