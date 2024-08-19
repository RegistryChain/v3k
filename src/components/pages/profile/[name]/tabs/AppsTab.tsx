import styled, { css } from 'styled-components'
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

const AppsTab = ({ registrarType }: any) => {

  const apps: {[x: string]: any} = {
    corp: {
      payment__processing: [{jurisdiction: "USA", org: "Stripe", serviceName: "Connect"}, {jurisdiction: "USA", org: "Square", serviceName: "Square Online"}],
      vault__management: [{jurisdiction: "Ethereum", org: "Gnosis", serviceName: "Multisig Wallet - SAFE"},{jurisdiction: "Ethereum", org: "Bitbond", serviceName: "Token Tools"}, {jurisdiction: "Ethereum", org: "CoW", serviceName: "AMM Deployer"}]
    },
    civil: {
      wealth__management: [{jurisdiction: "Nevada", org: "Legalzoom", serviceName: "Trust Formation"},{jurisdiction: "Ethereum", org: "EthHeritance", serviceName: "Smart Contract Will"}]
    }
  }
  
  const appComps: any[] = []
  Object.keys(apps[registrarType]).forEach((category: string) => {
    appComps.push(<AppComponent
      appData={apps[registrarType][category]}
      category={category}
    />)
})

  return (
    <AppsContainer>
      {appComps}
    </AppsContainer>
  )
}

export default AppsTab
