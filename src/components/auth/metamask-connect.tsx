"use client";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MetaMaskAccount { address: string; chainId: string; balance?: string; }
interface Props { onConnect?: (a: MetaMaskAccount) => void; onError?: (e: string) => void; variant?: "default" | "compact"; }

declare global { interface Window { ethereum?: { request: (a: { method: string; params?: any[] }) => Promise<any>; isMetaMask?: boolean; }; } }

function hasMM(): boolean { return typeof window !== "undefined" && typeof window.ethereum !== "undefined"; }
function chainName(id: string): string { return ({ "0x1": "Ethereum", "0x89": "Polygon", "0xaa36a7": "Sepolia" } as any)[id] || `Chain ${id}`; }

export function MetaMaskConnect({ onConnect, onError, variant = "default" }: Props) {
  const [account, setAccount] = useState<MetaMaskAccount | null>(null);
  const [connecting, setConnecting] = useState(false);
  const mm = hasMM();

  const connect = useCallback(async () => {
    if (!hasMM()) { onError?.("MetaMask not detected."); return; }
    setConnecting(true);
    try {
      const eth = window.ethereum as any;
      const accs: string[] = await eth.request({ method: "eth_requestAccounts" });
      if (!accs?.length) throw new Error("No accounts");
      const cid: string = await eth.request({ method: "eth_chainId" });
      let bal: string | undefined;
      try { const h: string = await eth.request({ method: "eth_getBalance", params: [accs[0], "latest"] }); bal = (parseInt(h, 16) / 1e18).toFixed(4); } catch {}
      const a: MetaMaskAccount = { address: accs[0], chainId: cid, balance: bal };
      setAccount(a); onConnect?.(a);
      const ch = `VVU Auth\nWallet: ${accs[0]}\nTime: ${Date.now()}`;
      const sig: string = await eth.request({ method: "personal_sign", params: [ch, accs[0]] });
      await fetch("/api/auth/metamask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: accs[0], signature: sig, challenge: ch, chainId: cid }) });
    } catch (e: any) { onError?.(e?.message || "Failed"); } finally { setConnecting(false); }
  }, [onConnect, onError]);

  if (variant === "compact") return <Button variant="outline" size="sm" onClick={account ? () => setAccount(null) : connect} disabled={connecting} className="gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"><svg className="w-4 h-4" viewBox="0 0 40 40" fill="none"><path d="M31.2 12.3L21.8 4.5a2.6 2.6 0 00-3.6 0L8.8 12.3a1.3 1.3 0 00-.5 1v9.2c0 .4.2.8.5 1l5.5 4.5v-7.7l3.2 2.4 3.2-2.4v7.7l5.5-4.5c.3-.2.5-.6.5-1v-9.2c0-.4-.2-.8-.5-1z" fill="currentColor"/></svg>{connecting ? "..." : account ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : "MetaMask"}</Button>;

  return (
    <Card className="border-amber-500/20 bg-slate-900/50">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-amber-400"><svg className="w-5 h-5" viewBox="0 0 40 40" fill="none"><path d="M31.2 12.3L21.8 4.5a2.6 2.6 0 00-3.6 0L8.8 12.3a1.3 1.3 0 00-.5 1v9.2c0 .4.2.8.5 1l5.5 4.5v-7.7l3.2 2.4 3.2-2.4v7.7l5.5-4.5c.3-.2.5-.6.5-1v-9.2c0-.4-.2-.8-.5-1z" fill="currentColor"/></svg>MetaMask</CardTitle><CardDescription className="text-slate-400">Connect Web3 wallet</CardDescription></CardHeader>
      <CardContent>{!account ? <div className="space-y-3"><Button onClick={connect} disabled={connecting || !mm} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold">{connecting ? "Connecting..." : mm ? "Connect MetaMask" : "Install MetaMask"}</Button>{!mm && <p className="text-xs text-slate-500 text-center">Install <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">MetaMask</a></p>}</div> : <div className="space-y-3"><div className="flex items-center justify-between"><Badge variant="outline" className="border-emerald-500/30 text-emerald-400">Connected</Badge><span className="text-xs text-slate-500">{chainName(account.chainId)}</span></div><div className="bg-slate-800 rounded-lg p-3 space-y-1"><div className="flex justify-between text-sm"><span className="text-slate-400">Address</span><span className="font-mono text-slate-200">{account.address.slice(0, 8)}...{account.address.slice(-6)}</span></div>{account.balance && <div className="flex justify-between text-sm"><span className="text-slate-400">Balance</span><span className="text-slate-200">{account.balance} ETH</span></div>}</div><Button variant="outline" size="sm" onClick={() => setAccount(null)} className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">Disconnect</Button></div>}</CardContent>
    </Card>
  );
}
