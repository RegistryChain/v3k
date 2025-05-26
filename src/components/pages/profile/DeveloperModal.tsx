import React, { useRef, useEffect, useState } from 'react'
import {
    ModalContent,
    Overlay,
    CloseButton,
    SubmitButton,
    ContentContainer,
    ModalTitle,
    ModalText,
    Input,
    StepButton,
    AltLink,
    BackButton,
} from './ProfileModalStyles'
import styled from 'styled-components'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import JurisDropdown from './[name]/tabs/JurisDropdown'
import { executeWriteToResolver, getRecordData, getResolverAddress } from '@app/hooks/useExecuteWriteToResolver'
import { normalizeLabel } from '@app/utils/utils'
import { encodeFunctionData, labelhash, namehash, zeroAddress } from 'viem'
import { normalize } from 'viem/ens'
import l1abi from '../../../constants/l1abi.json'

interface DeveloperRegisterModalProps {
    isOpen: boolean
    onClose: () => void
    wallet: any
    domain: string
    partners: any[]
    setErrorMessage: (e: string) => void
}

type Step = 'initial' | 'useEntityId' | 'noEntityId' | 'naturalPerson'

const DeveloperRegisterModal: React.FC<DeveloperRegisterModalProps> = ({
    isOpen,
    onClose,
    wallet,
    domain,
    partners,
    setErrorMessage,
}) => {
    const breakpoints: any = useBreakpoint()
    const modalRef = useRef<HTMLDivElement>(null)
    const [step, setStep] = useState<Step>('initial')
    const [entityId, setEntityId] = useState('')
    const [naturalName, setNaturalName] = useState('')
    const [birthdate, setBirthdate] = useState('')
    const [walletAddress, setWalletAddress] = useState(zeroAddress)

    const amendAddDevEntityId = async (textsToChange: any[]) => {

        const multicalls: string[] = []
        textsToChange.forEach((x: any) => {
            multicalls.push(
                encodeFunctionData({
                    abi: l1abi,
                    functionName: 'setText',
                    args: [namehash(domain), x.key, x.value],
                }),
            )
        })
        // Use Resolver multicall(setText[])
        const formationPrep: any = {
            functionName: 'multicall',
            args: [multicalls],
            abi: l1abi,
            address: await getResolverAddress(wallet, domain),
        }

        try {
            const returnVal = await executeWriteToResolver(wallet, formationPrep, null)
            if (returnVal) {

                window.location.reload() // Should this reload? or bring user to the Developer page for profile selection?
            }
        } catch (err: any) {
            setErrorMessage(err.message)
        }
    }

    useEffect(() => {
        if (wallet?.account?.address) {
            setWalletAddress(wallet.account.address)
        }
    }, [wallet])

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
                <div style={{ display: 'flex', justifyContent: "space-between", padding: "12px 32px" }}>
                    <BackButton style={{ opacity: step !== 'initial' ? '100%' : '0%' }} onClick={() => setStep('initial')}>
                        ←
                    </BackButton>
                    <CloseButton onClick={onClose}>&times;</CloseButton>
                </div>
                <ContentContainer>
                    <ModalTitle>Register Developer Profile</ModalTitle>

                    {step === 'initial' && (
                        <>
                            <ModalText>No developer has been added to your agent. Select how you'd like to register your developer identity:</ModalText>

                            <StepButton onClick={() => setStep('useEntityId')}>
                                I already have an Entity.ID that I want to use for my profile
                            </StepButton>

                            <StepButton onClick={() => setStep('noEntityId')}>
                                I do not have an Entity.ID
                            </StepButton>

                            <AltLink onClick={() => setStep('naturalPerson')}>
                                Register Developer as a natural person
                            </AltLink>
                        </>
                    )}

                    {step === 'useEntityId' && (
                        <>
                            <ModalText>Enter an Entity.ID that you own:</ModalText>
                            <Input
                                value={entityId}
                                onChange={(e) => setEntityId(e.target.value)}
                                placeholder="yourname.public.entity.id"
                            />
                            <SubmitButton
                                onClick={() => {
                                    // Handle submission logic
                                    try {
                                        const normalizedLabel = normalizeLabel(entityId.split(".")[0])

                                        const normalizedEntityId = (normalizedLabel + '.' + entityId.split('.').slice(1).join("."))?.toLowerCase()

                                        const nodehash = namehash(normalize(normalizedEntityId))

                                        amendAddDevEntityId([
                                            { key: `partner__[0]__entityid`, value: normalizedEntityId },
                                            { key: `partner__[0]__nodehash`, value: nodehash },

                                        ])
                                    } catch (err: any) {
                                        console.log(err.message)
                                        setErrorMessage(err.message)
                                    }
                                    onClose()
                                }}
                            >
                                Submit
                            </SubmitButton>
                        </>
                    )}

                    {step === 'noEntityId' && (
                        <>
                            <ModalText>Register your developer profile using a new Entity.ID:</ModalText>
                            <JurisDropdown
                                wallet={wallet}
                                setErrorMessage={setErrorMessage}
                                domain={domain}
                                partners={partners}
                            />
                        </>
                    )}

                    {step === 'naturalPerson' && (
                        <>
                            <ModalText>Enter your details to register as a natural person:</ModalText>
                            <Input
                                value={naturalName}
                                onChange={(e) => setNaturalName(e.target.value)}
                                placeholder="Full Name"
                            />
                            <Input
                                type="date"
                                value={birthdate}
                                onChange={(e) => setBirthdate(e.target.value)}
                                placeholder="Birthdate"
                            />
                            <Input
                                value={walletAddress}
                                onChange={(e) => setWalletAddress(e.target.value as any)}
                                placeholder="Wallet Address"
                            />
                            <SubmitButton
                                onClick={() => {
                                    amendAddDevEntityId([
                                        { key: `partner__[0]__name`, value: naturalName },
                                        { key: `partner__[0]__birthdate`, value: birthdate },
                                        { key: `partner__[0]__walletaddress`, value: walletAddress },
                                    ])

                                    onClose()
                                }}
                            >
                                Submit
                            </SubmitButton>
                        </>
                    )}
                </ContentContainer>
            </ModalContent>
        </Overlay>
    )
}

export default DeveloperRegisterModal
