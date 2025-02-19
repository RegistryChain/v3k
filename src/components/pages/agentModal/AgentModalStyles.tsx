import styled from 'styled-components'

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
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  padding: 24px;
  width: ${({ isExpanded }) => (isExpanded ? '90%' : '60%')};
  max-height: ${({ isExpanded }) => (isExpanded ? '90%' : '50%')};
  overflow-y: auto;
  transition:
    width 0.3s ease,
    max-height 0.3s ease;

  @media (max-width: 768px) {
    width: 90%;
    max-height: 80%;
  }
`

export const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #333;
  &:hover {
    color: #000;
  }
`

export const InputGroup = styled.div`
  margin-bottom: 16px;
  text-align: center;
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
