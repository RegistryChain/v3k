import { Address, encodeFunctionData, getContract, namehash, parseAbi } from 'viem'

import { generateRecordCallArray } from '@ensdomains/ensjs/utils'
import { Button } from '@ensdomains/thorin'

import contractAddresses from '../../../../../../constants/contractAddresses.json'

const ActionsProposal = ({ refetchTx, setErrorMessage, multisigAddress, wallet, name }: any) => {
  const makeProposal = async () => {
    try {
      const multisig: any = getContract({
        address: multisigAddress as Address,
        abi: parseAbi([
          'function submitMulticallTransaction(address,bytes32,string,bytes[]) external',
        ]),
        client: wallet,
      })

      // IMPORTANT - switch out manager hash and make call to registrar contracts to see what roles would work with the proposed tx
      const roleHash = '0x9a57c351532c19ba0d9d0f5f5524a133d80a3ebcd8b10834145295a87ddce7ce'

      const constitutionData2 = generateRecordCallArray({
        namehash: namehash(name),
        texts: [
          { key: 'company__address', value: '345 Avenida Paulista' },
          { key: 'company__purpose', value: 'Lorem Ipsum' },
        ],
      })

      await multisig.write.submitMulticallTransaction([
        contractAddresses.PublicResolver,
        roleHash,
        'update company constitution',
        constitutionData2,
      ])
    } catch (err: any) {
      console.log(err.message)
      setErrorMessage(err.message)
    }
  }

  return (
    <div style={{ width: '50%', margin: '16px 0' }}>
      <Button onClick={() => makeProposal()}>Make Amendment</Button>
    </div>
  )
}

export default ActionsProposal
