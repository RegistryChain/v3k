import type { TFunction } from 'i18next'
import { Address } from 'viem'

import { setTextRecord } from '@ensdomains/ensjs/wallet'

import { VERIFICATION_RECORD_KEY } from '@app/constants/verification'
import { Transaction, TransactionDisplayItem, TransactionFunctionParameters } from '@app/types'

import type { VerificationProtocol } from '../input/VerifyProfile/VerifyProfile-flow'

type Data = {
  name: string
  resolverAddress: Address
  verifier: VerificationProtocol
}

const displayItems = ({ name, verifier }: Data, t: TFunction): TransactionDisplayItem[] => {
  return [
    {
      label: 'name',
      value: name,
      type: 'name',
    },
    {
      label: 'action',
      value: t('transaction.description.removeRecord'),
    },
  ]
}

// TODO: Implement a function that identifies the url for the issuer and only removes that uri

const transaction = async ({ connectorClient, data }: any) => {
  const { name, resolverAddress } = data

  return setTextRecord.makeFunctionData(connectorClient, {
    name,
    key: VERIFICATION_RECORD_KEY,
    value: '',
    resolverAddress,
  })
}
export default {
  displayItems,
  transaction,
  backToInput: true,
} satisfies Transaction<Data>
