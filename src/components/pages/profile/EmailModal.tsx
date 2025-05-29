import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import {
    ContentContainer,
    SubmitButton,
    ModalContent,
    Overlay,
    CloseButton,
    Input,
    ModalTitle,
    ModalText,
} from './ProfileModalStyles'
import { useLoginWithEmail, useWallets } from '@privy-io/react-auth'
import { handleEmail } from '@app/hooks/useExecuteWriteToResolver'
import { Address } from 'viem'

interface EmailModalProps {
    isOpen: boolean
    onClose: () => void
}

const EmailLoginModal = ({ isOpen, onClose }: EmailModalProps) => {
    const breakpoints: any = useBreakpoint()
    const modalRef = useRef<HTMLDivElement>(null)

    const [step, setStep] = useState<'email' | 'code' | 'success'>('email')
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [sending, setSending] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { sendCode, loginWithCode } = useLoginWithEmail()
    const { wallets } = useWallets()
    const address = useMemo(() => wallets[0]?.address, [wallets]) as Address

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        } else {
            document.removeEventListener('mousedown', handleClickOutside)
            reset()
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

    const reset = () => {
        setEmail('')
        setCode('')
        setStep('email')
        setSending(false)
        setVerifying(false)
        setError(null)
    }

    const handleEmailSubmit = async () => {
        try {
            setSending(true)
            await sendCode({ email })
            setStep('code')
        } catch (err: any) {
            console.log(err.message)
            setError('Failed to send code. Try again.')
        } finally {
            setSending(false)
        }
    }

    const handleCodeSubmit = async () => {
        try {
            setVerifying(true)
            await loginWithCode({ code })
            await handleEmail({ email, address })
            setStep('success')
        } catch (err: any) {
            console.log(err.message)
            setError('Invalid code. Please try again.')
        } finally {
            setVerifying(false)
        }
    }

    useEffect(() => {
        setError(null)
    }, [step])

    if (!isOpen) return null

    return (
        <Overlay>
            <ModalContent ref={modalRef} isExpanded={!breakpoints.isMobile}>
                <CloseButton onClick={onClose}>&times;</CloseButton>
                <ContentContainer>
                    <ModalTitle style={{ fontSize: '1.5rem' }}>
                        Add your email to V3K
                    </ModalTitle>

                    {step === 'email' && (
                        <>
                            <ModalText>Enter your email address to add it to your V3K profile.</ModalText>
                            <Input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <SubmitButton onClick={handleEmailSubmit} disabled={!email || sending}>
                                {sending ? 'Sending...' : 'Continue'}
                            </SubmitButton>
                        </>
                    )}

                    {step === 'code' && (
                        <>
                            <ModalText>Enter the code sent to {email}</ModalText>
                            <Input
                                type="text"
                                placeholder="6-digit code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                            <SubmitButton onClick={handleCodeSubmit} disabled={!code || verifying}>
                                {verifying ? 'Verifying...' : 'Submit'}
                            </SubmitButton>
                        </>
                    )}

                    {step === 'success' && (
                        <>
                            <ModalText style={{ textAlign: 'center', color: 'lime', fontWeight: 600 }}>
                                Your email has been successfully added!
                            </ModalText>
                            <SubmitButton onClick={onClose}>Close</SubmitButton>
                        </>
                    )}

                    {error && (
                        <ModalText style={{ color: 'red', marginTop: '1rem' }}>
                            {error}
                        </ModalText>
                    )}
                </ContentContainer>
            </ModalContent>
        </Overlay>
    )
}

export default EmailLoginModal
