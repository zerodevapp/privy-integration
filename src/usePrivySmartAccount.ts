import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ECDSAProvider, getRPCProviderOwner } from "@zerodev/sdk"
import { useEffect, useMemo, useState } from "react"
import { useZeroDev } from "./ZeroDevContext"

export const usePrivySmartAccount = () => {
    const [provider, setProvider] = useState<ECDSAProvider>()
    const [address, setAddress] = useState<string>()
    const { projectId } = useZeroDev()
    const privy = usePrivy()
    const { wallets } = useWallets();
    const embeddedWallet = useMemo(() => wallets.find((wallet) => (wallet.walletClientType === 'privy')), [wallets]);

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
          //@ts-expect-error
          setAddress(await provider.getAddress());
        })
      }
      if (!provider && wallets.length) initializeZeroDev();
    }, [provider, privy, projectId])

    return useMemo(() => {
      const zeroDevReady = !!provider && !!address
      return {
        ...privy,
        user: {
          ...privy.user,
          wallet: privy.user?.wallet ? { ...privy.user.wallet, address } : undefined
        },
        zeroDevReady,
        sendTransaction: (...args: Parameters<typeof privy.sendTransaction>) => {
          if (!zeroDevReady) throw new Error('Smart wallet is not ready yet.')
          //@ts-expect-error
          return provider.sendTransaction(...args)
        },
        getEthereumProvider: () => {
          if (!zeroDevReady) throw new Error('Smart wallet is not ready yet.')
          return provider
        }
      }

    }, [provider, address, privy])

  }
