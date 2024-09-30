import { useTranslation } from 'react-i18next'

import { Typography } from '@ensdomains/thorin'

import { RecordsSection } from '../../RecordsSection'

export const Review = ({
  name,
  partners,
  profile,
}: {
  name: string
  partners: any
  profile: any
}) => {
  const { t } = useTranslation('profile')

  const texts: any[] = []
  partners.forEach((partner: any, idx: number) => {
    const partnerKey = 'partner__[' + idx + ']__'
    Object.keys(partner).forEach((field) => {
      if (typeof partner[field] === 'boolean') {
        texts.push({ key: partnerKey + field, value: partner[field] ? 'true' : 'false' })
      } else if (field !== 'roles') {
        texts.push({ key: partnerKey + field, value: partner[field] })
      } else {
        partner[field].forEach((role: string) => {
          texts.push({ key: partnerKey + 'is__' + role, value: 'true' })
        })
      }
    })
  })

  Object.keys(profile).forEach((field) => {
    const key = 'company__' + field.split(' ').join('__')
    texts.push({ key, value: profile[field] })
  })

  return (
    <div>
      <RecordsSection texts={texts} />
    </div>
  )
}
