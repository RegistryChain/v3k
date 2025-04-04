import styled, { css } from 'styled-components'

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

const LicenseComponent = ({ licenseData, category, breakpoints }: any) => {
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
      {licenseData.map((x: any, idx: number) => {
        return (
          <ItemsContainer key={x.licName + idx}>
            <RecordItem
              itemKey={x.jurisdiction}
              value={[x.org, x.licName].join(' - ')}
              type="text"
            />
            <div
              style={{
                height: '3rem',
                width: breakpoints.xs && !breakpoints.sm ? '100%' : '80px',
                alignContent: 'center',
              }}
            >
              <Button style={{ cursor: 'not-allowed' }} disabled onClick={() => null}>
                Order
              </Button>
            </div>
          </ItemsContainer>
        )
      })}
    </Container>
  )
}

export default LicenseComponent
