import { createPublicClient, createWalletClient, custom, http, type Hex } from 'viem'
import { useAccount, useClient } from 'wagmi'

import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import EditEntity from '@app/transaction-flow/input/AdvancedEditor/EditEntity'
import { Button } from '@ensdomains/thorin'
import styled from 'styled-components'
import { css } from 'styled-components'
import { useEffect, useMemo, useState } from 'react'
import AddOwners from '@app/transaction-flow/input/AdvancedEditor/AddOwners'
import { createSubname, setRecords } from '@ensdomains/ensjs/wallet'
import { addEnsContracts } from '@ensdomains/ensjs'
import { sepolia } from 'viem/chains'
import { infuraUrl } from '@app/utils/query/wagmi'
import Head from 'next/head'

const FooterContainer = styled.div(
  ({ theme }) => css`
    display: flex;
    gap: ${theme.space['3']};
    width: 100%;
    margin: 0 auto;
  `,
)

export default function Page() {
  const router = useRouterWithHistory()
  const entityRegistration = router.query.name as string
  const entityRegistrar = router.query.registrar as string
  const isSelf = router.query.connected === 'true'
  const [registrationStep, setRegistrationStep] = useState<number>(1)
  const [profile, setProfile] = useState<any>({})
  const [owners, setOwners] = useState<any>({})

  const { address } = useAccount()
  const primary = usePrimaryName({ address: address as Hex })
  
  const name = isSelf && primary.data?.name ? primary.data.name : entityRegistration
  const [wallet, setWallet] = useState<any>(null);

  const default_registry_domain = "openregistry.eth"

  const publicClient = useMemo(() => createPublicClient({
    chain: sepolia,
    transport: http(infuraUrl('sepolia'))
    }), [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const newWallet = createWalletClient({
        chain: addEnsContracts(sepolia),
        transport: custom(window.ethereum),
        account: address
      });
      setWallet(newWallet);
    } else {
      console.error('Ethereum object not found on window');
    }
  }, []);


  const advance = async () => {
    if (registrationStep < 2) {
      setRegistrationStep(registrationStep +1)
    } else {

      //FIRST REGISTER SUBDOMAIN
      const subdomainId = name.toLowerCase().split(" ").join("-") + Date.now().toString().slice(Date.now().toString().length - 6)
      const entityId = subdomainId + '.' + default_registry_domain
      const hashSubdomain = await createSubname(wallet, {
        name: entityId,
        owner: address,
        contract: 'nameWrapper',
      })

      console.log(await publicClient?.waitForTransactionReceipt( 
        { hash: hashSubdomain }
      ))

      const texts: any[] = []
      Object.keys(profile)?.forEach(key => {
        texts.push({key, value: profile[key]})
      })

      Object.keys(owners)?.forEach(key => {
        texts.push({key, value: owners[key]})
      })

      const recordTx: any = {
        name: entityId,
        coins: [],
        texts,
        resolverAddress: '0x8FADE66B79cC9f707aB26799354482EB93a5B7dD',
      }
      const hashRecords = await setRecords(wallet, recordTx)
      console.log(await publicClient?.waitForTransactionReceipt( 
        { hash: hashRecords }
      ))
      router.push("/" + entityId, {tab: "records"})    
    }
  }

  const previous = () => {
    if (registrationStep>1) {
      setRegistrationStep(registrationStep -1)
    }
  }
  
  useEffect(() => {
    console.log("IMPORTANT - When pulling entity data thats already on chain, get stringified object to see if any changes")
  }, [])

  let content = null

  if (registrationStep === 1) {
    content =(
      <div>
        <EditEntity data={{name}} step={registrationStep} profile={profile} setProfile={setProfile} publicClient={publicClient}/>
        <FooterContainer>
          <Button colorStyle="accentSecondary" onClick={() => previous()}>
            Back
          </Button>
          <Button
            disabled={false}
            onClick={() => {
              console.log("IMPORTANT - perform validations")
              advance()
            }}
          >
            Save
          </Button>
        </FooterContainer>
      </div>)
  }

  if (registrationStep === 2) {
    content = (
      <div>
        <AddOwners step={registrationStep} data={{name}} profile={profile} owners={owners} setOwners={setOwners} publicClient={publicClient} />
        <FooterContainer>
          <Button colorStyle="accentSecondary" onClick={() => previous()}>
            Back
          </Button>
          <Button
            disabled={false}
            onClick={() => {
              console.log("IMPORTANT - Owner validation")
              advance()
            }}
          >
            Save
          </Button>
        </FooterContainer>
      </div>)
  } 

return (<>
  <Head>
    <title>Entity Formation</title>
    <meta name="description" content={"RegistryChain Entity Formation"} />
  </Head>
  {content}
</>)
}
