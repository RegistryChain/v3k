import { useContext, useEffect, useMemo, useState } from 'react'
import {
  Address,
  createWalletClient,
  custom,
  decodeAbiParameters,
  decodeFunctionResult,
  encodeAbiParameters,
  encodeFunctionData,
  getContract,
  isAddress,
  labelhash,
  parseAbi,
  parseAbiParameters,
  toHex,
  zeroAddress,
  zeroHash,
} from 'viem'
import { sepolia } from 'viem/chains'
import { normalize, packetToBytes } from 'viem/ens'
import { useAccount, useConnect } from 'wagmi'

import { namehash, normalise } from '@ensdomains/ensjs/utils'

import { LegacyDropdown } from '@app/components/@molecules/LegacyDropdown/LegacyDropdown'
import { ErrorModal } from '@app/components/ErrorModal'
import { roles } from '@app/constants/members'
import { executeWriteToResolver, getResolverAddress, getTransactions } from '@app/hooks/useExecuteWriteToResolver'
import useTokenBalances from '@app/hooks/useTokenBalances'
import { useBreakpoint } from '@app/utils/BreakpointProvider'
import { generateSafeAddress, generateSafeSalt, getPublicClient, normalizeLabel } from '@app/utils/utils'

import contractAddresses from '../../../../../../constants/contractAddresses.json'
import l1abi from '../../../../../../constants/l1abi.json'

import { Button as MuiButton } from '@mui/material'
import styled from 'styled-components'

const Button = styled(MuiButton)`
  text-transform: none;
  border-radius: 24px;

  &:hover {
    border-color: #6a24d6;
    color: #6a24d6;
  }
`;


const contractAddressesObj: any = contractAddresses

const tld = 'entity.id'

const ActionsTab = ({
  refreshRecords,
  multisigAddress,
  registrar,
  onChainOwner,
  claimEntity,
  partners,
  owner,
  client,
  wallet,
  setWallet,
  makeAmendment,
  name,
  checkEntityStatus,
}: any) => {
  const [errorMessage, setErrorMessage] = useState<string>('')
  const { address, isConnected } = useAccount()
  const label = name.split('.')[0]

  const labelHashToUse = labelhash(normalizeLabel(label))
  const generatedSafe = useMemo(() => {
    if (address && name) {
      return generateSafeAddress(address, labelHashToUse, contractAddressesObj['ai.' + tld])
    } else {
      return zeroAddress
    }
  }, [address, name])
  const { balances, loading, error } = useTokenBalances(generatedSafe)
  const breakpoints = useBreakpoint()

  const [txs, setTxs]: any[] = useState([])

  const refresh = async () => {
    window.location.href = "/agent/" + name
  }

  const readTransactions = async () => {
    const txArray = await getTransactions({
      nodehash: namehash(normalise(name)),
      address: (address as any) || (zeroAddress as any),
    })
    setTxs(txArray)
  }


  const migrateToOnchainRecords = async () => {

    console.log("migrating...")

    const publicClient = getPublicClient()



    const resolverAddress = await getResolverAddress(publicClient, name)
    const calldataObject = {
      abi: l1abi,
      functionName: "proveTextRecords",
      args: [namehash(name)],
      address: resolverAddress
    };

    const callback = {
      ...calldataObject,
      functionName: "bringRecordsOnchain",
      args: [contractAddressesObj["PublicResolver"]],
      address: contractAddressesObj["ai.entity.id"]
    }

    console.log(contractAddressesObj["ai.entity.id"], resolverAddress, namehash(name), "BRINGING ON CHAIN")

    const res = await executeWriteToResolver(wallet, calldataObject, callback)
  }

  // Function to deploy Safe Core Multisig
  async function deploySafeMultisig() {

    if (owner !== address) {
      return
    }

    if (onChainOwner === zeroAddress && owner === address) {
      await migrateToOnchainRecords()
    }

    try {
      if (onChainOwner === address || (onChainOwner === zeroAddress && owner === address)) {


        const saltNonce = BigInt(Date.now()); // Use timestamp as nonce for uniqueness
        // Instantiate the Safe Proxy Factory contract
        const safeFactory: any = getContract({
          address: contractAddressesObj["SepoliaSafeFactory"],
          abi: l1abi,
          client: wallet,
        });

        const initializerBytes = encodeFunctionData({
          abi: l1abi,
          functionName: 'setup',
          args: [
            [owner],
            BigInt(1),
            zeroAddress,
            "0x",
            contractAddressesObj["SepoliaFallbackHandler"],
            zeroAddress,
            BigInt(0),
            zeroAddress,
          ],
        });

        // Write to contract (deploy Safe multisig)
        const txHash = await safeFactory.write.createProxyWithNonce([
          contractAddressesObj["SingletonAddress"],
          initializerBytes,
          saltNonce,
        ]);


        // Wait for transaction confirmation
        const txReceipt = await client.waitForTransactionReceipt({ hash: txHash });

        // Extract Safe contract address from logs
        const safeAddress = txReceipt.logs[0]?.address;

        if (!safeAddress || safeAddress === zeroAddress) {
          setErrorMessage("No safe address detected")
          return
        }


        // transfer ownership to the safe
        const registry: any = getContract({
          abi: l1abi,
          address: contractAddressesObj.ENSRegistry,
          client: wallet
        })

        const txHash2 = await registry.write.setOwner([namehash(normalize(name)), safeAddress], { gas: 6000000n })
        await client.waitForTransactionReceipt({ hash: txHash2 });
        // https://app.safe.global/home?safe=sep: + safeAddress
        refresh()

      }
    } catch (err: any) {
      if (err.shortMessage === 'User rejected the request.') return
      let errMsg = err?.details
      if (!errMsg) errMsg = err?.shortMessage
      if (!errMsg) errMsg = err.message
      setErrorMessage(errMsg)
    }
  }

  const claimPregeneratedSafe = async () => {
    try {
      if (address) {
        // -Construct the salt with the labelhash, generate the address with the connected account
        const labelHashToUse = labelhash(normalizeLabel(label))
        const generatedSafe: any = generateSafeAddress(
          address,
          labelHashToUse,
          contractAddressesObj['ai.' + tld],
        )

        // Attempt to call to the safe at the pregenerated address. If not deployed yet, proceed
        const bc = await client.getBytecode({ address: generatedSafe })
        if (bc && bc !== '0x') {
          throw new Error('This safe has already been claimed')
        }

        const deployerContract: any = getContract({
          abi: [
            {
              inputs: [{ internalType: 'bytes32', name: 'saltInput', type: 'bytes32' }],
              name: 'deployClaimableTreasury',
              outputs: [{ internalType: 'address', name: '', type: 'address' }],
              stateMutability: 'nonpayable',
              type: 'function',
            },
          ],
          address: contractAddressesObj.ClaimableTreasuryFactory,
          client: wallet,
        })

        const tx = await deployerContract.write.deployClaimableTreasury([
          generateSafeSalt(labelHashToUse, contractAddressesObj['ai.' + tld]),
        ])
      }
    } catch (err: any) {
      if (err.shortMessage === 'User rejected the request.') return
      let errMsg = err?.details
      if (!errMsg) errMsg = err?.shortMessage
      if (!errMsg) errMsg = err.message
      setErrorMessage(errMsg)
    }
  }

  const withdrawFromSafe = async (tokenAddress: any, balance: any, decimals: any) => {
    try {
      const tokenContract: any = getContract({
        abi: [
          {
            inputs: [
              { internalType: 'address', name: 'tokenAddress', type: 'address' },
              { internalType: 'uint256', name: 'value', type: 'uint256' },
            ],
            name: 'withdrawERC20',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        address: generatedSafe as any,
        client: wallet,
      })

      const tx = await tokenContract.write.withdrawERC20([tokenAddress, balance * 10 ** decimals])
      console.log('Transaction Hash:', tx)
      return tx
    } catch (err: any) {
      if (err.shortMessage === 'User rejected the request.') return
      let errMsg = err?.details
      if (!errMsg) errMsg = err?.shortMessage
      if (!errMsg) errMsg = err.message
      setErrorMessage(errMsg)
    }
  }

  useEffect(() => {
    if (multisigAddress && txs.length === 0) {
      readTransactions()
    }
  }, [multisigAddress])



  let claimOnChainElement = null
  // if on chain owner is zeroAddress but record.owner || partner.walletAddress is equal to account
  const hasOwnerOnchain = isAddress(onChainOwner) && onChainOwner !== zeroAddress
  const isOwnerOperatorOffchain =
    owner === address || partners?.map((x: any) => x?.walletaddress)?.includes(address)
  if (!hasOwnerOnchain && isOwnerOperatorOffchain) {
    claimOnChainElement = (
      <div style={{ width: '100%', margin: '16px 0' }}>
        <Button disabled={true} variant="outlined"
          style={{ width: "100%" }} onClick={() => claimEntity(namehash(name))}>Claim On-Chain</Button>
      </div>
    )
  }

  let amendmentElement = null
  if (address === owner || owner === multisigAddress) {
    amendmentElement = (
      <div style={{ width: '100%', margin: '16px 0' }}>
        <Button style={{ width: "100%" }}
          variant="outlined"
          onClick={() => {
            makeAmendment()
          }}
        >
          Update Agent
        </Button>
      </div>
    )
  }


  return (
    <div>
      <ErrorModal
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
        breakpoints={breakpoints}
      />
      {claimOnChainElement}
      <div style={{ width: '100%', margin: '16px 0' }}>
        <Button disabled={true} style={{ width: "100%" }} variant="outlined" onClick={() => claimPregeneratedSafe()}>Claim Safe</Button>
      </div>
      {balances.length > 0 ? (
        <div style={{ width: '50%', margin: '16px 0' }}>
          <LegacyDropdown
            style={{ maxWidth: '100%', textAlign: 'left' }}
            inheritContentWidth={true}
            size={'medium'}
            label={'Withdraw tokens from safe'}
            items={balances.map((x: any, idx: any) => ({
              key: x.tokenAddress,
              label: x.balance + ' ' + x.tokenSymbol,
              color: 'blue',
              onClick: () => withdrawFromSafe(x.tokenAddress, x.balance, x.decimals),
              value: x.tokenAddress,
            }))}
          />
        </div>
      ) : null}
      < div style={{ width: '100%', margin: '16px 0' }}>
        <Button disabled={true} style={{ width: "100%" }} variant="outlined" onClick={() => deploySafeMultisig()}>Deploy Safe CA</Button>
      </div>
      {amendmentElement}
      <div style={{ width: '100%', margin: '16px 0' }}>
        <Button onClick={async () => {
          await migrateToOnchainRecords()
          // refresh()
        }} style={{ width: "100%" }} variant="outlined">
          Bring Agent Onchain
        </Button>
      </div>
      <div style={{ width: '100%', margin: '16px 0' }}>
        <Button disabled={true} style={{ width: "100%" }} variant="outlined">KYC verification</Button>
      </div>
    </div >
  )
}

export default ActionsTab
