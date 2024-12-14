import { Address, decodeAbiParameters, getContract, Hex, parseAbi } from 'viem'

import contractAddresses from '../constants/contractAddresses.json'
import l1abi from '../constants/l1abi.json'

export const useTextResolverResultsDecoded = async (
  client: any,
  entityResolver: Address,
  encodes: { encode: Hex; key: string }[],
) => {
  const resolver: any = await getContract({
    client,
    abi: l1abi,
    address: contractAddresses.PublicResolver as Address, //THIS IS THE ADDRESS OF THE CONTRACT WITH MULTICALLVIEW
  })
  let encResArr: any[] = []
  try {
    encResArr = await resolver.read.multicallView([entityResolver, encodes.map((x) => x.encode)]) // THIS USES THE ADDRESS OF THE ENTITIES RESOLVER, WHERE THE TEXTS GET READ FROM
  } catch (e) {}

  const decodedValues = encResArr.forEach((x: any, idx: any) => {
    try {
      return { key: encodes[idx].key, value: decodeAbiParameters([{ type: 'string' }], x)[0] }
    } catch (e) {
      return ''
    }
  })
  return decodedValues
}
