import axios from 'axios'
import { useCallback, useState } from 'react'
import { decodeAbiParameters, isAddress } from 'viem'

import contractAddresses from '../constants/contractAddresses.json'

// Etherscan API Configuration
const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY
const ETHERSCAN_BASE_URL = 'https://api-sepolia.etherscan.io/api'

// ENS Contract Address (Mainnet)
const ENS_REGISTRY_ADDRESS = contractAddresses.ENSRegistry

// Event Signatures
const RESOLVER_CHANGED_TOPIC = '0x335721b01866dc23fbee8b6b2c7b1e14d6f05c28cd35a2c934239f94095602a0' // ResolverChanged(bytes32,address)
const TEXT_CHANGED_TOPIC = '0x448bc014f1536726cf8d54ff3d6481ed3cbc683c2591ca204274009afa09b1a1' // TextChanged(bytes32,string,string)

/**
 * Custom React Hook to fetch ENS history
 * @returns {object} { history, loading, error, fetchEnsHistory }
 */
export function useEnsHistory() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState<any>(false)
  const [error, setError] = useState<any>(null)

  /**
   * Fetch logs from Etherscan API
   * @param {Object} params - API query parameters
   * @returns {Promise<Array>} - List of logs
   */
  const fetchLogs = async (params: any) => {
    try {
      const response = await axios.get(ETHERSCAN_BASE_URL, { params })
      if (response.data.status === '1') {
        return response.data.result
      } else {
        console.error('Etherscan API Error:', response.data.message)
        return []
      }
    } catch (error: any) {
      console.error('Error fetching logs:', error.message)
      return []
    }
  }

  /**
   * Get ResolverChanged logs for a given ENS node
   * @param {string} nodehash - ENS domain node hash (bytes32)
   * @returns {Promise<Array>} - List of resolver addresses
   */
  const getResolvers = async (nodehash: any) => {
    const params = {
      module: 'logs',
      action: 'getLogs',
      address: ENS_REGISTRY_ADDRESS,
      topic0: RESOLVER_CHANGED_TOPIC,
      topic1: nodehash,
      fromBlock: '0',
      toBlock: 'latest',
      apikey: ETHERSCAN_API_KEY,
    }

    const logs = await fetchLogs(params)
    return logs
      .map((log: any) => {
        const rawAddress = '0x' + log.data.slice(26) // Extract address from log data
        return isAddress(rawAddress) ? rawAddress : null
      })
      .filter((addr: any) => addr !== null)
  }

  /**
   * Get TextChanged logs for a given resolver and nodehash
   * @param {string} resolver - Resolver contract address
   * @param {string} nodehash - ENS domain node hash (bytes32)
   * @returns {Promise<Array>} - List of decoded text records grouped by transaction hash
   */
  const getTextRecords = async (resolver: any, nodehash: any) => {
    const params = {
      module: 'logs',
      action: 'getLogs',
      address: resolver,
      topic0: TEXT_CHANGED_TOPIC,
      topic1: nodehash,
      fromBlock: '0',
      toBlock: 'latest',
      apikey: ETHERSCAN_API_KEY,
    }

    const logs = await fetchLogs(params)
    let transactions: any = {}

    logs.forEach((log: any) => {
      try {
        const decoded = decodeAbiParameters([{ type: 'string' }, { type: 'string' }], log.data)

        const transactionHash = log.transactionHash
        const timestamp = parseInt(log.timeStamp, 16) // Convert hex timestamp to integer

        if (!transactions[transactionHash]) {
          transactions[transactionHash] = {
            nodehash,
            changedProperties: {},
            sourceFunction: 'setText',
            timestamp: new Date(timestamp * 1000), // Convert UNIX timestamp to Date object
          }
        }

        transactions[transactionHash].changedProperties[decoded[0]] = decoded[1] // Add key-value pairs
      } catch (error) {
        console.error('Failed to decode log data:', log.data, error)
      }
    })

    return Object.values(transactions) // Convert object to array
  }

  /**
   * Fetch ENS subdomain history
   * @param {string} nodehash - ENS domain node hash (bytes32)
   */
  const fetchEnsHistory = useCallback(async (nodehash: any) => {
    if (!nodehash) return

    setLoading(true)
    setError(null)

    try {
      console.log(`Fetching resolver history for node: ${nodehash}`)
      const resolvers = await getResolvers(nodehash)
      console.log(`Resolvers found: ${resolvers.length}`)

      let historyData: any[] = []

      for (let resolver of resolvers) {
        console.log(`Fetching text records for resolver: ${resolver}`)
        const textRecords = await getTextRecords(resolver, nodehash)
        historyData = historyData.concat(textRecords)
      }

      setHistory(historyData)
    } catch (err) {
      setError('Failed to fetch ENS history.')
      console.error('Error fetching ENS history:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { history, loading, error, fetchEnsHistory }
}
