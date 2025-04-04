import { useEffect, useState } from 'react'
import { FaStar } from 'react-icons/fa'

export default function StarRating({ rating, onRate }: any) {
  const [hoverIndex, setHoverIndex] = useState<any>(null)
  const [selectedIndex, setSelectedIndex] = useState<any>(rating - 1)

  useEffect(() => {
    setSelectedIndex(rating - 1)
  }, [rating])

  const handleClick = (index: Number, event: any) => {
    event.stopPropagation()
    setSelectedIndex(index)
    onRate(index)
  }

  const offHover = <div style={{ display: "flex" }} onMouseEnter={() => setHoverIndex(rating)}>
    <FaStar
      key={'FaStar'}
      style={{
        fontSize: '16px',
        margin: '3px 2px',
        color: rating > 0 ? 'yellow' : "grey",
        transition: 'color 0.2s ease, transform 0.2s ease',
      }}
    />
    <span style={{ fontSize: '15px' }}>{rating > 0 ? rating?.toFixed(2) : "0.00"}</span>
  </div>

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100px',
        height: '50px',
        cursor: 'pointer',
      }}
      onMouseLeave={() => {
        setHoverIndex(null)
        // setSelectedIndex(rating - 1)
      }}
      onClick={(event) => event.stopPropagation()}
    >
      {hoverIndex === null ? offHover : [1, 2, 3, 4, 5].map((index) => {
        return (
          <FaStar
            key={index}
            style={{
              fontSize: '25px',
              margin: '0 2px',
              color:
                index <= (hoverIndex !== null ? hoverIndex : selectedIndex) ? 'yellow' : 'gray',
              transition: 'color 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={() => setHoverIndex(index)}
            onClick={(event) => handleClick(index, event)}
          />
        )
      })}
    </div>
  )
}
