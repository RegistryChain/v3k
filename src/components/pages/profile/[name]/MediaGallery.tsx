import { executeWriteToResolver, getResolverAddress } from '@app/hooks/useExecuteWriteToResolver'
import { getPrivyWalletClient, pinata } from '@app/utils/utils'
import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Address, namehash, zeroAddress } from 'viem'
import l1abi from '../../../../constants/l1abi.json'
import { FaPencilAlt, FaTrashAlt } from 'react-icons/fa'
import { useWallets } from '@privy-io/react-auth'

interface MediaGalleryProps {
    images: string[]
    video?: string
    onUploadClick: () => void
}

const GalleryContainer = styled.div`
  display: flex;
  height: 50vh;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 16px;
`

const MainMedia = styled.div`
  flex: 2;
  background: #000;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`

const SideColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 4px;
`

const ThumbnailWrapper = styled.div`
  position: relative;
  flex: 1;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;

  &:hover .overlay {
    opacity: 1;
  }
`

const Thumbnail = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`

const ThumbnailOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  color: white;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: center;
  font-size: 20px;
`


const UploadBox = styled.div`
  flex: 1;
  background: #000;
  color: #fff;
  font-size: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
`

const Iframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`

const MediaGallery = ({ isOwner, address, entityId, images, video, onUploadClick }: any) => {
    const hasMedia = video || images.length > 0
    const thumbnails = images.slice(video ? 0 : 1, video ? 3 : 4)
    const [imageFile, setImageFile] = useState(null)
    const [imageIndex, setImageIndex] = useState(0)
    const { wallets } = useWallets();      // Privy hook
    const shouldShowUploadBox = thumbnails.length < 3 && isOwner
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (imageFile && imageIndex >= 0) {
            uploadFile(imageFile, imageIndex)
        }
    }, [imageFile])


    const uploadFile = async (imageFile: any, imageIndex: number) => {
        let url = ""
        try {

            if (imageFile) {
                const { cid } = await pinata.upload.public.file(imageFile)
                url = await pinata.gateways.public.convert(cid);
            }

        } catch (e) {
            console.log('ERROR UPLOADING IMAGE', e);
            if (!url) {
                alert("Trouble uploading file");
            }
        }
        let wallet = null
        let resolverAddress = zeroAddress
        let formationPrep = {}
        try {
            console.log(url, imageFile, imageIndex, wallets)
            wallet = await getPrivyWalletClient(wallets.find(w => w.walletClientType === 'embedded') || wallets[0])
            resolverAddress = await getResolverAddress(wallet, entityId)

            // Use Resolver multicall(setText[])
            formationPrep = {
                functionName: 'setText',
                args: [namehash(entityId), 'image__[' + imageIndex + ']', url],
                abi: l1abi,
                address: resolverAddress,
            }

        } catch (err) {
            console.log(err)
            return
        }

        try {
            const returnVal = await executeWriteToResolver(wallet, formationPrep, null)
            if (returnVal) {
                window.location.reload()
            }
        } catch (err: any) {
            console.log(err)
        }
    };

    if (!hasMedia && !isOwner) return null

    if (!hasMedia && isOwner) {
        return (<MainMedia style={{ width: "250px", height: "250px", borderRadius: '16px' }}>
            <UploadBox style={{ width: '100%', }} onClick={() => {
                onUploadClick()
                setImageIndex(images.length)
                fileInputRef.current?.click()
            }}>
                + Image
            </UploadBox>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] as any)}
            />
        </MainMedia>)
    }

    let imageOverlay = <ThumbnailOverlay className="overlay">
        <div style={{ cursor: "pointer", padding: "15px" }} onClick={() => {
            onUploadClick()
            fileInputRef.current?.click()
            setImageIndex(0)
        }} >
            <FaPencilAlt style={{ color: "gold" }} />
        </div>
        <div style={{ cursor: "pointer", padding: "15px" }} onClick={() => uploadFile(null, 0)} >
            <FaTrashAlt style={{ color: "red" }} />

        </div>
    </ThumbnailOverlay>

    let mainContent = null
    let sideContent: any = (
        <SideColumn>
            {thumbnails.map((img: string, i: number) => (
                <ThumbnailWrapper key={i}>
                    <Thumbnail src={img} />
                    {isOwner && (
                        <ThumbnailOverlay className="overlay">
                            <div style={{ cursor: "pointer", padding: "15px" }} onClick={() => {
                                onUploadClick()
                                setImageIndex(i)
                                fileInputRef.current?.click()
                            }} >
                                <FaPencilAlt style={{ color: "gold" }} />
                            </div>
                            <div style={{ cursor: "pointer", padding: "15px" }} onClick={() => uploadFile(null, i)} >
                                <FaTrashAlt style={{ color: "red" }} />

                            </div>
                        </ThumbnailOverlay>
                    )}
                </ThumbnailWrapper>
            ))}
            {shouldShowUploadBox && (
                <>
                    <UploadBox
                        onClick={() => {
                            onUploadClick()
                            setImageIndex(images.length)
                            fileInputRef.current?.click()
                        }}
                    >
                        +
                    </UploadBox>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] as any)}
                    />
                </>
            )}
        </SideColumn>
    )
    if (video) {
        mainContent = (<MainMedia>
            <Iframe
                src={`https://www.youtube.com/embed/${video.split('?v=')[1]?.split('&')[0]}`}
                allowFullScreen
            />
        </MainMedia>)
    } else if (images.length > 0) {
        mainContent = (<MainMedia>
            <ThumbnailWrapper key={'mainimage'}>
                <Thumbnail src={images[0]} style={{ height: '100%', width: '100%' }} />
                {isOwner && (
                    imageOverlay
                )}
            </ThumbnailWrapper>
        </MainMedia>)
    } else {
        sideContent = null
    }

    return (
        <GalleryContainer>
            {mainContent}
            {sideContent}
        </GalleryContainer>
    )
}

export default MediaGallery
