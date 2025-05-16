'use client'

import { useState, useEffect } from 'react'
import { Spinner } from '@ensdomains/thorin'
import v3kLogo from '../assets/v3k_logo.png'
import Image from 'next/image'

interface CachedImageProps {
    src: string
    alt: string
    height: number
}

export function CachedImage({ src, alt, height }: CachedImageProps) {
    const [imgSrc, setImgSrc] = useState<string>("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        let canceled = false
        async function loadAndCache() {
            try {
                if ('caches' in window) {
                    const cache = await caches.open('image-cache')
                    const cached = await cache.match(src)
                    if (cached) {
                        const blob = await cached.blob()
                        if (!canceled) {
                            setImgSrc(URL.createObjectURL(blob))
                            setLoading(false)
                        }
                        return
                    }
                    // not cached yet → fetch + cache
                    const resp = await fetch(src, { mode: 'cors' })
                    if (!resp.ok) throw new Error('Fetch failed')
                    const respClone = resp.clone()
                    cache.put(src, respClone)
                    const blob = await resp.blob()
                    if (!canceled) {
                        setImgSrc(URL.createObjectURL(blob))
                        setLoading(false)
                    }
                } else {
                    // no Cache API support → fall back to normal src
                    setImgSrc(src)
                    setLoading(false)
                }
            } catch (e) {
                if (!canceled) {
                    console.error(e)
                    setError(true)
                    setLoading(false)
                }
            }
        }
        loadAndCache()
        return () => {
            canceled = true
        }
    }, [src])

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', height }}>
                <Spinner size="large" color="accent" />
            </div>
        )
    }

    if (error) {
        console.log('error loading image', src, error)
        return <Image
            src={v3kLogo as any}
            height={height}
            width={height}
            alt={alt}
            style={{ objectFit: 'cover', opacity: "0.2" }}
            onError={() => setError(true)}
            onLoad={() => console.log("imgser", imgSrc)}
        />
    }

    return (
        <Image
            src={imgSrc}
            height={height}
            width={height}
            alt={alt}
            style={{ objectFit: 'cover' }}
            onError={() => setError(true)}
            onLoad={() => console.log("imgser", imgSrc)}
        />
    )
}
