// @ts-nocheck
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'radial-gradient(ellipse at 50% 25%, #0f0f18, #09090f 75%)' }}>
      <SignUp
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
