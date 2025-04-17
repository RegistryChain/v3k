import styled from 'styled-components'

import { Header } from '@app/components/Header'
import { TabBar } from '@app/components/TabBar'
import { useInitial } from '@app/hooks/useInitial'
import { useBreakpoint } from '@app/utils/BreakpointProvider'

const Hero = styled.div`
  background-image: linear-gradient(96.24deg, rgba(0, 0, 0, 0.7) 17.59%, rgba(0, 0, 0, 0) 47.72%),
    image-set(
      url('https://apps.shopify.com/cdn/shopifycloud/shopify_app_store/assets/merchant/home/texture-hero-purple-17621f91179463e239b18b1c50d51adcccb9c89b2927caedf1cb67dee1808215.png'),
      url('https://apps.shopify.com/cdn/shopifycloud/shopify_app_store/assets/merchant/home/texture-hero-purple@2x-0a16a32f9d03d80c1b39d167883b4bcc99b374143e21f790cab6e716d2e8b2c2.png')
    );
  background-size: cover;
  width: 100%;
  height: 242px;
  margin-top: -1.5rem;
`

export const Navigation = () => {
  const isInitial = useInitial()
  const breakpoints = useBreakpoint()


  return (
    <>
      <TabBar key="tab-bar-nav" />
      <Header key="header-nav" />
      <Hero />
    </>
  )
}
