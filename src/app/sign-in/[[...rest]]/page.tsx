// @ts-nocheck
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'radial-gradient(ellipse at 50% 25%, #0f0f18, #09090f 75%)' }}>
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-[#0f0f18] border-white/10",
          },
        }}
      />
    </div>
  );
}
