export interface Entity {
  entity__address: string
  entity__code: string
  entity__formation__date: string
  entity__name: string
  description: string
  id: string
  location: string
  partners: Partner[]
  entity__type: string
  address: string
  LEI: string
  entity__registrar: string
}

export interface Partner {
  wallet__address: string
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
