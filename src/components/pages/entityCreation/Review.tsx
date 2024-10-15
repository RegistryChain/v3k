import { useTranslation } from 'react-i18next'

import { RecordsSection } from '../../RecordsSection'

export const Review = ({
  name,
  partners,
  profile,
  setErrorMessage,
}: {
  name: string
  partners: any
  profile: any
  setErrorMessage: any
}) => {
  const { t } = useTranslation('profile')
  const texts: any[] = []
  try {
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
  } catch (err: any) {
    setErrorMessage(err.details)
  }

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
