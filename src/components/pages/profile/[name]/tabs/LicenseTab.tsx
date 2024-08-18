import styled, { css } from 'styled-components'

import { CacheableComponent } from '@app/components/@atoms/CacheableComponent'
import type { useAbilities } from '@app/hooks/abilities/useAbilities'
import { useNameDetails } from '@app/hooks/useNameDetails'

import LicenseComponent from './LicenseComponent'

const LicensesContainer = styled(CacheableComponent)(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    width: 100%;

    gap: ${theme.space['4']};
  `,
)

type Props = {
  name: string
  nameDetails: ReturnType<typeof useNameDetails>
  abilities: ReturnType<typeof useAbilities>['data']
}

const LicenseTab = ({ name, nameDetails, abilities }: Props) => {

  const licenses: {[x: string]: any} = {
    tax__ids: [{country: "USA", org: "Internal Revenue Service", licName: "EIN"}, {country: "Brazil", org: "Receita Federal do Brasil", licName: "CNPJ"}, {country: "UK", org: "HMRC", licName: "UTR"}, {country: "Germany", org: "BZSt", licName: "TIN"}, {country: "UAE", org: "FTA", licName: "TRN"}],
    digital__asset__permits: [{country: "UAE", org: "Virtual Assets Regulatory Authority of Dubai", licName: "VASP"}, {country: "Australia", org: "AUSTRAC", licName: "DCE"}, {country: "France", org: "Autorité des Marchés Financiers", licName: "DASP"}, {country: "Bahrain", org: "Central Bank of Bahrain", licName: "CASP"}, {country: "Italy", org: "Organismo Agenti e Mediatori", licName: "DASP"}]    
  }
    
  const licenseComps: any[] = []
  
  Object.keys(licenses).forEach((category: string) => {
      licenseComps.push(<LicenseComponent
        licenseData={licenses[category]}
        category={category}
      />)
  })

  return (
    <LicensesContainer>
      {licenseComps}
    </LicensesContainer>
  )
}

export default LicenseTab
