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
  source,
  erc8004AgentId,
  rating = 0,
  location = "",
  isPlaceholder,
  connectedIsAdmin,
  moderateEntity
}: any) => {
  const router = useRouterWithHistory()
  const agentContent = <Box as={isPlaceholder ? 'div' : 'a'} href={agentDomain ? '/agent/' + encodeURIComponent(agentDomain) : undefined} style={{ width: "100%", color: 'inherit', textDecoration: 'none', backgroundColor: hidden ? "#ff000047" : "" }} isPlaceholder={isPlaceholder} >
    {!isPlaceholder && (<>
      <div style={{ width: "100%" }}>
        <CachedImage
          src={imageUrl}
          height={rowHeight - 32}
          alt={agentName}
        />
        <TextContainer>
          <Title>{agentName}</Title>
          {source === 'erc8004' && <span style={{ color: '#6a24d6', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>ERC-8004{erc8004AgentId != null ? ` · #${erc8004AgentId}` : ''}</span>}
          <Location style={{ overflowWrap: 'anywhere', marginBottom: '6px' }}>{agentDomain}</Location>
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
