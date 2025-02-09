import styled, { css } from 'styled-components'

import { Typography } from '@ensdomains/thorin'

import { CacheableComponent } from '@app/components/@atoms/CacheableComponent'

import JurisDropdown from './JurisDropdown'
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

const Container = styled.div(
  ({ theme }) => css`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;

    & > div {
      padding: ${theme.space['4']};
      border-bottom: 1px solid ${theme.colors.border};
    }

    & > div:last-of-type {
      border-bottom: none;
    }
  `,
)

const HeaderContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    & > div:first-of-type {
      font-size: ${theme.fontSizes.headingFour};
      font-weight: ${theme.fontWeights.bold};
    }
  `,
)

const ItemsContainer = styled(CacheableComponent)(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${theme.space['4']};

    overflow: hidden;
  `,
)

const RegulatoryTab = ({ registrarType = 'company', breakpoints }: any) => {
  const licenses: { [x: string]: any } = {
    company: {
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

  const jurisSelect = (
    <Container>
      <HeaderContainer>
        <Typography fontVariant="headingFour">
          Agent Legal Wrapper - Jurisdiction Selection
        </Typography>
      </HeaderContainer>

      <JurisDropdown />
    </Container>
  )

  licenseComps.push(jurisSelect)

  Object.keys(licenses[registrarType]).forEach((category: string) => {
    licenseComps.push(
      <LicenseComponent
        licenseData={licenses[registrarType][category]}
        category={category}
        breakpoints={breakpoints}
      />,
    )
  })

  return <LicensesContainer>{licenseComps}</LicensesContainer>
}

export default RegulatoryTab
