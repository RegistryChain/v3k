import Head from 'next/head'
import Image from 'next/image'
import styled, { css } from 'styled-components'
import { Typography } from '@ensdomains/thorin'
import v3kHero from '../assets/v3k-hero.png'

// Sample mock app data
const appData = [
    {
        category: 'Streamline and optimize',
        description:
            'Up your game with inventory management apps that offer everything from multi-warehouse integration, real-time tracking, and automated reordering—so the products customers love most are always in stock.',
        apps: [
            { name: 'Linnworks', rating: '1.4 ★ (2)', info: 'Free to install', desc: 'Bring inventory and order management into one platform' },
            { name: 'Trunk - Stock Sync & Bundling', rating: '4.9 ★ (502)', info: 'Free trial available', desc: 'Keep inventory synced in real-time across everywhere you sell' },
            { name: 'Brightpearl by Sage', rating: '4.5 ★ (40)', info: 'Free to install', desc: 'Industry-leading operating system for retailers' },
        ]
    },

    {
        category: 'Bring order to your orders',
        description:
            'Process orders more efficiently, integrate fulfillment across multiple channels and locations, lower your operational expenses, and increase customer satisfaction—all with order-management apps.',
        apps: [
            { name: 'OMSGuru', rating: '5.0 ★ (8)', info: 'Free to install', desc: 'Single platform for managing your business operations' },
            { name: 'XStak OMS', rating: 'Free', info: '', desc: 'Complete OMS solution for end-to-end order management' },
            { name: 'Pipe17', rating: '4.9 ★ (22)', info: '$24,000/year', desc: 'Order Management and Integrations for DTC, POS and B2B Sellers' },
        ]
    }
]

const PageWrapper = styled.div`
  background-color: black;
  color: white;
  min-height: 100vh;
  padding: 2rem 1rem;
`

const Hero = styled.div`
  max-width: 1024px;
  margin: 0 auto 4rem;
  text-align: center;
`

const HeroHeading = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
`

const HeroSub = styled.p`
  font-size: 1.25rem;
  color: #ccc;
`

const Illustration = styled.div`
  margin-top: 2rem;
  img {
    width: 100%;
    padding: 0 25%;
    max-width: 100%;
    border-radius: 12px;
  }
`

const Section = styled.div`
  background: #121212;
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem auto;
  max-width: 1024px;
  display: flex;
  flex-direction: row;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const SectionText = styled.div`
  flex: 1;
`

const SectionTitle = styled.h2`
  color: #cfff4f;
  font-size: 1rem;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
`

const SectionDesc = styled.p`
  font-size: 1.25rem;
  line-height: 1.6;
`

const AppList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const AppItem = styled.div`
  background: #1a1a1a;
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`

const AppInfo = styled.div`
  max-width: 75%;
`

const AppName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
`

const AppDesc = styled.p`
  margin: 0.25rem 0 0;
  color: #aaa;
`

const InstallButton = styled.button`
  background: #00c851;
  color: black;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
`

export default function ShopifyStyledPage() {
    return (
        <>
            <Head>
                <title>About V3K</title>
            </Head>
            <PageWrapper>
                <Hero>
                    <HeroHeading>About V3K</HeroHeading>
                    <Illustration>
                        <Image src={v3kHero} alt="Apps grid illustration" width={600} height={300} />
                    </Illustration>
                    <HeroSub>

                        V3K is a platform for registering and showcasing AI agents to the public. We provide trust and discoverability to both users and developers looking to increase productivity with AI agents. V3K is built on top of RegistryChain to provide a universal Entity ID among al ecosystems, turning Agents into entities with data points comparable to corporations, partnerships, and natural persons.
                    </HeroSub>
                </Hero>

                {appData.map((section, idx) => (
                    <Section key={idx}>
                        <SectionText>
                            <SectionTitle>{section.category}</SectionTitle>
                            <SectionDesc>{section.description}</SectionDesc>
                        </SectionText>
                        <AppList>
                            {section.apps.map((app, index) => (
                                <AppItem key={index}>
                                    <AppInfo>
                                        <AppName>{app.name} — {app.rating}</AppName>
                                        <AppDesc>{app.info && `${app.info} · `}{app.desc}</AppDesc>
                                    </AppInfo>
                                    <InstallButton>Install</InstallButton>
                                </AppItem>
                            ))}
                        </AppList>
                    </Section>
                ))}
            </PageWrapper>
        </>
    )
}
