import { ComponentProps } from 'react'
import styled, { css } from 'styled-components'
import { useEnsAvatar } from 'wagmi'

import { Avatar, Space } from '@ensdomains/thorin'

import { QuerySpace } from '@app/types'
import { ensAvatarConfig } from '@app/utils/query/ipfsGateway'

const Wrapper = styled.div<{ $size?: QuerySpace }>(
  ({ theme, $size }) => css`
    ${typeof $size === 'object' &&
    css`
      width: ${theme.space[$size.min]};
      height: ${theme.space[$size.min]};
      flex: 0 0 ${theme.space[$size.min]};
    `}
    ${typeof $size !== 'object'
      ? css`
          width: ${$size ? theme.space[$size] : theme.space.full};
          height: ${$size ? theme.space[$size] : theme.space.full};
          flex: 0 0 ${$size ? theme.space[$size] : theme.space.full};
        `
      : css`
          @media (min-width: ${theme.breakpoints.xs}px) {
            width: ${theme.space[$size.min]};
            height: ${theme.space[$size.min]};
            flex: 0 0 ${theme.space[$size.min]};
          }
          ${Object.keys($size)
            .filter((key) => key !== 'min' && key in theme.breakpoints)
            .map((key) => {
              const sizeValue = $size[key as keyof typeof $size]
              return sizeValue
                ? css`
                    @media (min-width: ${theme.breakpoints[
                        key as keyof typeof theme.breakpoints
                      ]}px) {
                      width: ${theme.space[sizeValue]};
                      height: ${theme.space[sizeValue]};
                      flex: 0 0 ${theme.space[sizeValue]};
                    }
                  `
                : null
            })}
        `}
    
    img {
      display: block;
    }
  `,
)

type BaseProps = {
  size?: QuerySpace
  noCache?: boolean
}

type Name = {
  name?: string
}

type Address = {
  address?: string
}

export const NameAvatar = ({
  src: _,
  name,
  size,
  noCache = false,
  ...props
}: ComponentProps<typeof Avatar> & BaseProps & Required<Name>) => {
  const { data: avatar } = useEnsAvatar({
    ...ensAvatarConfig,
    name,
    query: { gcTime: noCache ? 0 : undefined },
  })

  return <Wrapper $size={size}></Wrapper>
}

export const AvatarWithZorb = ({
  src,
  name,
  address,
  size,
  noCache = false,
  ...props
}: ComponentProps<typeof Avatar> & BaseProps & Address & Name) => {
  const { data: avatar } = useEnsAvatar({
    ...ensAvatarConfig,
    name,
    query: { gcTime: noCache ? 0 : undefined },
  })
  return <Wrapper $size={size}></Wrapper>
}

export const AddressAvatar = ({
  src,
  address,
  size,
  ...props
}: ComponentProps<typeof Avatar> & Required<Address> & { size?: Space }) => {
  return <Wrapper $size={size}></Wrapper>
}
