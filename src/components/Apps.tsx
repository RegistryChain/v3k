import { useEffect, useState } from 'react'
import styled from 'styled-components'

import { getEntitiesList } from '@app/hooks/useExecuteWriteToResolver'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'

// Breakpoints for responsive design
const breakpoints = {
  xs: '@media (max-width: 576px)', // Mobile breakpoint
}

// Styled components
const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px;
`

const Row = styled.div`
  display: flex;
  width: 100%;
  gap: 16px;
  margin-bottom: 16px;

  ${breakpoints.xs} {
    flex-direction: column;
    gap: 8px;
  }
`

const Box = styled.div<any>`
  flex: 1 1 calc(33.333% - 16px); // 3 boxes per row by default
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
    flex: 1 1 100%; // 1 box per row on mobile
  }
`

const Index = styled.div`
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

const Image = styled.img`
  width: ${({ height }) => height}px;
  height: ${({ height }) => height}px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 16px;
`

const TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const Title = styled.div`
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
`

const Category = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
`

const Rating = styled.div`
  font-size: 12px;
  color: #888;
`

// Box component
const ContentBox = ({ index, rowHeight, imageUrl, text1, text2, text3, isPlaceholder }: any) => {
  const router = useRouterWithHistory()
  return (
    <Box
      onClick={() => router.push('/agent/' + text1 + '.ai.registrychain.com')}
      isPlaceholder={isPlaceholder}
    >
      {!isPlaceholder && (
        <>
          <Image src={imageUrl} height={rowHeight - 32} alt="Placeholder" />{' '}
          {/* Adjust height for padding */}
          <TextContainer>
            <Title>{text1}</Title>
            <Category>{text2}</Category>
            <Rating>{text3}</Rating>
          </TextContainer>
        </>
      )}
    </Box>
  )
}

// Main component
const BoxGrid = ({ rowHeight = 120, boxes }: any) => {
  // Calculate the number of rows needed
  const rows = []
  for (let i = 0; i < boxes.length; i += 3) {
    const rowBoxes = boxes.slice(i, i + 3)
    // Add placeholders if the row has less than 3 boxes
    while (rowBoxes.length < 3) {
      rowBoxes.push({ isPlaceholder: true })
    }
    rows.push(rowBoxes)
  }

  return (
    <Container>
      {rows.map((row, rowIndex) => (
        <Row key={rowIndex}>
          {row.map((box: any, boxIndex: any) => (
            <ContentBox
              key={boxIndex}
              index={rowIndex * 3 + boxIndex + 1}
              rowHeight={rowHeight}
              imageUrl={box.entity__image}
              text1={box.name}
              text2={box.entity__description}
              text3={(Math.random() * 5).toFixed(2) + '★'}
              isPlaceholder={box.isPlaceholder}
            />
          ))}
        </Row>
      ))}
    </Container>
  )
}

// Example usage
const Apps = () => {
  const [agents, setAgents] = useState([])

  const getAgents = async () => {
    const entities = await getEntitiesList({
      registrar: 'AI',
      nameSubstring: '',
      page: 0,
      sortDirection: 'desc',
      sortType: 'entity__formation__date',
    })

    setAgents(entities)
  }

  useEffect(() => {
    try {
      getAgents()
    } catch (err) {}
  }, [])

  return <BoxGrid boxes={agents} />
}

export default Apps
