import Head from 'next/head'
import styled, { css } from 'styled-components'
import { zeroHash } from 'viem'
import V3KHero from "../assets/V3KHero.png"


import FeaturedAgents from '@app/components/pages/landingPage/FeaturedAgents'
import TrendingAgents from '@app/components/pages/landingPage/TrendingAgents'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useGetRating } from '@app/hooks/useGetRating'
import { useEffect, useState } from 'react'



const Container = styled.div(
  () => css`
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;

    max-width: 85vw;
    margin: 0 auto;
    width: 100%;
    align-self: center;
  `,
)

const Stack = styled.div(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-gap: ${theme.space['3']};
    gap: ${theme.space['3']};
  `,
)


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
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;
  transition: transform 0.9s ease, opacity 0.9s ease;
  position: relative;
  white-space: nowrap;
`
export default function Page() {
  const tld = '.entity.id'

  const [index, setIndex] = useState(0)
  const router = useRouterWithHistory()

  const phrases = [
    'Boost your productivity with AI Agents',
    'Automate tasks with zero code',
    'Ship faster with trusted infrastructure'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length)
    }, 7000)

    return () => clearInterval(interval)
  }, [])

  const { recipientAverages } = useGetRating(zeroHash)
  return (
    <>
      <Head>
        <title>V3K</title>
      </Head>
      <Hero>
        <HeroTitleWrapper>
          <HeroTitle
            style={{
              transform: 'translateY(-10px)',
              opacity: 0,
              animation: 'fadeUp 0.9s ease forwards'
            }}
            key={phrases[index]}
          >
            {phrases[index]}
          </HeroTitle>
        </HeroTitleWrapper>
      </Hero>
      <Container>
        <Stack>
          <FeaturedAgents recipientAverages={recipientAverages} />
          <TrendingAgents recipientAverages={recipientAverages} />
          {/* <div style={{ width: "100%" }}>
            <Button onClick={() => router.push("/directory")} style={{ width: "380px", justifySelf: "center" }}>Browse Agents</Button>
          </div> */}
        </Stack>
      </Container>
    </>
  )
}
