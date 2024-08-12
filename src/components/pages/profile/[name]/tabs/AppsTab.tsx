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
    financial: {"Financial-App-1": {fulillmentTime: "2 days", price: "2 ETH"}},
    legal: {"Legal-App-1": {fulillmentTime: "3 Hours", price: "$300"}},
    governance: {"Governance-App-1": {fulillmentTime: "Immediate", price: ".5 ETH"}},
    treasury: {"Treasury-App-1": {fulillmentTime: "20 Minutes", price: "32 ETH"}}
  }

  const { ownerData, wrapperData, isCachedData, profile } = nameDetails
  
  const appComps: any[] = []
  
  Object.keys(apps).forEach((category: string) => {
    Object.keys(apps[category]).forEach(app => {
      appComps.push(<AppComponent
        name={name}
        entityAppData={wrapperData}
        app={app}
        appData={apps[category][app]}
        category={category}
      />)
    })
  })

  return (
    <AppsContainer>
      {appComps}
    </AppsContainer>
  )
}

export default AppsTab
