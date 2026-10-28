// Public directory reads use the current gateway. Keep this separate from the
// resolver URL used by v3k's legacy Sepolia signing and registration flows.
export const DIRECTORY_GATEWAY_URL = (
  process.env.NEXT_PUBLIC_DIRECTORY_GATEWAY_URL || 'https://gateway.registrychain.com'
).replace(/\/$/, '')

export const DIRECTORY_PAGE_SIZE = 24
export type DirectorySource = 'all' | 'erc8004' | 'other'
const REQUEST_TIMEOUT_MS = 15000

export async function fetchDirectoryData(url: string): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`Directory request failed (${response.status})`)
    const result = await response.json()
    if (result?.success !== true || result.data === undefined) {
      throw new Error('The directory returned an invalid response')
    }
    return result.data
  } finally {
    clearTimeout(timeout)
  }
}

export async function getDirectoryRecord(nodehash: string, gatewayUrl = DIRECTORY_GATEWAY_URL) {
  const record = await fetchDirectoryData(`${gatewayUrl}/direct/getRecord/nodehash=${nodehash}.json`)
  if (!record || typeof record !== 'object' || Array.isArray(record) || !Object.keys(record).length) {
    throw new Error('This agent could not be found.')
  }
  return record
}

export async function getDirectoryEntities({
  source = 'all',
  withImagesOnly = false,
  nameSubstring = '',
  sortType = '_id',
  sortDirection = 'desc',
  page = 0,
  limit = DIRECTORY_PAGE_SIZE,
  address = '0x0000000000000000000000000000000000000000',
  params = {},
}: {
  source?: DirectorySource
  withImagesOnly?: boolean
  nameSubstring?: string
  sortType?: string
  sortDirection?: string
  page?: number
  limit?: number
  address?: string
  params?: Record<string, unknown>
} = {}): Promise<any[]> {
  const { v3k__hidden: hidden, ...filters } = params
  let visibility = hidden
  if (hidden === 'true') visibility = true
  if (hidden === 'false') visibility = false
  // Imported ERC-8004 agents use uppercase AI and may omit v3k's moderation
  // fields. Keep explicitly hidden agents out, while including unflagged imports.
  // Nest visibility in $and: a top-level v3k__hidden parameter makes the gateway
  // override sorting, and registrar=ai adds its own restrictive visibility filter.
  const agentFilters: Record<string, unknown>[] = [
    { registrar: { $in: ['ai', 'AI'] } },
    { v3k__hidden: visibility ?? { $ne: true } },
  ]
  if (source === 'erc8004') agentFilters.push({ source: 'erc8004' })
  if (source === 'other') agentFilters.push({ source: { $ne: 'erc8004' } })
  if (withImagesOnly) agentFilters.push({ avatar: { $type: 'string', $ne: '' } })

  // The gateway expects these seven fields before any additional filters.
  const fields = {
    registrar: 'any',
    page,
    nameSubstring,
    address,
    sortField: sortType,
    sortDir: sortDirection,
    limit,
    ...filters,
    $and: agentFilters,
    // Plain category strings are reserved for corporate/civil grouping by the
    // gateway. Use an exact filter for v3k's agent-category selector.
    ...(typeof params.category === 'string' && params.category
      ? { category: { $eq: params.category } }
      : {}),
  }
  const query = Object.entries(fields)
    .map(([key, value]) => {
      const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
      return `${encodeURIComponent(key)}=${encodeURIComponent(text)}`
    })
    .join('&')
  const url = `${DIRECTORY_GATEWAY_URL}/direct/getEntitiesList/${query}.json`
  const data = await fetchDirectoryData(url)
  if (!Array.isArray(data)) throw new Error('The directory returned an invalid agent list')
  return data
}
