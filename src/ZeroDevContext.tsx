import React, { useMemo, useContext } from "react";
import { PaymasterAndBundlerProviders, SupportedGasToken } from '@zerodev/sdk'

type ZeroDevState = {
  projectId: string,
  bundlerProvider?: PaymasterAndBundlerProviders,
  paymasterProvider?: PaymasterAndBundlerProviders,
  onlySendSponsoredTransaction?: boolean,
  gasToken?: SupportedGasToken,
  rpcUrl?: string,
};

const ZeroDevContext = React.createContext<ZeroDevState | undefined>(undefined);

export const useZeroDev = () => {
  const context = useContext(ZeroDevContext);

  if (context === undefined) {
    throw new Error("useChat must be used within a ZeroDevProvider");
  }

  return context;
};

export const ZeroDevProvider = ({
  children,
  projectId,
  bundlerProvider,
  paymasterProvider,
  onlySendSponsoredTransaction,
  gasToken,
  rpcUrl
}: ({ children: React.ReactNode } & ZeroDevState)) => {
  const value = useMemo(() => {
    return {
      projectId,
      bundlerProvider,
      paymasterProvider,
      onlySendSponsoredTransaction,
      gasToken,
      rpcUrl
    };
  }, [projectId, bundlerProvider, paymasterProvider, onlySendSponsoredTransaction, gasToken, rpcUrl]);

  return (
    <ZeroDevContext.Provider value={value}>{children}</ZeroDevContext.Provider>
  );
};