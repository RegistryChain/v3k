import React from 'react'
import styled from 'styled-components'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { FaRegPaperPlane } from 'react-icons/fa'

const Button = styled.button<{ isMobile: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  background-color: #0070f3;
  color: white;
  padding: ${({ isMobile }) => (isMobile ? '8px 12px' : '12px 20px')};
  font-size: ${({ isMobile }) => (isMobile ? '12px' : '14px')};
  border: none;
  border-radius: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  cursor: pointer;

  &:hover {
    background-color: #0059c1;
  }
`

interface FeedbackButtonProps {
    onClick: () => void
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({ onClick }) => {
    const breakpoints: any = useBreakpoint()

    return (
        <Button onClick={onClick} isMobile={breakpoints.xs && !breakpoints.md}>
            <FaRegPaperPlane />
        </Button>
    )
}

export default FeedbackButton
