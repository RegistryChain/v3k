import styled, { css } from 'styled-components'

import { breakpoints } from '@ensdomains/thorin/dist/types/tokens'

import { CacheableComponent } from '@app/components/@atoms/CacheableComponent'

import AppComponent from './AppComponent'

const AppsContainer = styled(CacheableComponent)(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    width: 100%;

    gap: ${theme.space['4']};
  `,
)

const AppsTab = ({ registrarType = 'company', breakpoints }: any) => {
  const apps: { [x: string]: any } = {
    company: {
      payment__processing: [
        {
          jurisdiction: 'USA',
          org: 'Stripe',
          serviceName: 'Connect',
          logo: 'https://www.svgrepo.com/show/331592/stripe-v2.svg',
        },
        {
          jurisdiction: 'USA',
          org: 'Square',
          serviceName: 'Square Online',
          logo: 'https://cdn-icons-png.flaticon.com/512/39/39003.png',
        },
      ],
      vault__management: [
        {
          jurisdiction: 'Ethereum',
          org: 'Gnosis',
          serviceName: 'Multisig Wallet - SAFE',
          logo: 'https://pbs.twimg.com/profile_images/1643941027898613760/gyhYEOCE_400x400.jpg',
        },
        {
          jurisdiction: 'Ethereum',
          org: 'Bitbond',
          serviceName: 'Token Tools',
          logo: 'https://pbs.twimg.com/profile_images/1617556305404649475/VcergjNT_400x400.png',
        },
        {
          jurisdiction: 'Ethereum',
          org: 'CoW',
          serviceName: 'AMM Deployer',
          logo: 'https://pbs.twimg.com/profile_images/1805606768266924032/nzzLCHXW_400x400.jpg',
        },
      ],
    },
    civil: {
      wealth__management: [
        {
          jurisdiction: 'Nevada',
          org: 'Legalzoom',
          serviceName: 'Trust Formation',
          logo: 'https://uspto.report/TM/90025377/mark.png',
        },
        {
          jurisdiction: 'Ethereum',
          org: 'EthHeritance',
          serviceName: 'Smart Contract Will',
          logo: '',
        },
      ],
    },
  }

  const appComps: any[] = []
  Object.keys(apps[registrarType]).forEach((category: string) => {
    appComps.push(
      <AppComponent
        breakpoints={breakpoints}
        appData={apps[registrarType][category]}
        category={category}
      />,
    )
  })

  return <AppsContainer>{appComps}</AppsContainer>
}

export default AppsTab
