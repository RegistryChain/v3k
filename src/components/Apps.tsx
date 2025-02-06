import React from 'react'
import styled from 'styled-components'

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
  return (
    <Box isPlaceholder={isPlaceholder}>
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
              imageUrl={box.imageUrl}
              text1={box.name}
              text2={box.category}
              text3={box.rating}
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
  const boxes = [
    {
      imageUrl:
        'https://meme-coin-images-prd.s3.us-east-2.amazonaws.com/Generation-Image-t-9416227-d-1732882802876.webp',
      name: 'Agent ABC',
      category: 'Social',
      rating: '4.5★',
    },
    {
      imageUrl:
        'https://meme-coin-images-prd.s3.us-east-2.amazonaws.com/Generation-Image-t-11683169-d-1734641373288.webp',
      name: 'NormAI',
      category: 'Social',
      rating: '3.7★',
    },
    {
      imageUrl:
        'https://s3.us-east-2.amazonaws.com/bros-uploads-prod/db39cad1-e31c-4059-b5fe-e87fd653b3d1/image_uploads/14f2498e-61b0-4387-ace6-760be8e29010/f4d8e1a1-9638-4422-9bab-e5540c72e5e1.jpeg?Content-Type=text%2Fplain&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAVIVFKAZOEONW2FKO%2F20250205%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20250205T214414Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDUaCXVzLWVhc3QtMiJHMEUCIHaZkFju9WPmJTiaPufcO2ES%2BXnhvImyF5ynVdF9vY3BAiEA%2BOO8Co5mMVg9yFshGxbt3z%2FPHQNEPG5XkqI4aBbUKkkq%2BwQITxABGgwzNjIxOTc2ODE3NTYiDM3If7xjMVkdRotbECrYBJjjPrw33auRh2OHNMc81zFFoINE9BEVZ9YfexLK1HdTF%2FIIqCDMANdwPhD2a6giRgh94NDE9iE4z0sWDW7OvWdJi2aGpzhbERUz0hRW%2B8XWUyRhoqcV8sGDa6DqRg5ZVfuB8S%2BrdsC%2BONm4w7ICKZmlU1NxdavW%2FrmzPp3WhwuFOdZysVEhxzSx6doDh5vMCeBxKRNVuDbG8vOlYlGmfAmv7Kw8JJQIft%2B1E0bsgylfH9Mzg3vjJSbpLTvlp5vAhVo1N5VUi9LWlhrmL6OU%2F73o9HzJQk3MOqOmViHBTgmreRRQfcvmnS99erhawXCcJtoR6YUXbbOR5nMxQNfvG4Gm1ZLe6EyyKuhaskjbGV8KQ8DQ8crlDQTxdn8g82wD%2FUhWFMRoY7dKx%2Fpk%2FCU3CKPnNbaf%2BLHKCeFme3KglnNILIAeJg5FFRFF8Ig7hO%2Bu%2BMJ7CNKZX0t1CyntNocdmJrdJKgjhO3kIv7QqDu%2BKQ0MWNR0uHzPfKqPsyKCj9uxhkDFNFrKFEXVCIPkjprVu3FS97j1fCx%2FkLuf1PLbZH%2BSwFAXIvlhNGqmCO8vpvWZPNvM7fCPSB4juOmO0rdVcKoTdYXw5CmVtks82rHyd35qfkV8GCYBK75H6d2AuxmyFE8%2F4ZiNuJE3Hz3%2Fyk0LBcHS2ihDeIWleacgr%2FiyRSZWUgZLODDrL9JUi0E1cW%2F4VNLqs3rRaMwzu3w67TS2tel4TMRvrm6YBtAHu2RgigVfHCd1rbPbV%2FW81vuoXVCra3ikg8zh1EQET8Fp%2FvZvPZZxw6EkV7InyjCKsI%2B9BjqaAa43IXgyKt4mEjas4yqIxgTBO9caamDXpjUBEy8RYUQHipEK8bRj95flGIhg9%2BG5yBPRGLHUB3CBboMfWx0YW%2FY3FhINBsengwRTn7ig86WAw58cS1J0Fr4uOkiFEr1poZMh0kdebQcc5oPBpA0YXX3d%2FaA2Kw%2B6VbyPH6YvZYXGBYBStAcLwNez%2BsDhrfhrriIQEzAbAQ0dp04%3D&X-Amz-SignedHeaders=host&X-Amz-Signature=c78f1bacf718d0997eb605d7cf75cdd13968484fde64e2b68d3827355ede111c',
      name: 'Tess345',
      category: 'Scraper',
      rating: '4.8★',
    },
    {
      imageUrl:
        'https://meme-coin-images-prd.s3.us-east-2.amazonaws.com/Generation-Image-t-9322891-d-1732832508109.webp',
      name: 'SuperShibaSun',
      category: 'Meme',
      rating: '2.2★',
    },
  ]

  return <BoxGrid boxes={boxes} />
}

export default Apps
