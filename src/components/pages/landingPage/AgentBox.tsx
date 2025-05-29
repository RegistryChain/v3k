// components/AgentBox.tsx
import { useState } from 'react'
import { FaLevelUpAlt, FaRegArrowAltCircleUp, FaRegThumbsUp, FaStar, FaTrash } from 'react-icons/fa'

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
import { CheckCircleSVG, DisabledSVG, Tooltip } from '@ensdomains/thorin'
import { CachedImage } from '@app/hooks/CachedImage'
import { ModPanel } from '@app/components/ModPanel'

export const AgentBox = ({
  onRate,
  hidden,
  index,
  rowHeight,
  imageUrl,
  agentName = "",
  agentDesc = "",
  agentDomain,
  rating = 0,
  location = "",
  isPlaceholder,
  connectedIsAdmin,
  moderateEntity
}: any) => {
  const router = useRouterWithHistory()
  const agentContent = <Box onClick={() => router.push('/agent/' + agentDomain)} style={{ width: "100%", backgroundColor: hidden ? "#ff000047" : "" }} isPlaceholder={isPlaceholder} >
    {!isPlaceholder && (<>
      <div style={{ width: "100%" }}>
        <CachedImage
          src={imageUrl}
          height={rowHeight - 32}
          alt="Placeholder"
        />
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
                    color: '#6a24d6',
                    transition: 'color 0.2s ease, transform 0.2s ease',
                  }}
                />
                <span style={{ fontSize: '15px' }}>{rating?.toFixed(2)}</span>
              </>
            ) : null}
          </div>
        </TextContainer>
      </div>
      <ModPanel connectedIsAdmin={connectedIsAdmin} hidden={hidden} agentDomain={agentDomain} moderateEntity={moderateEntity} />
    </>
    )}
  </Box >

  return agentContent

}
