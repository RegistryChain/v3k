import { useEffect, useState } from 'react'
import styled from "styled-components"
import { TabBar } from "@app/components/TabBar"
import { Header } from "@app/components/Header"

export const Navigation = () => {

  return (
    <>
      <TabBar key="tab-bar-nav" />
      <Header key="header-nav" />
    </>
  )
}
