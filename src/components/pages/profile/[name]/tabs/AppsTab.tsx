import styled, { css } from 'styled-components'

import { CacheableComponent } from '@app/components/@atoms/CacheableComponent'
import type { useAbilities } from '@app/hooks/abilities/useAbilities'
import { useNameDetails } from '@app/hooks/useNameDetails'

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

type Props = {
  name: string
  nameDetails: ReturnType<typeof useNameDetails>
  abilities: ReturnType<typeof useAbilities>['data']
}

const AppsTab = ({ name, nameDetails, abilities }: Props) => {

  const apps: {[x: string]: any} = {
    payment__processing: [{country: "USA", org: "Stripe", idName: "Connect"}, {country: "USA", org: "Square", idName: "Square Online"}],
    vault__management: [{country: "Ethereum", org: "Gnosis", idName: "Multisig Wallet - SAFE"},{country: "Ethereum", org: "Bitbond", idName: "Token Tools"}, {country: "Ethereum", org: "CoW", idName: "AMM Deployer"}]
  }
  
  const appComps: any[] = []
  Object.keys(apps).forEach((category: string) => {
    appComps.push(<AppComponent
      appData={apps[category]}
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
