import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ECDSAProvider, getRPCProviderOwner } from "@zerodev/sdk"
import { useEffect, useMemo, useState } from "react"
import { useZeroDev } from "./ZeroDevContext"

export const usePrivySmartAccount = () => {
    const [provider, setProvider] = useState<ECDSAProvider>()
    const [address, setAddress] = useState<string>()
    const [chainId, setChainId] = useState<string>();
    const { projectId } = useZeroDev()
    const privy = usePrivy()
    // Check if the user has an embedded wallet
    const hasEmbeddedWallet = !!privy.user?.linkedAccounts.find((account) => (account.type === 'wallet' && account.walletClientType === 'privy'));
    const { wallets } = useWallets();
    // Find the embedded wallet's ConnectedWallet object
    const embeddedWallet = useMemo(() => wallets.find((wallet) => (wallet.walletClientType === 'privy')), [wallets]);

    useEffect(() => {
      // Do nothing until Privy is ready
      if (!privy.ready) return;
      // If the user is not logged in, clear the provider and address
      if (!privy.authenticated) {
        setProvider(undefined);
        setAddress(undefined);
        return;
      }

      const initializeZeroDev = async () => {
        // If the user has no wallets, do nothig
        if (!wallets.length) return;
        // If the user has an embedded wallet, but the embedded wallet object has not yet loaded (may
        // take some time due to the iframe), do nothing
        if (hasEmbeddedWallet && !embeddedWallet) return;
        // Otherwise, initialize a smart wallet using the loaded embedded wallet as a signer,
        // or the most recently connected external wallet (wallets[0]).
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
      initializeZeroDev();
    }, [privy.ready, privy.authenticated, wallets.length, projectId, provider]);

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
