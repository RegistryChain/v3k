import { useEffect, useState } from 'react'
import styled from "styled-components"
import { TabBar } from "@app/components/TabBar"
import { Header } from "@app/components/Header"
import V3KHero from "../assets/V3KHero.png"
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'

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
export const Navigation = () => {
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

  const heroRoutes = ["/"]
  let heroEle: any = null

  if (heroRoutes.includes(router.pathname)) {
    heroEle = <Hero>
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
    </Hero>;
  }

  return (
    <>
      <TabBar key="tab-bar-nav" />
      <Header key="header-nav" />
      {heroEle}
    </>
  )
}
