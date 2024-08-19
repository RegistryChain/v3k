import styled, { css } from 'styled-components'

import { CacheableComponent } from '@app/components/@atoms/CacheableComponent'

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

const LicenseTab = ({ registrarType = 'corp' }: any) => {
  const licenses: { [x: string]: any } = {
    corp: {
      tax__ids: [
        { jurisdiction: 'USA', org: 'Internal Revenue Service', licName: 'EIN' },
        { jurisdiction: 'Brazil', org: 'Receita Federal do Brasil', licName: 'CNPJ' },
        { jurisdiction: 'UK', org: 'HMRC', licName: 'UTR' },
        { jurisdiction: 'Germany', org: 'BZSt', licName: 'TIN' },
        { jurisdiction: 'UAE', org: 'FTA', licName: 'TRN' },
      ],
      digital__asset__permits: [
        {
          jurisdiction: 'UAE',
          org: 'Virtual Assets Regulatory Authority of Dubai',
          licName: 'VASP',
        },
        { jurisdiction: 'Australia', org: 'AUSTRAC', licName: 'DCE' },
        { jurisdiction: 'France', org: 'Autorité des Marchés Financiers', licName: 'DASP' },
        { jurisdiction: 'Bahrain', org: 'Central Bank of Bahrain', licName: 'CASP' },
        { jurisdiction: 'Italy', org: 'Organismo Agenti e Mediatori', licName: 'DASP' },
      ],
    },
    civil: {
      official__documentation: [
        { jurisdiction: 'Florida', org: 'Department of Health', licName: 'Marriage Certificate' },
        { jurisdiction: 'Florida', org: 'Secretary of State', licName: 'Apostile' },
      ],
    },
  }

  const licenseComps: any[] = []

  Object.keys(licenses[registrarType]).forEach((category: string) => {
    licenseComps.push(
      <LicenseComponent licenseData={licenses[registrarType][category]} category={category} />,
    )
  })

  return (
    <LicensesContainer>
      Props
      {licenseComps}
    </LicensesContainer>
  )
}

export default LicenseTab
