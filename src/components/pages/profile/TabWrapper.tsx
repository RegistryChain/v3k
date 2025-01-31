import styled, { css } from 'styled-components'

export const TabWrapper = styled.div(
  ({ theme }) => css`
    background-color: ${theme.colors.backgroundPrimary};
  `,
)
