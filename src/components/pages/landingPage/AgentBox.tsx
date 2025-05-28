// components/AgentBox.tsx
import { useState } from 'react'
import { FaLevelUpAlt, FaRegArrowAltCircleUp, FaRegThumbsUp, FaStar, FaTrash } from 'react-icons/fa'

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
import { CheckCircleSVG, DisabledSVG, Tooltip } from '@ensdomains/thorin'
import { CachedImage } from '@app/hooks/CachedImage'

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
      {connectedIsAdmin ? (<div style={{ width: "25px", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <DisabledSVG style={{ color: "blue", margin: "10px 6px" }} onClick={() => moderateEntity(agentDomain, 1)} />
        <CheckCircleSVG style={{ color: "lime", margin: "10px 6px" }} onClick={() => moderateEntity(agentDomain, 2)} />
        <FaTrash style={{ color: "red", margin: "10px 6px" }} onClick={() => moderateEntity(agentDomain, 3)} />
        <FaRegArrowAltCircleUp style={{ color: "black", margin: "10px 6px" }} onClick={() => moderateEntity(agentDomain, 4)} />
        <FaRegThumbsUp style={{ color: "gold", margin: "10px 6px" }} onClick={() => moderateEntity(agentDomain, 5)} />
      </div>) : null}
    </>
    )}
  </Box >

  return hidden ? <Tooltip content={"This agent is currently hidden"}>
    {agentContent}
  </Tooltip> : agentContent

}
