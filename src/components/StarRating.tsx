import { useState } from 'react'
import { FaStar } from 'react-icons/fa'

export default function StarRating({ rating, onRate }: any) {
  const [hoverIndex, setHoverIndex] = useState<any>(null)
  const [selectedIndex, setSelectedIndex] = useState<any>(rating - 1)

  const handleClick = (index: Number, event: any) => {
    event.stopPropagation()
    setSelectedIndex(index)
    onRate(index)
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '90px',
        height: '50px',
        cursor: 'pointer',
      }}
      onMouseLeave={() => {
        setHoverIndex(null)
        // setSelectedIndex(rating - 1)
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <FaStar
          key={index}
          style={{
            fontSize: '25px',
            margin: '0 2px',
            color: index <= (hoverIndex !== null ? hoverIndex : selectedIndex) ? 'yellow' : 'gray',
            transition: 'color 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={() => setHoverIndex(index)}
          onClick={(event) => handleClick(index, event)}
        />
      ))}
    </div>
  )
}
