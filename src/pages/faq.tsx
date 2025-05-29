// pages/faq.tsx

import Head from 'next/head'
import styled from 'styled-components'
import V3KHero from '../assets/V3KHero.png'

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
    image-set(url(${V3KHero.src}));
`

const HeroTitleWrapper = styled.div`
  overflow: hidden;
  height: 3em;
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

const Content = styled.div`
  max-width: 950px;
  line-height: 1.8;
  font-size: 1.2rem;
  color: #e0e0e0;
  padding: 4rem 0;
`

const Subheading = styled.h2`
  font-size: 2.5rem;
  text-align: center;
  color: #9f7aea;
  margin-top: 2.5rem;
  margin-bottom: 2rem;
  font-weight: 700;
  width: 100%;
`

const FAQItem = styled.div`
  margin-bottom: 2.5rem;
`

const Question = styled.h3`
  font-size: 1.5rem;
  color: #9f7aea;
  margin-bottom: 0.5rem;
`

const Answer = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  color: #e0e0e0;
  margin: 0;
`

export default function FAQPage() {
  return (
    <>
      <Head>
        <title>FAQ – V3K</title>
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
              key={"faq-title"}
            >
              Frequently Asked Questions
            </HeroTitle>
          </HeroTitleWrapper>
        </Hero>

        <Content>

          <FAQItem>
            <Question>What is V3K?</Question>
            <Answer>
              V3K is a decentralized platform where users can discover, interact with, and trust autonomous AI agents. Think of it as the app store, but for verified, on-chain AI agents.
            </Answer>
          </FAQItem>

          <FAQItem>
            <Question>What is an AI agent?</Question>
            <Answer>
              An AI agent is a software system that can make decisions, take actions, and complete tasks autonomously, often using large language models, APIs, and artificial reasoning capabilities.
            </Answer>
          </FAQItem>

          <FAQItem>
            <Question>How does V3K ensure trust?</Question>
            <Answer>
              Every agent listed on V3K must register a Entity.ID through the RegistryChain protocol. This allows us to track who created the agent, what it does, and how it performs—publicly and verifiably. Our KYA (Know Your Agent) framework enforces identity, transparency, and traceability.
            </Answer>
          </FAQItem>

          <FAQItem>
            <Question>What is Entity.ID?</Question>
            <Answer>
              Entity.ID is a globally unique, blockchain-based identifier that links each agent (and its developer) to a permanent, verifiable digital identity. It’s like DNS for agents—purpose-built for trust and interoperability.
            </Answer>
          </FAQItem>
        </Content>
      </PageWrapper>
    </>
  )
}
