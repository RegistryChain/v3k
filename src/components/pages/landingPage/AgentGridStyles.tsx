import styled from 'styled-components'

export const breakpoints = {
  xs: '@media (max-width: 576px)',
}

export const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
`

export const Row = styled.div`
  display: flex;
  width: 100%;
  gap: 16px;
  margin-bottom: 16px;

  ${breakpoints.xs} {
    flex-direction: column;
    gap: 8px;
  }
`

export const Box = styled.div<any>`
  flex: 1 1 calc(33.333% - 16px);
  display: flex;
  cursor: pointer;
  align-items: center;
  background-color: ${({ isPlaceholder }: any) => (isPlaceholder ? 'transparent' : '#f0f0f0')};
  border-radius: 8px;
  padding: 16px;
  box-shadow: ${({ isPlaceholder }: any) =>
    isPlaceholder ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.1)'};
  visibility: ${({ isPlaceholder }: any) => (isPlaceholder ? 'hidden' : 'visible')};

  ${breakpoints.xs} {
    flex: 1 1 100%;
  }

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    background-color: ${({ isPlaceholder }: any) => (isPlaceholder ? 'transparent' : '#f8f8f8')};
  }
`

export const Index = styled.div`
  font-size: 24px;
  font-weight: bold;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: #333;
  color: white;
  border-radius: 50%;
`

export const Image = styled.img`
  width: ${({ height }) => height}px;
  height: ${({ height }) => height}px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 16px;
`

export const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`

export const Title = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
`

export const Category = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
`

export const Location = styled.div`
  font-size: 12px;
  color: #888;
`

export const ImgContainer = styled.div<{ height: number }>`
  width: ${({ height }) => height}px;
  height: ${({ height }) => height}px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  color: #666;
`
