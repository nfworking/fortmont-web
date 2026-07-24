// components/blur-provider.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type BlurContextType = {
  isBlurred: boolean;
  toggleBlur: () => void;
};

const BlurContext = createContext<BlurContextType | undefined>(undefined);

export function BlurProvider({ children }: { children: ReactNode }) {
  const [isBlurred, setIsBlurred] = useState(true);

  return (
    <BlurContext.Provider
      value={{ isBlurred, toggleBlur: () => setIsBlurred((p) => !p) }}
    >
      <div className={isBlurred ? "is-blurred contents" : "contents"}>
        {children}
      </div>
    </BlurContext.Provider>
  );
}

export function useBlur() {
  const ctx = useContext(BlurContext);
  if (!ctx) throw new Error("useBlur must be used within BlurProvider");
  return ctx;
}