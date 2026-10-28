export function getAgentImageUrl(value: unknown): string {
  if (typeof value !== 'string') return ''
  const url = value.trim()
  if (/^ipfs:\/\//i.test(url)) return url.replace(/^ipfs:\/\/(ipfs\/)?/i, 'https://ipfs.io/ipfs/')
  if (/^ar:\/\//i.test(url)) return url.replace(/^ar:\/\//i, 'https://arweave.net/')
  return /^https?:\/\//i.test(url) ? url : ''
}
