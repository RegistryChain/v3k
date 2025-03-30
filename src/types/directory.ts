export interface Entity {
  birthdate: string
  name: string
  description: string
  id: string
  location: string
  partners: Partner[]
  keywords: string
  address: string
  legalentity__lei: string
  registrar: string
}

export interface Partner {
  walletaddress: string
  name: string
  [key: string]:
    | {
        label?: string
        oldValue?: string | string[]
        setValue?: string | string[]
      }
    | string
    | undefined
}
