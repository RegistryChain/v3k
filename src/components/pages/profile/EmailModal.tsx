'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { useLinkAccount, usePrivy, useWallets, useLogin } from '@privy-io/react-auth'

interface EmailModalProps {
    isOpen: boolean
    onClose: () => void
}

const EmailLoginModal = ({ isOpen, onClose }: EmailModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null)
    const { wallets } = useWallets()

    const { linkEmail } = useLinkAccount()
    const { authenticated, updateEmail, user } = usePrivy()
    const [step, setStep] = useState<'start' | 'success' | 'email'>('start')

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

    const linkNewEmail = async () => {
        // if no email has been linked to account
        if (user?.email) {
            await updateEmail()

        } else {
            await linkEmail()
        }
        // if email has been linked to account
        onClose()
    }
    useEffect(() => {
        if (authenticated && step === "email") {
            try {
                linkNewEmail()
            } catch (err) {
                console.log(err)
            }
        }
    }, [step, authenticated])

    const handleLink = async () => {
        try {
            // Step 2: Authenticate user via wallet
            if (!authenticated) {
                const metamaskWallet = wallets.find(w => w.connectorType === 'injected')
                await metamaskWallet?.loginOrLink();

                // await login({
                //     loginMethods: ['wallet'],
                //     walletChainType: 'ethereum-and-solana',
                //     disableSignup: false
                // })
            } else {
                linkNewEmail()
            }

            setStep('email')
        } catch (err: any) {
            console.error(err)
        }
    }
    useEffect(() => {
        handleLink()
    }, [])

    if (!isOpen) return null

    return null
}

export default EmailLoginModal
