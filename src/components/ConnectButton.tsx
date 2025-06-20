import { Key, ReactNode, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled, { css } from 'styled-components'
import type { Address } from 'viem'
import { useAccount, useDisconnect, useEnsAvatar } from 'wagmi'
import { useConnectOrCreateWallet, useDelegatedActions, usePrivy, useWallets } from '@privy-io/react-auth';

import {
  Button,
  CheckSVG,
  CogSVG,
  CopySVG,
  ExitSVG,
  mq,
  PersonSVG,
  Profile,
} from '@ensdomains/thorin'
import { DropdownItem } from '@ensdomains/thorin/dist/types/components/molecules/Dropdown/Dropdown'

import { useAccountSafely } from '@app/hooks/account/useAccountSafely'
import { usePrimaryName } from '@app/hooks/ensjs/public/usePrimaryName'
import useHasPendingTransactions from '@app/hooks/transactions/useHasPendingTransactions'
import { useCopied } from '@app/hooks/useCopied'
import { useRouterWithHistory } from '@app/hooks/useRouterWithHistory'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { ensAvatarConfig } from '@app/utils/query/ipfsGateway'
import { shortenAddress } from '@app/utils/utils'
import { MoonIcon, SunIcon } from './@atoms/Icons'

import BaseLink from './@atoms/BaseLink'
import { useTransactionFlow } from '@app/transaction-flow/TransactionFlowProvider'
import { ModalContext } from '@app/layouts/Basic'
import { getRevertErrorData, logFrontendError } from '@app/hooks/useExecuteWriteToResolver'
import { useSetActiveWallet } from '@privy-io/wagmi'

const StyledButtonWrapper = styled.div<{ $isTabBar?: boolean; $large?: boolean }>(
  ({ theme, $isTabBar, $large }) => [
    $isTabBar
      ? css`
          position: absolute;
          align-self: center;
          justify-self: center;

          right: ${theme.space['2']};

          & button {
            padding: 0 ${theme.space['4']};
            width: ${theme.space.full};
            height: ${theme.space['10']};
            border-radius: ${theme.radii.full};
            font-size: ${theme.fontSizes.body};
            ${mq.xs.min(css`
              padding: 0 ${theme.space['8']};
            `)}
          }
        `
      : css`
          position: relative;
          & button {
            /* border-radius: ${theme.radii['2xLarge']}; */
          }
          ${$large &&
        css`
            width: 100%;
            & button {
              border-radius: ${theme.radii.large};
            }
          `}
        `,
  ],
)

const SectionDivider = styled.div(
  ({ theme }) => css`
    width: calc(100% + ${theme.space['4']});
    height: 1px;
    background-color: ${theme.colors.border};
  `,
)

const PersonOverlay = styled.div(
  ({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: center;

    z-index: 1;

    background: ${theme.colors.accent};

    svg {
      color: ${theme.colors.background};
    }
  `,
)

type Props = {
  isTabBar?: boolean
  large?: boolean
  inHeader?: boolean
}

const calculateTestId = (isTabBar: boolean | undefined, inHeader: boolean | undefined) => {
  if (isTabBar) {
    return 'tabbar-connect-button'
  }
  if (!inHeader) {
    return 'body-connect-button'
  }
  return 'connect-button'
}

export const ConnectButton = ({ isTabBar, large, inHeader }: Props) => {
  const { t } = useTranslation('common')
  const breakpoints = useBreakpoint()
  const { connectOrCreateWallet } = useConnectOrCreateWallet();
  const { delegateWallet } = useDelegatedActions();
  const { wallets } = useWallets();      // Privy hook
  const { ready, authenticated, user, logout } = usePrivy();
  const { setActiveWallet } = useSetActiveWallet()
  const execDelegation = async () => {
    const walletToUse = wallets[0]
    if (walletToUse?.address && walletToUse?.walletClientType === "privy") {
      await delegateWallet({ address: walletToUse.address, chainType: 'ethereum' })
    }
  }
  useEffect(() => {
    execDelegation()
    const mm = wallets.find(x => x?.walletClientType === "metamask")
    if (mm && wallets?.[0] !== mm) {
      setActiveWallet(mm)
    }
  }, [wallets])

  return (
    <StyledButtonWrapper $large={large} $isTabBar={isTabBar}>
      <Button
        data-testid={calculateTestId(isTabBar, inHeader)}
        onClick={async () => {
          if (authenticated) await logout()
          try {
            connectOrCreateWallet()
          } catch (error) {
            logFrontendError({ error, functionName: "ConnectWallet", args: { authenticated, user }, message: "authentication issue connecting to privy wallet" })
          }
        }}
        size={breakpoints.sm || large ? 'medium' : 'small'}
        width={inHeader ? '45' : undefined}
        shape="rounded"
      >
        {t('wallet.connect')}
      </Button>
    </StyledButtonWrapper>
  )
}

const HeaderProfile = ({ address, showSelectPrimaryNameInput }: { showSelectPrimaryNameInput: any, address: Address }) => {
  const [isDarkMode, setDarkMode] = useState(true);
  const { t } = useTranslation('common')

  const { data: primary } = usePrimaryName({ address })
  const { data: avatar } = useEnsAvatar({ ...ensAvatarConfig, name: primary?.name })
  const { setIsEmailModalOpen } = useContext<any>(ModalContext)

  const { disconnect } = useDisconnect({})
  const { copy, copied } = useCopied(300)
  const { logout } = usePrivy()

  return (
    <Profile
      address={address}
      ensName={primary?.beautifiedName}
      dropdownItems={
        [

          {
            label: t('navigation.profile'),
            color: 'text',
            wrapper: (children: ReactNode, key: Key) => {
              return (
                <BaseLink href={"/developer/" + (primary?.data?.name || address)} key={key}>
                  {children}
                </BaseLink>
              )
            },
            icon: <CogSVG />,
          },
          // TODO: Add back when dark mode is implemented
          // {
          //   label: isDarkMode ? t('navigation.lightMode') : t('navigation.darkMode'),
          //   color: 'text',
          //   onClick: () => {
          //     toggleDarkMode();
          //   },
          //   icon: isDarkMode ? <SunIcon /> : <MoonIcon />
          // },
          <SectionDivider key="divider" />,

          {
            label: shortenAddress(address),
            color: 'text',
            onClick: () => copy(address),
            icon: copied ? <CheckSVG /> : <CopySVG />,
          },
          <SectionDivider key="divider" />,

          {
            label: "Update Email",
            color: 'text',
            onClick: () => setIsEmailModalOpen(true),
            icon: copied ? <CheckSVG /> : <CopySVG />,
          },
          {
            label: t('wallet.disconnect'),
            color: 'red',
            onClick: async () => {
              await logout()
              disconnect()
            },
            icon: <ExitSVG />,
          },
        ] as DropdownItem[]
      }
      avatar={{
        src: avatar as any,
        decoding: 'sync',
        loading: 'eager',
        noBorder: true,
        overlay: avatar ? undefined : (
          <PersonOverlay>
            <PersonSVG />
          </PersonOverlay>
        ),
      }}
      size="medium"
      alignDropdown="left"
      data-testid="header-profile"
    />
  )
}

export const HeaderConnect = () => {
  const { address } = useAccount()

  const { usePreparedDataInput } = useTransactionFlow()
  const showSelectPrimaryNameInput = usePreparedDataInput('SelectPrimaryName')
  const { wallets } = useWallets();      // Privy hook
  const walletToUse = wallets[0]
  if (!address && !walletToUse?.address) {
    return <ConnectButton inHeader />
  } else {
    return <HeaderProfile address={(walletToUse?.address || address) as any} showSelectPrimaryNameInput={showSelectPrimaryNameInput} />
  }
}
