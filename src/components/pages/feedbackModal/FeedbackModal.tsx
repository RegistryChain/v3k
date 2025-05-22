import React, { useRef, useEffect, useState } from 'react'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import styled from 'styled-components'
import { Button } from '@mui/material'

// Full screen overlay
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9998;
`

// Modal wrapper
export const ModalContent = styled.div<{ isMobile: boolean }>`
  background: #fff;
  width: ${({ isMobile }) => (isMobile ? '100%' : '40%')};
  
  padding: 24px;
  border-radius: ${({ isMobile }) => (isMobile ? '0 0 12px 12px' : '12px')};
  
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  position: relative;
    top: ${({ isMobile }) => (isMobile ? '95px' : '200px')};
    left: ${({ isMobile }) => (isMobile ? '0' : '30%')};
`

// Content wrapper inside modal
export const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

// Close button (top-right)
export const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
`

// Header text
export const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
`

// Subtext below title
export const ModalText = styled.p`
  font-size: 14px;
  color: #555;
  margin: 0;
`

// Input (email field)
export const Input = styled.input`
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 8px;
  outline: none;
  width: 100%;

  &:focus {
    border-color: #0070f3;
  }
`

// Comment box
export const Textarea = styled.textarea`
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 8px;
  resize: vertical;
  min-height: 100px;
  outline: none;
  width: 100%;

  &:focus {
    border-color: #0070f3;
  }
`

// Mood selector container
export const MoodSelector = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-start;
`

// Submit button
export const SubmitButton = styled.button`
  background-color: #0070f3;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  width: 100%;

  &:disabled {
    background-color: #ccc;
  }

  &:hover:not(:disabled) {
    background-color: #0059c1;
  }
`

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (feedback: { comment: string; mood: string; email?: string }) => void
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const breakpoints: any = useBreakpoint()
  const modalRef = useRef<HTMLDivElement>(null)

  const [comment, setComment] = useState('')
  const [mood, setMood] = useState<string>('')
  const [email, setEmail] = useState('')
  const [showEmail, setShowEmail] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <Overlay>
      <ModalContent ref={modalRef} isMobile={breakpoints.xs && !breakpoints.md}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <ContentContainer>
          <ModalTitle>Tell us about your experience on V3K</ModalTitle>
          <ModalText>What happened or what could be better?</ModalText>

          <MoodSelector>
            {['👍', '😐', '👎'].map((emoji) => (
              <Button
                type='button'
                key={emoji}
                onClick={() => setMood(emoji)}
                style={{
                  fontSize: '24px',
                  padding: '4px',
                  border: mood === emoji ? '2px solid #0070f3' : '1px solid #ccc',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}
              >
                {emoji}
              </Button>
            ))}
          </MoodSelector>

          <Textarea
            rows={4}
            placeholder="Type your feedback here..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          {showEmail ? (
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          ) : (
            <Button
              type='button'
              style={{
                margin: '8px 0',
                background: 'none',
                color: '#0070f3',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px'
              }}
              onClick={() => setShowEmail(true)}
            >
              Want a reply?
            </Button>
          )}

          <SubmitButton
            disabled={!comment || !mood}
            onClick={() => onSubmit({ comment, mood, email: email || '' })}
          >
            Submit
          </SubmitButton>
        </ContentContainer>
      </ModalContent>
    </Overlay>
  )
}

export default FeedbackModal
