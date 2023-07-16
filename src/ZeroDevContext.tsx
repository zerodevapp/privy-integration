import React, { useRef, useState, useMemo, useEffect, useContext } from "react";

type ZeroDevState = {
    projectId: string
};

const ZeroDevContext = React.createContext<ZeroDevState | undefined>(undefined);

export const useZeroDev = () => {
  const context = useContext(ZeroDevContext);

  if (context === undefined) {
    throw new Error("useChat must be used within a ZeroDevProvider");
  }

  return context;
};

export const ZeroDevProvider = ({ children, projectId }: { children: React.ReactNode, projectId: string }) => {
    const value = useMemo(() => {
        return {
            projectId
        };
    }, [projectId]);

  return (
    <ZeroDevContext.Provider value={value}>{children}</ZeroDevContext.Provider>
  );
};