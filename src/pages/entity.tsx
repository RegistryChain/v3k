import { createPublicClient, createWalletClient, custom, getContract, http, labelhash, namehash, parseAbi, stringToBytes, type Hex } from 'viem'
import { useAccount, useClient } from 'wagmi'

import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import CorpInfo from '@app/components/pages/entityCreation/CorpInfo'
import { Button } from '@ensdomains/thorin'
import styled from 'styled-components'
import { css } from 'styled-components'
import { useEffect, useMemo, useState } from 'react'
import AddFounders from '@app/components/pages/entityCreation/AddFounders'
import { createSubname, setRecords } from '@ensdomains/ensjs/wallet'
import { addEnsContracts } from '@ensdomains/ensjs'
import { sepolia } from 'viem/chains'
import { infuraUrl } from '@app/utils/query/wagmi'
import Head from 'next/head'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Roles from '@app/components/pages/entityCreation/Roles'
import { Review } from '@app/components/pages/entityCreation/Review'

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
  const entityName = router.query.name as string
  const entityRegistrar = router.query.registrar as string
  const entityType = router.query.type as string

  const isSelf = router.query.connected === 'true'
  const [registrationStep, setRegistrationStep] = useState<number>(1)
  const [profile, setProfile] = useState<any>({entityRegistrar, entityType, entityName})
  const [founders, setFounders] = useState<any[]>([])
  const { openConnectModal } = useConnectModal()

  const { address } = useAccount()
  const primary = usePrimaryName({ address: address as Hex })
  
  const name = isSelf && primary.data?.name ? primary.data.name : entityName
  const [wallet, setWallet] = useState<any>(null);

  const default_registry_domain = "publicregistry.eth"

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
  }, [address]);

  const advance = async () => {

    if (registrationStep < 4) {
      setRegistrationStep(registrationStep +1)
    } else if (openConnectModal && !address) {
        await openConnectModal()
      } else {
        console.log('DATA BUILDING', founders, profile)
        const texts: any[] = [{name: entityName, registrar: entityRegistrar, type: entityType}]
        founders.forEach((founder, idx) => {
          const founderKey = "founder[" + idx + "]__"
          Object.keys(founder).forEach(field => {
            if (field !== "roles") {
              texts.push({key: founderKey + field, value: founder[field]})
            } else {
              founder[field].forEach((role: string) => {
                texts.push({key: founderKey + "is__" + role, value: "true"})
              })
            }

          })
        })


        Object.keys(profile).forEach(field => {
          const key = "company__" + field.split(" ").join("__")
          texts.push({key, value: profile[field]})
        })

        // Instantiate Registrant contract
        const subdomainRegistrantAddress="0x343fc79485cc00cfc46ece70845267368ff2b6ce"
        // create labelhash of the subname 
        const publicSubdomainRegistrar: any = getContract({
          address: subdomainRegistrantAddress,
          abi: parseAbi(['function register(bytes32, address, address) external']),
          client: wallet,
        })
        
        const founderAddress:`0x${string}`|undefined = address
        const subdomainId = name.toLowerCase().split(" ").join("-") + "-" +Date.now().toString().slice(Date.now().toString().length - 6)
        const entityId = subdomainId + '.' + default_registry_domain
        const label = labelhash(subdomainId)
        
        const hashSubdomain = await publicSubdomainRegistrar.write.register([label, founderAddress, "0x8fade66b79cc9f707ab26799354482eb93a5b7dd"], { gas: 1000000n })
        // const subObj: any = {
        //   name: entityId,
        //   founder: founderAddress,
        //   contract: 'nameWrapper',
        // }
        // const hashSubdomain = await createSubname(wallet, subObj)
  
        console.log(await publicClient?.waitForTransactionReceipt( 
          { hash: hashSubdomain }
        ))
  
        // Object.keys(profile)?.forEach(key => {
        //   texts.push({key, value: profile[key]})
        // })
  
        // Object.keys(founders)?.forEach(key => {
        //   // IMPORTANT - Loop over foundership array to make all properties elements in texts array
        //   // texts.push({key, value: founders[key]})
        // })
  
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
  let buttons = (
  <FooterContainer style={{marginTop: "36px"}}>  
    <Button disabled={registrationStep <= 1} colorStyle="accentSecondary" onClick={() => previous()}>
      Back
    </Button>
    <Button
      disabled={false}
      onClick={() => {
        advance()
      }}
    >
      {registrationStep < 4 ? "Next":"Create Entity"}
    </Button>
  </FooterContainer>)


  if (registrationStep === 1) {
    content = <AddFounders step={registrationStep} data={{name}} profile={profile} founders={founders} setFounders={setFounders} publicClient={publicClient} />
  }

  if (registrationStep === 2) {
    content = <CorpInfo data={{name}} step={registrationStep} profile={profile} setProfile={setProfile} publicClient={publicClient}/>
  } 

  if (registrationStep === 3) {
    content = <Roles data={{name}} profile={profile} founders={founders} setFounders={setFounders} publicClient={publicClient} />
  }

  if (registrationStep === 4) {
    content = <Review name={name} profile={profile} founders={founders} />
  }

return (<>
  <Head>
    <title>Entity Formation</title>
    <meta name="description" content={"RegistryChain Entity Formation"} />
  </Head>
  <div>
    {content}
    {buttons}
  </div>
</>)
}
