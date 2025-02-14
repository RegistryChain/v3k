import { useEffect, useState } from 'react'
import { zeroAddress } from 'viem'

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY // Replace with your Etherscan API key
const ETHERSCAN_BASE_URL = 'https://api-sepolia.etherscan.io/api'

const useTokenBalances = (address: any) => {
  const [balances, setBalances] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!address || address === zeroAddress) return

    const fetchTokenBalances = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `${ETHERSCAN_BASE_URL}?module=account&action=tokentx&address=${address}&apikey=${ETHERSCAN_API_KEY}`,
        )

        const data = await response.json()
        if (data.status !== '1') {
          throw new Error(data.message || 'Failed to fetch balances')
        }

        // Process token balances
        const tokenBalances = data.result.reduce((acc: any, tx: any) => {
          const token = acc.find((t: any) => t.contractAddress === tx.contractAddress)
          const balance = parseFloat(tx.value) / 10 ** parseInt(tx.tokenDecimal)

          if (token) {
            token.balance += balance
          } else {
            acc.push({
              tokenAddress: tx.contractAddress,
              decimals: parseInt(tx.tokenDecimal),
              tokenSymbol: tx.tokenSymbol,
              balance: balance,
            })
          }

          return acc
        }, [])

        setBalances(tokenBalances)
      } catch (err: any) {
        console.log(err.message)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTokenBalances()
  }, [address]) // Re-run when `address` changes

  return { balances, loading, error }
}

export default useTokenBalances
