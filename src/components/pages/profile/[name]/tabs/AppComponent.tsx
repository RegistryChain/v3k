import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { match, P } from 'ts-pattern'
import { labelhash, namehash } from 'viem'

import { mq, Tag, Typography } from '@ensdomains/thorin'

import { CacheableComponent } from '@app/components/@atoms/CacheableComponent'
import { NFTWithPlaceholder } from '@app/components/NFTWithPlaceholder'
import { Outlink } from '@app/components/Outlink'
import RecordItem from '@app/components/RecordItem'
import { useChainName } from '@app/hooks/chain/useChainName'
import { useContractAddress } from '@app/hooks/chain/useContractAddress'
import { NameWrapperState } from '@app/hooks/fuses/useFusesStates'
import { Profile } from '@app/types'
import { checkETH2LDFromName, makeEtherscanLink } from '@app/utils/utils'
import { TabWrapper } from '../../TabWrapper'

type Props = {
  name: string
  entityAppData?: any
  app: string
  category: string
  appData: any
}

const Container = styled(TabWrapper)(
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

    ${mq.sm.min(css`
      & > div {
        padding: ${theme.space['4']} ${theme.space['6']};
      }

      & > div:first-of-type {
        padding: ${theme.space['6']};
      }
    `)}
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

const IdsContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    gap: ${theme.space['4']};

    ${mq.sm.min(css`
      gap: ${theme.space['2']};
    `)}
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

    ${mq.sm.min(css`
      flex-direction: row;
    `)}
  `,
)

const NftBox = styled(NFTWithPlaceholder)(
  ({ theme }) => css`
    max-width: 100%;
    aspect-ratio: 1;

    ${mq.sm.min(css`
      max-width: ${theme.space['36']};
      max-height: ${theme.space['36']};
    `)}
  `,
)

const getFuseStateFromWrapperData = (entityAppData?: any): NameWrapperState =>
  match(entityAppData)
    .with(P.nullish, () => 'unwrapped' as const)
    .with({ fuses: { child: { CANNOT_UNWRAP: true } } }, () => 'locked' as const)
    .with({ fuses: { parent: { PARENT_CANNOT_CONTROL: true } } }, () => 'emancipated' as const)
    .otherwise(() => 'wrapped')

const AppComponent = ({ name, entityAppData, app, appData, category }: Props) => {
  const { t } = useTranslation('profile')
  const isWrapped = false;

  const networkName = useChainName()
  const nameWrapperAddress = useContractAddress({ contract: 'ensNameWrapper' })
  const registrarAddress = useContractAddress({ contract: 'ensBaseRegistrarImplementation' })

  const status: NameWrapperState = getFuseStateFromWrapperData(entityAppData)
  const is2ldEth = checkETH2LDFromName(name)

  const hex = isWrapped ? namehash(name) : labelhash(name.split('.')[0])
  const tokenId = BigInt(hex).toString(10)

  const contractAddress = isWrapped ? nameWrapperAddress : registrarAddress


  return (
    <Container>
      <HeaderContainer>
        <Typography fontVariant="headingFour">{app}</Typography>

          <Tag colorStyle="greySecondary">{category}</Tag>
      </HeaderContainer>
      {/* {hasToken && (
        <ItemsContainer data-testid="token-ids">
          <IdsContainer>
            <RecordItem itemKey={t('tabs.metadata.token.hex')} value={hex} type="text" />
            <RecordItem itemKey={t('tabs.metadata.token.decimal')} value={tokenId} type="text" />
          </IdsContainer>
          <NftBox id="nft" name={name} />
        </ItemsContainer>
      )} */}
      <ItemsContainer>
        <RecordItem
          itemKey={appData.fulillmentTime}
          value={appData.price}
          type="text"
        />
      </ItemsContainer>
    </Container>
  )
}

export default AppComponent
