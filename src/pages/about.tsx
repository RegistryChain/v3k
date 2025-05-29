import Head from 'next/head'
import Image from 'next/image'
import styled from 'styled-components'
import V3KHero from "../assets/V3KHero.png"

const PageWrapper = styled.div`
  background-color: black;
  color: white;
  min-height: 100vh;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`


const Hero = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 282px;
  margin-top: -1.5rem;
  background-size: cover;
  background-image: 
    linear-gradient(96.24deg, rgba(0, 0, 0, 0.7) 17.59%, rgba(0, 0, 0, 0) 47.72%),
    image-set(
      url(${V3KHero.src})
    );
`
const HeroTitleWrapper = styled.div`
  overflow: hidden;
  height: 3em; /* Adjust based on font-size/line-height */
  display: flex;
  align-items: center;
  justify-content: center;
`

const HeroTitle = styled.h1`
  color: white;
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
  transition: transform 0.9s ease, opacity 0.9s ease;
  position: relative;
  white-space: nowrap;
`
const HeroHeading = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: #9f7aea;
`

const Illustration = styled.div`
  margin: 2rem 0;
  img {
    width: 100%;
    max-width: 600px;
    border-radius: 12px;
  }
`

const Content = styled.div`
  max-width: 950px;
  line-height: 1.8;
  font-size: 1.2rem;
  color: #e0e0e0;
`

const Subheading = styled.h2`
  font-size: 2.5rem;
  text-align: center;
  color: #9f7aea;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
  width: 100%;
`

export default function AboutUsPage() {
  return (
    <>
      <Head>
        <title>About V3K</title>
      </Head>
      <PageWrapper>
        <Hero>
          <HeroTitleWrapper>
            <HeroTitle
              style={{
                transform: 'translateY(-10px)',
                opacity: 0,
                animation: 'fadeUp 0.9s ease forwards'
              }}
              key={"title1"}
            >
              About V3K
            </HeroTitle>
          </HeroTitleWrapper>
        </Hero>;
        {/* <Hero>
          <HeroHeading>About V3K</HeroHeading>
          <Illustration>
            <Image src={V3KHero} alt="V3K Hero Illustration" />
          </Illustration>
        </Hero> */}

        <Content>

          <Subheading>V3K - A Decentralized AI Agent Catalogue</Subheading>
          <div style={{ width: "100%" }}>
            <p style={{ fontSize: "20px", padding: "0 150px", lineHeight: "normal" }}>
              We make it easy to discover, trust, and deploy autonomous AI, all with security and transparency built in from day one.
              In a world where AI agents are growing more powerful and widespread, V3K gives users and developers the tools to interact safely and meaningfully. Every agent listed on V3K has a verifiable Entity.ID, linked to a real developer or organization via the RegistryChain protocol. Our KYA (Know Your Agent) framework ensures accountability, while our on-chain reputation system helps users understand how agents behave in the wild.
              Whether you're a developer launching an agent, a business integrating automation, or a curious user exploring the possibilities, V3K is your gateway to the next generation of AI.
            </p>
          </div>
          <Subheading>V3K in Numbers</Subheading>
          <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between' }}>
            <div style={{ flex: '1 1 300px' }}>
              <Subheading style={{ fontSize: '24px', padding: 0, margin: 0 }}>Agents</Subheading>
              <ul>
                <li>🌐 <strong>15,304</strong> verifiable AI agents with an Entity.ID</li>
                <li>🔐 <strong>87%</strong> With a linked, unique social media account</li>
                <li>📈 <strong>12,455</strong> on-chain agent interactions logged</li>
                <li>🤖 <strong>9</strong> unique agent categories available</li>
              </ul>
            </div>

            <div style={{ flex: '1 1 300px' }}>
              <Subheading style={{ fontSize: '24px', padding: 0, margin: 0 }}>Users</Subheading>
              <ul>
                <li>🛠 <strong>9000+</strong> Unique agent  developer addreses</li>
                <li>🏢 <strong>218</strong> businesses integrating V3K agents</li>
                <li>🧠 <strong>3,904</strong> total active users in the last 30 days</li>
                <li>🌍 <strong>57</strong> countries with active agent usage</li>
              </ul>
            </div>


          </div>
        </Content>
      </PageWrapper>
    </>
  )
}
