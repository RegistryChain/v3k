import { useState } from 'react'

import { AdvancedHeader, AdvancedSection } from './AgentModalStyles'
import { FormInput } from './FormInput'

export const ParentEntitySection = ({
  parentName,
  setParentName,
  parentEntityId,
  setParentEntityId,
}: any) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <AdvancedSection>
      <AdvancedHeader isExpanded={isExpanded} onClick={() => setIsExpanded(!isExpanded)}>
        Add Developer {isExpanded ? '▲' : '▼'}
      </AdvancedHeader>
      {isExpanded && (
        <>
          <FormInput
            label="Name"
            value={parentName}
            onChange={setParentName}
            placeholder="Enter Developer Name"
          />
          <FormInput
            label="Entity ID"
            value={parentEntityId}
            onChange={setParentEntityId}
            placeholder="Enter an entity.id domain"
          />
        </>
      )}
    </AdvancedSection>
  )
}
