import React from 'react'

const WatermarkedWrapper = ({ children, watermark }: any) => {
  return (
    <div style={styles.wrapper}>
      <div style={{ ...styles.watermark, backgroundImage: `url(${watermark})` }} />
      <div style={styles.content}>{children}</div>
    </div>
  )
}

const styles: any = {
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundRepeat: 'repeat',
    backgroundSize: '100px 120px', // Adjust the size as needed
    opacity: 0.8, // Adjust transparency to make it subtle
    pointerEvents: 'none', // Ensures the watermark doesn't interfere with interactions
    zIndex: 1,
  },
  content: {
    position: 'relative',
    zIndex: 2,
    padding: '20px', // Adjust padding as needed for your layout
  },
}

export default WatermarkedWrapper
