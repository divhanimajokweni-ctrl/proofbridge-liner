"use client";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ReactNode } from "react";

const KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const ok = !!KEY && !KEY.includes("placeholder") && KEY.startsWith("pk_");

export function ClerkConditionalProvider({ children }: { children: ReactNode }) {
  if (!ok) return <>{children}</>;
  return (
    <ClerkProvider appearance={{ baseTheme: dark, variables: { colorPrimary: "#10b981", colorBackground: "#0f172a", colorInputBackground: "#1e293b", colorInputText: "#f8fafc" }, elements: { formButtonPrimary: { fontSize: "14px", textTransform: "none", fontWeight: "600" }, socialButtonsBlockButton: { fontSize: "14px", textTransform: "none", fontWeight: "500" } } }} signInUrl="/sign-in" signUpUrl="/sign-up" afterSignInUrl="/" afterSignUpUrl="/" afterSignOutUrl="/sign-in">
      {children}
    </ClerkProvider>
  );
}
