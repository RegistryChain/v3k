'use-client'

import { useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { createPublicClient, createWalletClient, custom, http, namehash } from 'viem'
import { sepolia } from 'viem/chains'
import { normalize } from 'viem/ens'

import { normalise } from '@ensdomains/ensjs/utils'
import { Button, mq, Typography } from '@ensdomains/thorin'

import { executeWriteToResolver } from '@app/hooks/useExecuteWriteToResolver'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { infuraUrl } from '@app/utils/query/wagmi'
import { normalizeLabel } from '@app/utils/utils'

import contractAddressesObj from '../../constants/contractAddresses.json'
import l1abi from '../../constants/l1abi.json'
import Constitution from '../pages/entityCreation/Constitution'
import { RecordsSection } from '../RecordsSection'
// import DocumentUpload from './DocumentUpload'
import KYC from './KYC'

const NameContainer = styled.div(({ theme }) => [
  css`
    display: block;
    width: 100%;
    padding-left: ${theme.space['2']};
    padding-right: ${theme.space['4']};
    letter-spacing: ${theme.letterSpacings['-0.01']};
    line-height: 45px;
    vertical-align: middle;
    text-align: center;
    font-feature-settings:
      'ss01' on,
      'ss03' on,
      'ss04' on;
    font-weight: ${theme.fontWeights.bold};
    font-size: ${theme.space['6']};
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  `,
  mq.sm.min(css`
    text-align: left;
  `),
])
const FooterContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    gap: ${theme.space['3']};
    width: 100%;
    margin: 0 auto;
  `,
)

const tld = 'chaser.finance'
const contractAddresses: any = contractAddressesObj

const Claims = ({
  domain,
  address,
  breakpoints,
  errorMessage,
  setErrorMessage,
  setIsClaiming,
  records,
  setRecords,
  getRecords,
}: any) => {
  const [fields, setField] = useState({ name: '', address: '', DOB: '' })
  // const [businessDoc, setBusinessDoc] = useState<any>(null)
  const router = useRouterWithHistory()
  const [step, setStep] = useState(0)
  const [wallet, setWallet] = useState(null)
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: sepolia,
        transport: http(infuraUrl('sepolia')),
      }),
    [],
  )

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const newWallet: any = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum, {
          retryCount: 0,
        }),
        account: address,
      })
      setWallet(newWallet)
    } else {
      console.error('Ethereum object not found on window')
    }
  }, [address])

  useEffect(() => {
    if (step === 1 && !records.company__selected__model.setValue) {
      setRecords({
        ...records,
        company__selected__model: {
          ...records.company__selected__model,
          setValue: 'Model 1',
        },
      })
    }
    if (step === 0) {
      setRecords({
        ...records,
        company__selected__model: {
          ...records.company__selected__model,
          setValue: records.company__selected__model.oldValue,
        },
      })
    }
  }, [step])

  const formationPrep: any = {
    functionName: 'transfer',
    args: [namehash(normalize(domain)), address],
    abi: l1abi,
    address: contractAddresses['DatabaseResolver'],
  }
  let registrarAddress = contractAddresses['public.' + tld]
  if (records.company__registrar?.setValue) {
    registrarAddress =
      contractAddresses[records.company__registrar?.setValue?.toLowerCase() + '.' + tld]
  }
  const formationCallback: any = {
    functionName: 'registerEntityClaim',
    abi: [
      {
        inputs: [
          {
            internalType: 'bytes',
            name: 'responseBytes',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'extraData',
            type: 'bytes',
          },
        ],
        name: 'registerEntityClaim',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
    ],
    address: registrarAddress,
    args: [],
  }

  const advance = async () => {
    if (step === 0) {
      try {
        const body = JSON.stringify({
          KYCuserData: {
            ...fields,
            wallet__address: address,
          },
        })
        const response = await fetch(
          `https://oyster-app-mn4sb.ondigitalocean.app/direct/handleKYCIntake/nodeHash=${namehash(
            normalise(domain),
          )}.json`,
          {
            body,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
        if (!response.ok) {
          throw new Error(`Failed to KYC: ${response.statusText}`)
        }

        const data = await response.json()
        if (data.success) {
          setStep(step + 1)
        } else {
          alert('KYC did not match')
        }
      } catch (err) {
        console.log('err', err)
      }
      // } else if (step === 1) {
      //   if (!businessDoc) {
      //     alert('Please upload a document before submitting.')
      //     return
      //   }
      //   try {
      //     const formData = new FormData()
      //     formData.append('document', businessDoc)

      //     const response = await fetch(
      //       `http://localhost:2000/doc?operation=handleBusinessDoc&nodeHash=${namehash(
      //         name,
      //       )}`,
      //       {
      //         method: 'POST',
      //         body: formData,
      //       },
      //     )

      //     if (!response.ok) {
      //       throw new Error(`Failed to upload file: ${response.statusText}`)
      //     }

      //     const data = await response.json()
      //     console.log('File uploaded successfully:', data)
      //     // Handle success (e.g., navigate to another page or show confirmation)
      //     setStep(step + 1)
      //   } catch (error) {
      //     console.error('Error uploading file:', error)
      //     alert('Failed to upload file. Please try again.')
      //   }
    } else if (step === 1) {
      // Start a ERC5559 sequence
      //Sign over name with the wallet
      try {
        const registerChaserTx = await executeWriteToResolver(
          wallet,
          formationPrep,
          formationCallback,
        )
        const transactionRes = await publicClient?.waitForTransactionReceipt({
          hash: registerChaserTx,
        })
        if (transactionRes?.status === 'reverted') {
          throw Error('Transaction failed - contract error')
        }
        router.push('/entity/' + domain)
        return
      } catch (err: any) {
        console.log('ERROR', err.details, err)
        if (err.message === 'Cannot convert undefined to a BigInt') {
          router.push('/entity/' + domain)
          return
        }
        if (err.shortMessage === 'User rejected the request.') return
        let errMsg = err?.details
        if (!errMsg) errMsg = err?.shortMessage
        if (!errMsg) errMsg = err.message

        setErrorMessage(errMsg)
        return
      }
    }
  }

  const previous = () => {
    if (step === 0) {
      setIsClaiming('')
    } else {
      setStep(step - 1)
    }
  }

  let content = null
  if (step === 0) {
    content = (
      <>
        <NameContainer>{domain}</NameContainer>
        <KYC fields={fields} setField={setField} />
      </>
    )
    // } else if (step === 1) {
    // content = (
    //   <div>
    //     <NameContainer>Upload Business Formation Documents</NameContainer>
    //     <DocumentUpload setBusinessDoc={setBusinessDoc} />
    //   </div>
    // )
  } else if (step === 1) {
    const entityRegistrarDomain = normalize(domain)
    content = (
      <div>
        <Typography fontVariant="headingThree" style={{ marginBottom: '12px' }}>
          Sign Claim
        </Typography>
        <Constitution
          breakpoints={breakpoints}
          formationData={records}
          model={records.company__selected__model || 'Model 1'}
          setModel={(modelId: any) => {
            setRecords({
              ...records,
              company__selected__model: {
                ...records.company__selected__model,
                setValue: modelId,
              },
            })
          }}
        />
        <div>
          <RecordsSection
            fields={records}
            domainName={entityRegistrarDomain}
            compareToOldValues={false}
            claimEntity={null}
          />
        </div>
      </div>
    )
  }
  return (
    <>
      {content}
      <FooterContainer style={{ marginTop: '36px' }}>
        <Button colorStyle="accentSecondary" onClick={() => previous()}>
          Back
        </Button>
        <Button
          disabled={false}
          onClick={() => {
            advance()
          }}
        >
          {step < 1 ? 'Next' : 'Submit Claim'}
        </Button>
      </FooterContainer>
    </>
  )
}

export default Claims
