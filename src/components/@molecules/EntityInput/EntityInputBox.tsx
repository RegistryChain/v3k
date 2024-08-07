/* eslint-disable jsx-a11y/click-events-have-key-events */

/* eslint-disable jsx-a11y/no-static-element-interactions */

/* eslint-disable jsx-a11y/interactive-supports-focus */
import { ForwardedRef, forwardRef, MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'

import { Input, MagnifyingGlassSVG } from '@ensdomains/thorin'

const EntityInputWrapper = styled.div<{ $size: 'medium' | 'extraLarge' }>(
  ({ theme, $size }) => css`
    z-index: 1;
    box-shadow: ${theme.boxShadows['0.25']};
    border-radius: ${theme.radii['2.5xLarge']};
    border-color: ${theme.colors.border};
    width: 100%;
    & input::placeholder {
      color: ${theme.colors.greyPrimary};
      font-weight: ${theme.fontWeights.bold};
    }
    ${$size === 'medium' &&
    css`
      max-width: ${theme.space['96']};
      box-shadow: none;
      border-radius: ${theme.radii.full};
      & input::placeholder {
        color: ${theme.colors.greyPrimary};
        font-weight: ${theme.fontWeights.normal};
      }
    `}
  `,
)

const StyledInputParent = (size: 'medium' | 'extraLarge') =>
  css(
    ({ theme }) => css`
      border-radius: ${theme.radii.full};
      background-color: ${theme.colors.backgroundSecondary};
      transition: background-color 0.35s ease-in-out;
      ${size === 'medium' &&
      css`
        & > div {
          border-radius: ${theme.radii.full};
          input {
            padding-left: ${theme.space['12']};
          }
        }
      `}
      &:focus-within {
        background-color: ${theme.colors.backgroundPrimary};
        & input::placeholder {
          color: transparent;
        }
      }
    `,
  )

const MagnifyingGlassIcon = styled.svg(
  ({ theme }) => css`
    width: ${theme.space['4']};
    height: ${theme.space['4']};
  `,
)

// const ResetButton = styled.div(
//   ({ theme }) => css`
//     display: block;
//     transition: all 0.15s ease-in-out;
//     cursor: pointer;
//     color: rgba(${theme.shadesRaw.foreground}, 0.25);
//     width: ${theme.space['7']};
//     height: ${theme.space['7']};
//     margin-right: ${theme.space['2']};
//     &:hover {
//       color: rgba(${theme.shadesRaw.foreground}, 0.3);
//       transform: translateY(-1px);
//     }
//   `,
// )

type EntityInputBoxProps = {
  size?: 'medium' | 'extraLarge'
  input: string
  setInput: (value: string) => void
  containerRef: ForwardedRef<HTMLDivElement>
}

export const EntityInputBox = forwardRef<HTMLInputElement, EntityInputBoxProps>(
  ({ size = 'extraLarge', input, setInput, containerRef }, ref) => {
    const { t } = useTranslation('common')
    return (
      <EntityInputWrapper ref={containerRef} $size={size}>
        <Input
          size={size}
          label={t('entityInput.label')}
          hideLabel
          placeholder={t('entityInput.placeholder')}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          ref={ref}
          clearable
          autoComplete="off"
          autoCorrect="off"
          parentStyles={StyledInputParent(size)}
          icon={size === 'medium' ? <MagnifyingGlassIcon as={MagnifyingGlassSVG} /> : undefined}
          spellCheck="false"
          data-testid="search-input-box"
        />
      </EntityInputWrapper>
    )
  },
)

type FakeEntityInputBoxProps = {
  size?: 'medium' | 'extraLarge'
  onClick: (e: MouseEvent<HTMLInputElement>) => void
}

export const FakeEntityInputBox = forwardRef<HTMLInputElement, FakeEntityInputBoxProps>(
  ({ size = 'extraLarge', onClick }, ref) => {
    const { t } = useTranslation('common')
    return (
      <EntityInputWrapper $size={size}>
        <Input
          size={size}
          label={t('entityInput.label')}
          hideLabel
          placeholder={t('entityInput.placeholder')}
          ref={ref}
          onClick={onClick}
          readOnly
          autoComplete="off"
          autoCorrect="off"
          parentStyles={StyledInputParent(size)}
          spellCheck="false"
          data-testid="search-input-box-fake"
        />
      </EntityInputWrapper>
    )
  },
)
