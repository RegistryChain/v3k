import styled, { css } from "styled-components";

export const EmptyDetailContainer = styled.div(
  ({ theme }) => css`
    padding: ${theme.space['4']};
    display: flex;
    justify-content: center;
    align-items: center;
    color: #333;
  `,
)

export const EllipsisContainer = styled.div`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 200px;`

export const DirectionButton = styled.button<{ $active: boolean }>(
  ({ theme, $active }) => css`
    transition: all 0.15s ease-in-out;
    width: ${theme.space['10']};
    flex: 0 0 ${theme.space['10']};
    height: ${theme.space['10']};
    border-radius: ${theme.space['2']};
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    svg {
      display: block;
      width: ${theme.space['3']};
      height: ${theme.space['3']};
      path {
        fill: ${$active ? theme.colors.accent : theme.colors.textTertiary};
      }
    }
    &:hover {
      background-color: ${theme.colors.border};
    }
  `,
)

export const Status = styled.span<{ $color: string }>`
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  gap: 0.2rem;
  text-transform: capitalize;

  &::after {
    content: '';
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    background-color: ${({ $color }) => $color};
    border-radius: 50%;
  }
  `

export const Container = styled.div`
  padding: 1rem 0;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 0.2rem;
  color: #333;
  `

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
  `

export const AppContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  `

export const Image = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  color: #CFD8DC;
  `

export const AppsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  `

export const Rating = styled.div`
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  `

export const StarContainer = styled.div`
  width: 16px;
  height: 16px;
  display: flex;
  color: green;
  `