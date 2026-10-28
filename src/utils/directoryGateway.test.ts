import { afterEach, describe, expect, it, vi } from 'vitest'

import { DIRECTORY_GATEWAY_URL, getDirectoryEntities, getDirectoryRecord } from './directoryGateway'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('public directory gateway', () => {
  it('reads agents from the current gateway with pagination and filters', async () => {
    const agents = [{ name: 'Luna', entityid: 'luna.ai.entity.id' }]
    const request = vi.fn().mockResolvedValue(Response.json({ success: true, data: agents }))
    vi.stubGlobal('fetch', request)

    await expect(getDirectoryEntities({ page: 1, nameSubstring: 'Luna AI', params: { avatar: 'https' } })).resolves.toEqual(agents)
    const url = request.mock.calls[0][0]
    expect(url).toBe(`${DIRECTORY_GATEWAY_URL}/direct/getEntitiesList/registrar=ai&page=1&nameSubstring=Luna%20AI&address=0x0000000000000000000000000000000000000000&sortField=birthdate&sortDir=desc&limit=24&avatar=https.json`)
  })

  it('rejects HTTP errors instead of returning undefined to the agent grid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: false }, { status: 500 })))
    await expect(getDirectoryEntities()).rejects.toThrow('500')
  })

  it('uses an exact category filter instead of the gateway’s grouping parameter', async () => {
    const request = vi.fn().mockResolvedValue(Response.json({ success: true, data: [] }))
    vi.stubGlobal('fetch', request)
    await getDirectoryEntities({ params: { category: 'Coding' } })
    expect(decodeURIComponent(request.mock.calls[0][0])).toContain('category={"$eq":"Coding"}.json')
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
