'use client'

import { useState } from 'react'
import Image from 'next/image'

import v3kLogo from '../assets/v3k_logo.png'
import { getAgentImageUrl } from '../utils/agentImage'

interface CachedImageProps {
  src?: string
  alt: string
  height: number
}

export function CachedImage({ src, alt, height }: CachedImageProps) {
  const [failedSource, setFailedSource] = useState('')
  const imageUrl = getAgentImageUrl(src)
  const showPlaceholder = !imageUrl || failedSource === imageUrl

  // Browser caching also works for hosts that do not allow JavaScript CORS fetches.
  return (
    <Image
      unoptimized
      src={showPlaceholder ? v3kLogo : imageUrl}
      height={height}
      width={height}
      alt={alt}
      style={{ objectFit: 'cover', opacity: showPlaceholder ? 0.2 : 1 }}
      onError={() => setFailedSource(imageUrl)}
    />
  )
}
