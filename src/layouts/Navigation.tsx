import { Header } from '@app/components/Header'
import { TabBar } from '@app/components/TabBar'
import { useInitial } from '@app/hooks/useInitial'
import { useBreakpoint } from '@app/utils/BreakpointProvider'

export const Navigation = ({testMode, setTestMode}: any) => {
  const isInitial = useInitial()
  const breakpoints = useBreakpoint()

  if (!isInitial) {
    if (breakpoints.sm) {
      return <Header testMode={testMode} setTestMode={setTestMode} key="header-nav" />
    }
    return <TabBar key="tab-bar-nav" />
  }

  return (
    <>
      <Header testMode={testMode} setTestMode={setTestMode} key="header-nav" />
      <TabBar key="tab-bar-nav" />
    </>
  )
}
