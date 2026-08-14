"use client";
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { ClerkConditionalProvider } from "./clerk-provider";

export function DualAuthProvider({ children }: { children: ReactNode }) {
  return <ClerkConditionalProvider><SessionProvider>{children}</SessionProvider></ClerkConditionalProvider>;
}
