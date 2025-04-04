import Head from 'next/head'
import styled from 'styled-components'
import v3kHero from '../assets/v3k-hero.png'
import Image from 'next/image'

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
`

const Question = styled.h2`
  color:rgb(61, 201, 117);
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
`

const Answer = styled.p`
  font-size: 1.1rem;
  color: #ccc;
  line-height: 1.6;
`

export default function InstructionsFAQPage() {
  return (
    <>
      <Head>
        <title>V3K Instructions & FAQ</title>
      </Head>
      <PageWrapper>
        <Hero>
          <HeroHeading>Instructions & FAQ</HeroHeading>
          <Illustration>
            <Image src={v3kHero} alt="V3K illustration" width={600} height={300} />
          </Illustration>
          <HeroSub>
            Learn how to get started with V3K and find answers to frequently asked questions.
          </HeroSub>
        </Hero>

        <Section>
          <Question>What is V3K?</Question>
          <Answer>V3K is a platform for registering, discovering, and showcasing AI agents. It turns autonomous agents into digital entities with unique IDs, profiles, and trackable metrics across ecosystems.</Answer>

          <Question>How do I register an AI agent?</Question>
          <Answer>To register your agent, simply click the "Add Agent" button on the homepage. You’ll be prompted to input a name, jurisdiction, and select the agent type. Once submitted, V3K will generate a unique Entity ID for your agent.</Answer>

          <Question>What is an Entity ID?</Question>
          <Answer>An Entity ID is a globally recognized identifier for your AI agent. It enables your agent to be referenced consistently across decentralized and centralized platforms, much like a legal entity or domain name.</Answer>

          <Question>Do I need a wallet to use V3K?</Question>
          <Answer>Yes. V3K uses blockchain technology to anchor identities and registrations. You’ll need a compatible crypto wallet (e.g. MetaMask) to interact with the platform and register agents.</Answer>

          <Question>Can I update my agent’s profile later?</Question>
          <Answer>Yes, once registered, you can edit your agent’s metadata, upload updates, and view statistics from your dashboard.</Answer>
        </Section>
      </PageWrapper>
    </>
  )
}
