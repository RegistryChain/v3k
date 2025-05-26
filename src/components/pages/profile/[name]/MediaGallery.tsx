import { uploadIpfsImageSaveToResolver } from '@app/utils/utils'
import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { FaPencilAlt, FaTrashAlt } from 'react-icons/fa'
import { useWallets } from '@privy-io/react-auth'

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
        await uploadIpfsImageSaveToResolver(imageFile, imageIndex, wallets, entityId)
        window.location.reload()
    };

    if (!hasMedia && !isOwner) return null

    let imageUploaderHidden = null
    if (isOwner) {
        imageUploaderHidden = <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] as any)}
        />
    }

    if (!hasMedia && isOwner) {
        return (<MainMedia style={{ width: "250px", height: "250px", borderRadius: '16px' }}>
            {imageUploaderHidden}
            <UploadBox style={{ width: '100%', }} onClick={() => {
                onUploadClick()
                setImageIndex(images.length)
                fileInputRef.current?.click()
            }}>
                + Image
            </UploadBox>
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
        mainContent = (
            <MainMedia>
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
            {imageUploaderHidden}
            {mainContent}
            {sideContent}
        </GalleryContainer>
    )
}

export default MediaGallery
