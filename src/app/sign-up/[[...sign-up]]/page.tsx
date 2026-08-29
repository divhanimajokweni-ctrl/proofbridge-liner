import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">VVU</h1>
          <p className="text-slate-400 text-sm">Create your account — Venture Vision Ubuntu</p>
        </div>
        <SignUp appearance={{ baseTheme: dark, variables: { colorPrimary: "#10b981", colorBackground: "#0f172a", colorInputBackground: "#1e293b", colorInputText: "#f8fafc" }, elements: { formButtonPrimary: { fontSize: "14px", textTransform: "none", fontWeight: "600" }, socialButtonsBlockButton: { fontSize: "14px", textTransform: "none", fontWeight: "500" }, dividerLine: { background: "#334155" }, footerActionLink: { color: "#10b981" } } }} routing="path" path="/sign-up" afterSignUpUrl="/" signInUrl="/sign-in" />
        <div className="mt-6 text-center"><p className="text-slate-500 text-xs">Or sign up with <a href="/login" className="text-emerald-400 hover:text-emerald-300 underline">email &amp; password</a> (NextAuth backup)</p></div>
      </div>
    </div>
  );
}
