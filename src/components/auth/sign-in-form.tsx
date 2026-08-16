"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Loader2, Github } from "lucide-react";
import { MetaMaskConnect } from "./metamask-connect";

const IVE_WORKSPACE_URL = "https://proofbridge-liner-git-zo-1763fa-divhanimajokweni-1651s-projects.vercel.app/";

export function SignInForm() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setError(""); setLoading(true); try { const r = await signIn("credentials", { email, password, redirect: false }); if (r?.error) setError("Invalid email or password"); else window.location.assign(IVE_WORKSPACE_URL); } catch { setError("Error."); } finally { setLoading(false); } };
  return (
    <Card className="w-full max-w-sm border-slate-700 bg-slate-900/80">
      <CardHeader className="text-center"><div className="flex justify-center mb-2"><Shield className="h-8 w-8 text-emerald-500" /></div><CardTitle className="text-lg text-slate-100">Sign In</CardTitle><CardDescription className="text-slate-400">Authenticate to access the IVE Workspace</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2"><Button variant="outline" onClick={() => signIn("github", { callbackUrl: IVE_WORKSPACE_URL })} disabled={loading} className="w-full border-slate-600 text-slate-200 hover:bg-slate-800 gap-2"><Github className="h-4 w-4" />Continue with GitHub</Button><Button variant="outline" onClick={() => signIn("google", { callbackUrl: IVE_WORKSPACE_URL })} disabled={loading} className="w-full border-slate-600 text-slate-200 hover:bg-slate-800 gap-2"><svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Continue with Google</Button><MetaMaskConnect variant="compact" /></div>
        <div className="relative"><div className="absolute inset-0 flex items-center"><Separator className="w-full bg-slate-700" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">or continue with email</span></div></div>
        <form onSubmit={handleSubmit} className="space-y-4"><div className="space-y-2"><Label htmlFor="si-e" className="text-slate-300">Email</Label><Input id="si-e" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="border-slate-600 bg-slate-800 text-slate-100" /></div><div className="space-y-2"><Label htmlFor="si-p" className="text-slate-300">Password</Label><Input id="si-p" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="border-slate-600 bg-slate-800 text-slate-100" /></div>{error && <p className="text-sm text-red-400">{error}</p>}<Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in…</> : "Sign In with Email"}</Button></form>
        <div className="text-center pt-2"><p className="text-xs text-slate-500">Prefer OAuth-first? <a href="/sign-in" className="text-emerald-400 hover:text-emerald-300 underline">Use Clerk (Primary Auth)</a></p></div>
      </CardContent>
    </Card>
  );
}
