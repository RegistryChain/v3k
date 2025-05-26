import styled, { css } from 'styled-components'

export const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

export const ModalContent = styled.div<{ isExpanded: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  padding: 24px 24px 0;
  width: 80%;
  height: 660px;
  overflow-y: visible;
  transition:
    width 0.3s ease,
    max-height 0.3s ease;

  @media (max-width: 1024px) {
    margin-top: 165px;
    width: 100%;
    height: 100%;
    border-radius: 0;
    padding: 16px 16px 0;
  }
`


export const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  color: #333;
  z-index: 10;

  &:hover {
    color: #000;
  }

  @media (max-width: 768px) {
    font-size: 32px;
    top: 20px;
    right: 20px;
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

export const Input = styled.input`
  ${baseInputStyles}
`
export const TextArea = styled.textarea`
  ${baseInputStyles} resize: vertical;
  width: 100%;
  height: 80px;
  font-size: 16px;
  font-weight: 500;
  padding-left: 14px;
  color: #000000de;
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

export const SubmitButton = styled.button(
  ({ theme }) => css`
  width: 220px;
  height: 48px;
  margin: 0 auto;
  display: block;
  background-color: ${theme.colors.accent};
  color: white;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background-color: #8f58e3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`);

export const StepContainer = styled.div`
  flex: 1; // Fills available vertical space
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 24px;
  width: 100%;
  overflow-y: visible;
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