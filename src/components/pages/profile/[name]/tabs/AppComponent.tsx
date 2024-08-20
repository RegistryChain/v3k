import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import { match, P } from 'ts-pattern'
import { labelhash, namehash } from 'viem'

import { Button, mq, Tag, Toggle, Typography } from '@ensdomains/thorin'

import { CacheableComponent } from '@app/components/@atoms/CacheableComponent'
import RecordItem from '@app/components/RecordItem'

import { TabWrapper } from '../../TabWrapper'

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

const AppComponent = ({ appData, category }: any) => {
  const { t } = useTranslation('profile')

  return (
    <Container>
      <HeaderContainer>
        <Typography fontVariant="headingFour">
          {category
            .split('__')
            .map((x: any) => x[0].toUpperCase() + x.slice(1))
            .join(' ')}
        </Typography>
      </HeaderContainer>
      {appData.map((x: any, idx: number) => {
        return (
          <ItemsContainer key={x.serviceName + idx}>
            <div style={{ display: 'flex', width: '100%' }}>
              {x.logo ? (
                <Image style={{ marginRight: '12px' }} alt="" width="48" height="48" src={x.logo} />
              ) : (
                <div
                  style={{
                    marginRight: '12px',
                    width: '48px',
                    height: '48px',
                  }}
                ></div>
              )}
              <RecordItem
                itemKey={x.jurisdiction}
                value={[x.org, x.serviceName].join(' - ')}
                type="text"
              />
            </div>
            <div style={{ height: '3rem', alignContent: 'center' }}>
              <Button onClick={() => null}>{t('actions.order')}</Button>
            </div>
          </ItemsContainer>
        )
      })}
    </Container>
  )
}

export default AppComponent
