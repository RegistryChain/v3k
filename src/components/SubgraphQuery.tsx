import { useEffect } from 'react'
import { cacheExchange, createClient, fetchExchange, Provider, useQuery } from 'urql'

const client = createClient({
  url:
    'https://gateway.thegraph.com/api/' +
    process.env.NEXT_PUBLIC_GRAPH_API_KEY +
    '/subgraphs/id/AhoD5qLo86GvWS4MybvMbY2CXub1WPy89khfC2QsPaXj',
  exchanges: [cacheExchange, fetchExchange],
})

const QUERY = `
  query ($tokenAddresses: [ID!]) {
    tokens(where: { id_in: $tokenAddresses }) {
      id
      name
      ticker
      telegram
      twitter
      volume
      website
      price
      marketcap
      liquidity
      creator
      pair
    }
  }
`

export const useSubgraphQuery = (tokenAddresses: any[], onResults: any) => {
  const [result] = useQuery({ query: QUERY, variables: { tokenAddresses } })
  const { data } = result

  useEffect(() => {
    try {
      if (data && onResults) {
        onResults(data.tokens)
      }
    } catch (err) {}
  }, [data, onResults])

  return null
}

const SubgraphResults = ({ tokenAddresses, onResults }: any) => {
  let queryRes = null
  // queryRes = useSubgraphQuery(tokenAddresses, onResults)
  // return <Provider value={client}>{queryRes}</Provider>
  return null
}

export default SubgraphResults
