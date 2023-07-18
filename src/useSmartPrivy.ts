//@ts-expect-error
import { usePrivy, useWallets } from "@privy-io/react-auth"
import { ECDSAProvider, getRPCProviderOwner } from "@zerodevapp/sdk"
import { useEffect, useMemo, useState } from "react"
import { useZeroDev } from "./ZeroDevContext"

export const useSmartPrivy = () => {
    const [provider, setProvider] = useState<ECDSAProvider>()
    const [address, setAddress] = useState<string>()
    const { projectId } = useZeroDev()
    const privy = usePrivy()
    const {wallets} = useWallets();
    const embeddedWallet = wallets.find((wallet) => (wallet.walletClientType === 'privy'));

    useEffect(() => {
      const initializeZeroDev = async () => {
        if (!wallets.length) throw new Error('Cannot initialize smart contract wallet without an EOA connected.');
        // Use embedded wallet if the user has one, otherwise external wallet
        const provider = await (embeddedWallet || wallets[0]).getEthereumProvider();
        ECDSAProvider.init({
          projectId,
          owner: getRPCProviderOwner(provider),
          opts: {
            paymasterConfig: {
              policy: 'VERIFYING_PAYMASTER'
            }
          }
        }).then(async (provider) => {
          setProvider(provider);
          const address = await provider.getAddress();
          setAddress(address);
        })
      }

      if (!provider && wallets.length) initializeZeroDev();
    }, [provider, privy, projectId])

    return useMemo(() => {
      if (!provider || !address) return privy
      return {
        ...privy,
        user: {
          ...privy.user,
          wallet: privy.user?.wallet ? {
            ...privy.user.wallet,
            address
          } : undefined
        },
        //@ts-expect-error
        sendTransaction: provider.sendTransaction.bind(provider)

      }

    }, [provider, address, privy])

  }
