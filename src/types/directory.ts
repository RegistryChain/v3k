export interface Entity {
  company__address: string
  company__entity__code: string
  company__formation__date: string
  company__name: string
  company__status__GLEIF: string
  description: string
  id: string
  location: string
  partners: Partner[]
  company__type: string
  address: string
  LEI: string
  company__registrar: string
}

export interface Partner {
  wallet__address: string;
  name: string;
  [key: string]: {
    label?: string;
    oldValue?: string | string[];
    setValue?: string | string[];
  } | string | undefined;
}