// components/AgentBox.tsx
import { useState } from 'react'
import { FaStar } from 'react-icons/fa'

import AppPlaceholderImage from '@app/assets/app-2.svg'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { normalizeLabel } from '@app/utils/utils'

import {
  Box,
  Category,
  Image,
  ImgContainer,
  Location,
  TextContainer,
  Title,
} from './AgentGridStyles'

export const AgentBox = ({
  onRate,
  index,
  rowHeight,
  imageUrl,
  agentName,
  agentDesc,
  agentDomain,
  rating,
  location,
  isPlaceholder,
}: any) => {
  const router = useRouterWithHistory()
  const [imgSrcValid, setImgSrcValid] = useState(true)

  return (
    <Box onClick={() => router.push('/agent/' + agentDomain)} isPlaceholder={isPlaceholder}>
      {!isPlaceholder && (
        <>
          {imgSrcValid ? (
            <Image
              src={imageUrl}
              height={rowHeight - 32}
              alt="Placeholder"
              onError={() => setImgSrcValid(false)}
            />
          ) : (
            <ImgContainer height={rowHeight - 32}>
              <AppPlaceholderImage />
            </ImgContainer>
          )}
          <TextContainer>
            <Title>{agentName}</Title>
            <Category>{agentDesc}</Category>
            <Location>{location}</Location>
            <div style={{ display: 'flex' }}>
              {rating ? (
                <>
                  <FaStar
                    key={index}
                    style={{
                      fontSize: '17px',
                      margin: '0 2px',
                      color: 'rgb(231, 215, 71)',
                      transition: 'color 0.2s ease, transform 0.2s ease',
                    }}
                  />
                  <span style={{ fontSize: '15px' }}>{rating?.toFixed(2)}</span>
                </>
              ) : null}
            </div>
          </TextContainer>
        </>
      )}
    </Box>
  )
}
