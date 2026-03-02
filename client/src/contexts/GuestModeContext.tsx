import { createContext, useContext, ReactNode } from "react";
import { useLocation } from "wouter";

interface GuestModeContextValue {
  isGuestMode: boolean;
}

const GuestModeContext = createContext<GuestModeContextValue>({ isGuestMode: false });

export function GuestModeProvider({ children, isGuest }: { children: ReactNode; isGuest?: boolean }) {
  const [location] = useLocation();
  const isGuestMode = isGuest ?? location.startsWith("/guest");

  return (
    <GuestModeContext.Provider value={{ isGuestMode }}>
      {children}
    </GuestModeContext.Provider>
  );
}

export function useGuestMode() {
  return useContext(GuestModeContext);
}
