
import { useAttestations } from '@app/hooks/useCdpAttestation'
import { CheckmarkSymbol } from './CheckmarkSymbol'

type CFProps = {
    countryCode?: string
}
type CMProps = {
    isVerified?: boolean
    userAddress?: string
}
type AttestationProps = {
    userAddress?: string
}

const CountryFlag = ({countryCode}: CFProps) => {
    if(!countryCode) return
    return <img 
            alt={countryCode} 
            src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${"US"}.svg`} 
            style={{ 
                width: '16px', 
                height: '12px', 
                borderRadius: '2px',
                display: 'inline-block',
                marginLeft: '4px', // Add spacing if needed
                verticalAlign: 'middle' // Aligns with text baseline
            }} 
        />
}

const CheckMark = ({isVerified, userAddress}: CMProps) => {
    if(!isVerified) return
    return (
        <CheckmarkSymbol tooltipText={"This address is Verified on CoinBase"} address={userAddress}></CheckmarkSymbol>
    )
}

export const Attestation = ({userAddress}: AttestationProps) => {
    const {countryCode, isVerified} = useAttestations(userAddress)
    console.log({countryCode, isVerified})

    return (
    <>
        <CheckMark isVerified={isVerified} userAddress={userAddress}></CheckMark>
        <CountryFlag countryCode={countryCode}></CountryFlag>
    </>)

}