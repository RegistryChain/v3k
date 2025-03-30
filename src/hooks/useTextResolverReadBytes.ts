import { encodeFunctionData, Hex, namehash } from 'viem'

export const useTextResolverReadBytes = async (nodehash: Hex) => {
  const keys = ['name']

  const encodes = keys.map((text) => {
    return {
      encode: encodeFunctionData({
        abi: [
          {
            inputs: [
              {
                internalType: 'bytes32',
                name: 'node',
                type: 'bytes32',
              },
              {
                internalType: 'string',
                name: 'key',
                type: 'string',
              },
            ],
            name: 'text',
            outputs: [
              {
                internalType: 'string',
                name: '',
                type: 'string',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'text',
        args: [nodehash, text],
      }),
      key: text,
    }
  })
  return encodes
}
