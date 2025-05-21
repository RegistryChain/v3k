import { executeWriteToResolver, getResolverAddress } from '@app/hooks/useExecuteWriteToResolver'
import { getWalletClient, pinata } from '@app/utils/utils'
import React, { useRef } from 'react'
import styled from 'styled-components'
import { Address, namehash } from 'viem'
import l1abi from '../../../../constants/l1abi.json'

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

const Thumbnail = styled.img`
  flex: 1;
  width: 100%;
  object-fit: cover;
  border-radius: 8px;
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
    const shouldShowUploadBox = thumbnails.length < 3 && isOwner
    const fileInputRef = useRef<HTMLInputElement>(null)



    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            uploadFile(file) // your function to handle the file
        }
    }


    const uploadFile = async (imageFile: any) => {
        let url = ""
        try {

            const { cid } = await pinata.upload.public.file(imageFile)
            url = await pinata.gateways.public.convert(cid);

        } catch (e) {
            console.log(e);
            if (!url) {
                alert("Trouble uploading file");
            }
        }
        const wallet = getWalletClient(address as Address)
        const resolverAddress = await getResolverAddress(wallet, entityId)

        // Use Resolver multicall(setText[])
        const formationPrep: any = {
            functionName: 'setText',
            args: [namehash(entityId), 'image__[' + images.length + ']', url],
            abi: l1abi,
            address: resolverAddress,
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


    if (!hasMedia && isOwner) {
        return (<>
            <UploadBox style={{ width: '100%', height: '50vh', borderRadius: '16px' }} onClick={() => {
                onUploadClick()
                fileInputRef.current?.click()
            }}>
                +
            </UploadBox>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileSelect}
            />
        </>
        )
    }

    return (
        <GalleryContainer>
            <MainMedia>
                {video ? (
                    <Iframe
                        src={`https://www.youtube.com/embed/${video.split('?v=')[1]?.split('&')[0]}`}
                        allowFullScreen
                    />
                ) : (
                    <Thumbnail src={images[0]} style={{ height: '100%', width: '100%' }} />
                )}
            </MainMedia>

            <SideColumn>
                {thumbnails.map((img: any, i: any) => (
                    <Thumbnail key={i} src={img} />
                ))}
                {shouldShowUploadBox && <>
                    <UploadBox onClick={() => {
                        onUploadClick()
                        fileInputRef.current?.click()
                    }}>+</UploadBox>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </>
                }
            </SideColumn>
        </GalleryContainer>
    )
}

export default MediaGallery
