import styled, { css } from "styled-components";
import * as React from "react";

// Variants for button styling
const buttonVariants = {
  default: css`
    background: var(--primary);
    color: var(--color-text);
    box-shadow: var(--shadow);
    border: 1px solid var(--color-primary);
    &:hover {
      background: rgba(var(--primary-rgb), 0.9);
    }
  `,
  destructive: css`
    background: var(--destructive);
    color: var(--destructive-foreground);
    box-shadow: var(--shadow-sm);
    &:hover {
      background: rgba(var(--destructive-rgb), 0.9);
    }
  `,
  outline: css`
    border: 1px solid var(--input);
    background: var(--background);
    box-shadow: var(--shadow-sm);
    &:hover {
      background: var(--accent);
      color: var(--accent-foreground);
    }
  `,
  secondary: css`
    background: var(--secondary);
    color: var(--secondary-foreground);
    box-shadow: var(--shadow-sm);
    &:hover {
      background: rgba(var(--secondary-rgb), 0.8);
    }
  `,
  ghost: css`
    &:hover {
      background: var(--accent);
      color: var(--accent-foreground);
    }
  `,
  link: css`
    color: var(--primary);
    text-decoration: underline;
    text-underline-offset: 4px;
    &:hover {
      text-decoration: underline;
    }
  `,
};

const buttonSizes = {
  default: css`
    height: 2.25rem;
    padding: 0.5rem 1rem;
  `,
  sm: css`
    height: 2rem;
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    border-radius: 0.375rem;
  `,
  lg: css`
    height: 2.5rem;
    padding: 0.5rem 2rem;
    font-size: 1rem;
    border-radius: 0.375rem;
  `,
  icon: css`
    height: 2.25rem;
    width: 2.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
  `,
};

// Styled Button Component
const StyledButton = styled.button<{
  $variant: keyof typeof buttonVariants;
  $size: keyof typeof buttonSizes;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease, color 0.2s ease;
  outline: none;

  ${(props) => buttonVariants[props.$variant]}
  ${(props) => buttonSizes[props.$size]}

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--ring);
  }

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }
`;

// Button Props Interface
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
}

// Button Component
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", asChild = false, ...props }, ref) => {
    return <StyledButton as='button' ref={ref} $variant={variant} $size={size} {...props} />;
  }
);
Button.displayName = "Button";

export { Button };
