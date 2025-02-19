// components/AdvancedConfiguration.tsx
import { useState } from 'react'

import { AdvancedHeader, AdvancedSection } from './AgentModalStyles'
import { FormInput } from './FormInput'

type AdvancedConfigProps = {
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

export const AdvancedConfiguration = ({ isExpanded, onToggle, children }: AdvancedConfigProps) => (
  <AdvancedSection>
    <AdvancedHeader isExpanded={isExpanded} onClick={onToggle}>
      Advanced Configuration {isExpanded ? '▲' : '▼'}
    </AdvancedHeader>
    {isExpanded && children}
  </AdvancedSection>
)
