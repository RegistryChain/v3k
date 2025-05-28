import Head from 'next/head'
import styled, { css } from 'styled-components'
import { zeroHash } from 'viem'

import { Button, Dropdown, mq, Typography } from '@ensdomains/thorin'

import FeaturedAgents from '@app/components/pages/landingPage/FeaturedAgents'
import TrendingAgents from '@app/components/pages/landingPage/TrendingAgents'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useGetRating } from '@app/hooks/useGetRating'



const Container = styled.div(
  () => css`
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
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


export default function Page() {
  const tld = '.entity.id'

  const router = useRouterWithHistory()
  const { recipientAverages } = useGetRating(zeroHash)
  return (
    <>
      <Head>
        <title>V3K</title>
      </Head>

      <Container>
        <Stack>
          <FeaturedAgents recipientAverages={recipientAverages} />
          <TrendingAgents recipientAverages={recipientAverages} />
          <div style={{ width: "100%" }}>
            <Button onClick={() => router.push("/directory")} style={{ width: "380px", justifySelf: "center" }}>Browse Agents</Button>
          </div>
        </Stack>
      </Container>
    </>
  )
}
