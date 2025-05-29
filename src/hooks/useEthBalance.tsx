import { getPublicClient } from '@app/utils/utils'
import { useEffect, useState } from 'react'
import { Address, formatEther } from 'viem'


export const useEthBalance = (address?: Address) => {
  const [balance, setBalance] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const publicClient = getPublicClient()
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) return
      setLoading(true)
      setError(null)

      try {
        const rawBalance = await publicClient.getBalance({ address })
        const formatted = formatEther(rawBalance)
        setBalance(formatted)
      } catch (err) {
        setError(err as Error)
        setBalance('0')
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [address])

  return { balance, loading, error }
}
