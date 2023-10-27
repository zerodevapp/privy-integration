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
    const [chainId, setChainId] = useState<string>();
    const hasEmbeddedWallet = !!privy.user?.linkedAccounts.find((account) => (account.type === 'wallet' && account.walletClientType === 'privy'));
    const embeddedWallet = useMemo(() => wallets.find((wallet) => (wallet.walletClientType === 'privy')), [wallets]);

    useEffect(() => {
      if (!privy.ready) return;

      if (!privy.authenticated) {
        setProvider(undefined);
        setAddress(undefined);
      }

      const initializeZeroDev = async () => {
        // If the user has no wallets, do nothing
        if (!wallets.length) return;

        // If the user has an embedded wallet (per user.linkedAccounts) but the wallet has not
        // loaded yet in the useWallets array, do nothing
        if (hasEmbeddedWallet && !embeddedWallet) return;

        // Otherwise, initialize a smart wallet from the user's EOA. If the user has an embedded wallet,
        // that will be prioritized first
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
          setAddress(await provider.getAddress());
          const chainIdAsNumber = Number(await provider.request({method: 'eth_chainId'}));
          setChainId(`eip155:${chainIdAsNumber}`);
        })
      }
      if (!provider && wallets.length) initializeZeroDev();
    }, [privy.ready, privy.authenticated, wallets.length, projectId, provider])

    return useMemo(() => {
      const zeroDevReady = !!provider && !!address
      return {
        ...privy,
        user: {
          ...privy.user,
          wallet: privy.user?.wallet ? { ...privy.user.wallet, address, chainId } : undefined
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
