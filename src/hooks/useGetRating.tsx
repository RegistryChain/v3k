import { useEffect, useState } from 'react';
import axios from 'axios';
import { decodeEventLog, parseAbiItem, zeroHash } from 'viem';
import contractAddressesObj from '../constants/contractAddresses.json';
import { logFrontendError } from './useExecuteWriteToResolver';

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
const ETHERSCAN_BASE_URL = 'https://api-sepolia.etherscan.io/api';

const CONTRACT_ADDRESS = contractAddressesObj.ORIMMO;

const ratingEventAbi = parseAbiItem(
  'event RatingSubmitted(address indexed from, address indexed recipientNode, uint256 rating)'
);

const TOPIC0 = "0xdcba9448b55b807611f7e3ece24acdc6afaec1d8c5a16f3e70c571758f606654";

export const useGetRating = (nodehash: `0x${string}`) => {
  const [ratings, setRatings] = useState<{ from: string; rating: bigint }[]>([]);
  const [recipientAverages, setRecipientAverages] = useState<Record<string, number>>({});

  const [loading, setLoading] = useState(true);


  const recipientTopic = `0x${nodehash.slice(-40).padStart(64, '0')}`;

  const fetchRatings = async () => {
    setLoading(true);

    const params: any = {
      module: 'logs',
      action: 'getLogs',
      address: CONTRACT_ADDRESS,
      topic0: TOPIC0,
      offset: 1000,
      fromBlock: '0',
      toBlock: 'latest',
      apikey: ETHERSCAN_API_KEY,
    };

    if (recipientTopic && recipientTopic !== zeroHash) {
      params.topic2 = recipientTopic
    }
    try {
      const response = await axios.get(ETHERSCAN_BASE_URL, { params });

      if (response.data.status !== '1') {
        console.warn('No logs found:', response.data.message);
        setRatings([]);
        setRecipientAverages({});
        return;
      }

      const logs = response.data.result;

      const parsed = logs.map((log: any) => {
        const { args } = decodeEventLog({
          abi: [ratingEventAbi],
          data: log.data,
          topics: log.topics,
        });

        return {
          from: args.from as string,
          recipient: args.recipientNode?.toUpperCase() as string,
          rating: args.rating as bigint,
        };
      });

      setRatings(parsed);

      const totals: Record<string, bigint> = {};
      const counts: Record<string, number> = {};

      for (const r of parsed) {
        totals[r.recipient] = (totals[r.recipient] || 0n) + r?.rating || 0n;
        counts[r.recipient] = (counts[r.recipient] || 0) + 1;
      }

      const avgMap: Record<string, number> = {};
      for (const key in totals) {
        avgMap[key] = Number(totals[key] / BigInt(counts[key])) / 1e18;
      }

      setRecipientAverages(avgMap);
    } catch (err) {
      logFrontendError({
        error: err,
        message: '1 - Failed to fetch or parse rating logs in useGetRating',
        functionName: 'fetchRatings',
        args: { nodehash },
      })
      console.error('Failed to fetch logs from Etherscan:', err);
      setRatings([]);
      setRecipientAverages({});
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (nodehash) {
      fetchRatings();
    }
  }, [nodehash]);

  return { ratings, recipientAverages, loading, fetchRatings };
};
