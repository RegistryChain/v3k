import React, { useRef, useEffect, useState } from 'react'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { ContentContainer, SubmitButton, ModalContent, Overlay, CloseButton, Input, ModalTitle, ModalText } from './ProfileModalStyles'

interface EmailModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (email: string) => void
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const breakpoints: any = useBreakpoint()
    const modalRef = useRef<HTMLDivElement>(null)
    const [email, setEmail] = useState('')

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        } else {
            document.removeEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <Overlay>
            <ModalContent ref={modalRef} isExpanded={!breakpoints.isMobile}>
                <CloseButton onClick={onClose}>&times;</CloseButton>
                <ContentContainer>
                    <ModalTitle>Watch for updates on your agents!</ModalTitle>
                    <ModalText>Enter your email address and we’ll notify you about any interactions with your agents and V3K updates.</ModalText>

                    <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <SubmitButton
                        disabled={!email}
                        onClick={() => onSubmit(email)}
                    >
                        Submit
                    </SubmitButton>
                </ContentContainer>
            </ModalContent>
        </Overlay>
    )
}

export default EmailModal
