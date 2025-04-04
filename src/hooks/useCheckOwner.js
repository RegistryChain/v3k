import { zeroAddress } from 'viem'

import contractAddressesObj from '../constants/contractAddresses.json'

export const checkOwner = async (client, nodehash) => {
  const readData = {
    functionName: 'owner',
    address: contractAddressesObj.ENSRegistry,
    abi: [
      {
        inputs: [
          {
            internalType: 'bytes32',
            name: 'node',
            type: 'bytes32',
          },
        ],
        name: 'owner',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    args: [nodehash],
  }
  try {
    const onchainOwner = await client.readContract(readData)
    console.log(onchainOwner)
    return onchainOwner
  } catch (err) {
    console.log(err.message)
    return zeroAddress
  }
}
