//@ts-expect-error
import { usePrivy } from "@privy-io/react-auth"
import { ECDSAProvider, getRPCProviderOwner } from "@zerodevapp/sdk"
import { useEffect, useMemo, useState } from "react"
import { useZeroDev } from "./ZeroDevContext"

export const useSmartPrivy = () => {
    const [provider, setProvider] = useState<ECDSAProvider>()
    const [address, setAddress] = useState<string>()
    const { projectId } = useZeroDev()
    const privy = usePrivy()
  
    useEffect(() => {
      if (!provider && privy.user?.wallet?.address) {
        if (privy.getEthereumProvider().address) {
          ECDSAProvider.init({
              projectId,
              owner: getRPCProviderOwner(privy.getEthereumProvider()),
              opts: {
                paymasterConfig: {
                  policy: 'VERIFYING_PAYMASTER'
                }
              }
          }).then(provider => {
              setProvider(provider)
              //@ts-expect-error
              provider.getAddress().then(setAddress)
          })
        }
      }
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
