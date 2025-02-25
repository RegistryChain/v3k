// components/AgentGrid.tsx
import { AgentBox } from './AgentBox'
import { Container, Row } from './AgentGridStyles'

export const AgentGrid = ({ rowHeight = 120, boxes, onRate }: any) => {
  const rows = []
  for (let i = 0; i < boxes.length; i += 3) {
    const rowBoxes = boxes.slice(i, i + 3)
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
            <AgentBox
              key={boxIndex}
              onRate={(x: any) => onRate(box.address, x + 1)}
              index={rowIndex * 3 + boxIndex + 1}
              rowHeight={rowHeight}
              imageUrl={box.avatar}
              agentName={box.name}
              agentDomain={box.domain}
              agentDesc={
                box.description?.slice(0, 50) + (box.description?.length > 50 ? '...' : '')
              }
              location={box.location}
              rating={box.rating}
              isPlaceholder={box.isPlaceholder}
            />
          ))}
        </Row>
      ))}
    </Container>
  )
}
