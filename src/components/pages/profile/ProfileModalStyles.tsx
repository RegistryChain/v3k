import styled, { css } from 'styled-components'

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: block;

  @media (min-width: 769px) {
    display: flex;
    justify-content: center;
    align-items: center;
  }
`


export const ModalContent = styled.div<{ isExpanded: boolean }>`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow-y: auto;
  transition: all 0.3s ease;

  width: ${({ isExpanded }) => (isExpanded ? '90%' : '400px')};
  max-width: 60vw;
  max-height: 85vh;
  height: auto;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    height: 70vh;
    max-height: 70vh;
    border-radius: 0;
  }
`
export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 30px;
  font-weight: bold;
  cursor: pointer;
  color: #333;
  
  &:hover {
    color: #000;
  }


`
export const Label = styled.label`
  font-size: 16px;
  font-weight: bold;
  display: block;
  padding: 2px;
  width: 68%;
  margin: 0 auto;
  text-align: left;
`

const baseInputStyles = `
  width: 68%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  margin: 0 auto;
  display: block;
    @media (max-width: 768px) {
    font-size: 28px;
    
  }
`
export const HiddenFileInput = styled.input`
  display: none;
`

export const StyledFileLabel = styled.label`
  ${baseInputStyles}
  width: 100%;
  padding: 14px;
  font-size: 1rem;
  cursor: pointer;
  text-align: left;
  color:rgb(105, 105, 105)
;
  background-color: white;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f9f9f9;
    border-color: #999;
  }
`

export const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #222;
  margin: 0;
  @media (max-width: 768px) {
    font-size: 42px;

  }
`

export const ModalText = styled.p`
  font-size: 0.95rem;
  color: #666;
  line-height: 1.5;
  margin: 0;
  max-width: 480px;
    @media (max-width: 768px) {
    font-size: 32px;
  }
`

export const Input = styled.input`
  ${baseInputStyles}
`
export const TextArea = styled.textarea`
  ${baseInputStyles} resize: vertical;
`
export const Select = styled.select`
  ${baseInputStyles}
`

export const AdvancedSection = styled.div`
  margin: 18px 0;
  padding-top: 16px;
  border-top: 1px solid #eee;
`

export const AdvancedHeader = styled.div<{ isExpanded: boolean }>`
  font-size: 14px;
  color: #666;
  cursor: pointer;
  text-align: center;
  margin-bottom: ${({ isExpanded }) => (isExpanded ? '16px' : '0')};
  transition: margin-bottom 0.3s ease;
  &:hover {
    color: #333;
  }
`


export const StepContainer = styled.div`
  flex: 1; // Fills available vertical space
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 24px;
  width: 100%;
  overflow-y: auto;
`;


export const StepWrapper = styled.div<{ isVisible: boolean }>`
  gap: 16px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  position: relative;
  width: 100%;
  height: 100%;
  transition: opacity 0.5s ease-in-out;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
`;
export const ButtonWrapper = styled.div`
  padding: 24px;
  background-color: white;
  box-shadow: 0 -4px 4px -4px rgba(0, 0, 0, 0.2);
`;
export const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 16px;
  padding: 16px 0;
`

export const SubmitButton = styled.button`
  width: 180px;
  height: 44px;
  background-color: var(--color-accent);
  color: white;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 16px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #8f58e3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
      @media (max-width: 768px) {
    font-size: 24px;
    width: 280px;
    height: 50px;
  }
`

export const StepButton = styled.button`
  width: 75%;
  padding: 14px;
  background-color: #f5f5f5;
  color: #333;
  font-weight: 500;
  font-size: 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #eee;
  }
  @media (max-width: 768px) {
    font-size: 24px;
  }
`

export const AltLink = styled.button`
  background: none;
  border: none;
  color: var(--color-accent);
  text-decoration: underline;
  font-size: 0.95rem;
  cursor: pointer;
  margin-top: 12px;

  &:hover {
    text-decoration: none;
  }
  @media (max-width: 768px) {
    font-size: 24px;
    
  }
`
export const BackButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  font-weight: 800;
  margin-top: 14px;
  color: black;
  cursor: pointer;
  
`

