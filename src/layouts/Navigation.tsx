import styled from "styled-components"
import { useInitial } from "@app/hooks/useInitial"
import { TabBar } from "@app/components/TabBar"
import { Header } from "@app/components/Header"

const Hero = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: 
    linear-gradient(96.24deg, rgba(0, 0, 0, 0.7) 17.59%, rgba(0, 0, 0, 0) 47.72%),
    image-set(
      url('https://apps.shopify.com/cdn/shopifycloud/shopify_app_store/assets/merchant/home/texture-hero-purple-17621f91179463e239b18b1c50d51adcccb9c89b2927caedf1cb67dee1808215.png'),
      url('https://apps.shopify.com/cdn/shopifycloud/shopify_app_store/assets/merchant/home/texture-hero-purple@2x-0a16a32f9d03d80c1b39d167883b4bcc99b374143e21f790cab6e716d2e8b2c2.png')
    );
  background-size: cover;
  width: 100%;
  height: 242px;
  margin-top: -1.5rem;
`

const HeroTitle = styled.h1`
  color: white;
  font-size: 2.5rem;     /* adjust for your desired size */
  font-weight: 700;
  text-align: center;
  max-width: 80%;
  line-height: 1.2;
`

export const Navigation = () => {
  const isInitial = useInitial()

  return (
    <>
      <TabBar key="tab-bar-nav" />
      <Header key="header-nav" />
      <Hero>
        <HeroTitle>
          Boost your productivity with AI Agents
        </HeroTitle>
      </Hero>
    </>
  )
}
