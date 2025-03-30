import type { TFunction } from 'react-i18next'

import { getPrice } from '@ensdomains/ensjs/public'
import { RegistrationParameters } from '@ensdomains/ensjs/utils'
import { registerName } from '@ensdomains/ensjs/wallet'

import { Transaction, TransactionDisplayItem, TransactionFunctionParameters } from '@app/types'
import { calculateValueWithBuffer } from '@app/utils/utils'

type Data = RegistrationParameters
const now = Math.floor(Date.now())
const displayItems = (
  { name, duration }: Data,
  t: TFunction<'translation', undefined>,
): TransactionDisplayItem[] => [
  {
    label: 'name',
    value: name,
    type: 'name',
  },
  {
    label: 'action',
    value: t('transaction.description.registerName'),
  },
]

const transaction = async ({ client, connectorClient, data }: any) => {
  const price = await getPrice(client, { nameOrNames: data.name, duration: data.duration })
  const value = price.base + price.premium
  const valueWithBuffer = calculateValueWithBuffer(value)

  // if (isLegacyRegistration(data))
  //   return legacyRegisterName.makeFunctionData(connectorClient, {
  //     ...makeLegacyRegistrationParams(data),
  //     value: valueWithBuffer,
  //   })
  return registerName.makeFunctionData(connectorClient, {
    ...data,
    value: valueWithBuffer,
  })
}

export default { displayItems, transaction } satisfies Transaction<Data>
