import { afterEach, describe, expect, it, vi } from 'vitest'

import { DIRECTORY_GATEWAY_URL, getDirectoryEntities, getDirectoryRecord } from './directoryGateway'
import { getAgentImageUrl } from './agentImage'

const queryFrom = (url: string) => new URLSearchParams(new URL(url).pathname.split('/getEntitiesList/')[1].slice(0, -5))

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('public directory gateway', () => {
  it('reads agents from the current gateway with pagination and filters', async () => {
    const agents = [{ name: 'Luna', entityid: 'luna.ai.entity.id' }]
    const request = vi.fn().mockResolvedValue(Response.json({ success: true, data: agents }))
    vi.stubGlobal('fetch', request)

    await expect(getDirectoryEntities({ page: 416, nameSubstring: 'Luna AI' })).resolves.toEqual(agents)
    const url = request.mock.calls[0][0]
    expect(url.startsWith(DIRECTORY_GATEWAY_URL)).toBe(true)
    const query = queryFrom(url)
    expect([...query.keys()].slice(0, 7)).toEqual(['registrar', 'page', 'nameSubstring', 'address', 'sortField', 'sortDir', 'limit'])
    expect(query.get('page')).toBe('416')
    expect(query.get('nameSubstring')).toBe('Luna AI')
    expect(query.get('sortField')).toBe('_id')
    expect(query.get('limit')).toBe('24')
  })

  it('includes uppercase AI imports without requiring an avatar or an explicit visibility flag', async () => {
    const agents = [{ name: 'ERC-8004 Agent 55455', registrar: 'AI', source: 'erc8004', entityid: 'agent-55455.ai.entity.id' }]
    const request = vi.fn().mockResolvedValue(Response.json({ success: true, data: agents }))
    vi.stubGlobal('fetch', request)
    await expect(getDirectoryEntities()).resolves.toEqual(agents)
    const query = queryFrom(request.mock.calls[0][0])
    expect(query.get('registrar')).toBe('any')
    expect(query.has('avatar')).toBe(false)
    expect(query.has('v3k__hidden')).toBe(false)
    expect(JSON.parse(query.get('$and')!)).toEqual([
      { registrar: { $in: ['ai', 'AI'] } },
      { v3k__hidden: { $ne: true } },
    ])
  })

  it.each([
    ['erc8004', { source: 'erc8004' }],
    ['other', { source: { $ne: 'erc8004' } }],
  ] as const)('filters the %s source without changing the shared catalog', async (source, expected) => {
    const request = vi.fn().mockResolvedValue(Response.json({ success: true, data: [] }))
    vi.stubGlobal('fetch', request)
    await getDirectoryEntities({ source })
    expect(JSON.parse(queryFrom(request.mock.calls[0][0]).get('$and')!)).toContainEqual(expected)
  })

  it('makes image filtering optional and includes IPFS images', async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ success: true, data: [] }))
    vi.stubGlobal('fetch', request)
    await getDirectoryEntities({ withImagesOnly: true })
    expect(JSON.parse(queryFrom(request.mock.calls[0][0]).get('$and')!)).toContainEqual({ avatar: { $type: 'string', $ne: '' } })
  })

  it('rejects HTTP errors instead of returning undefined to the agent grid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: false }, { status: 500 })))
    await expect(getDirectoryEntities()).rejects.toThrow('500')
  })

  it('uses an exact category filter instead of the gateway’s grouping parameter', async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ success: true, data: [] }))
    vi.stubGlobal('fetch', request)
    await getDirectoryEntities({ params: { category: 'Coding' } })
    expect(JSON.parse(queryFrom(request.mock.calls[0][0]).get('category')!)).toEqual({ $eq: 'Coding' })
  })

  it.each([
    { success: false, error: { message: 'Unavailable' } },
    { success: true },
    { success: true, data: null },
    { success: true, data: {} },
  ])('rejects an invalid list response: %j', async (payload) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(payload)))
    await expect(getDirectoryEntities()).rejects.toThrow()
  })

  it('accepts an empty successful result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: true, data: [] })))
    await expect(getDirectoryEntities()).resolves.toEqual([])
  })

  it('does not depend on a working browser storage cache', async () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Storage denied') } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: true, data: [] })))
    await expect(getDirectoryEntities()).resolves.toEqual([])
  })

  it('times out an unresponsive gateway', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')))
    })))
    const result = expect(getDirectoryEntities()).rejects.toThrow('aborted')
    await vi.advanceTimersByTimeAsync(15000)
    await result
  })

  it('reads an agent profile without importing or registering anything', async () => {
    const record = { name: 'Luna', entityid: 'luna.ai.entity.id' }
    const request = vi.fn().mockResolvedValue(Response.json({ success: true, data: record }))
    vi.stubGlobal('fetch', request)
    await expect(getDirectoryRecord('0x123')).resolves.toEqual(record)
    expect(request).toHaveBeenCalledTimes(1)
    expect(request.mock.calls[0][0]).toBe(`${DIRECTORY_GATEWAY_URL}/direct/getRecord/nodehash=0x123.json`)
  })

  it('reports a missing profile without falling back to an import operation', async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ success: true, data: {} }))
    vi.stubGlobal('fetch', request)
    await expect(getDirectoryRecord('0x123')).rejects.toThrow('could not be found')
    expect(request).toHaveBeenCalledTimes(1)
  })
})

describe('agent images', () => {
  it.each([
    [undefined, ''],
    ['', ''],
    ['javascript:alert(1)', ''],
    ['https://example.com/agent.png', 'https://example.com/agent.png'],
    ['ipfs://bafyexample/image.png', 'https://ipfs.io/ipfs/bafyexample/image.png'],
    ['ipfs://ipfs/bafyexample/image.png', 'https://ipfs.io/ipfs/bafyexample/image.png'],
    ['ar://example', 'https://arweave.net/example'],
  ])('handles image URI %s', (input, expected) => {
    expect(getAgentImageUrl(input)).toBe(expected)
  })
})
