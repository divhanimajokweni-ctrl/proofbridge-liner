'use client';

import { useState, useCallback } from 'react';
import { useAuth, useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import {
  Shield, Wallet, Lock, CheckCircle2,
  Mail, Chrome, Apple, Loader2, AlertCircle,
  Building2, Eye, Github,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/* ─── Trust Tier Definitions ─── */
type TrustTier = 'browse' | 'verified' | 'financial' | 'web3';

const TRUST_TIERS: Record<TrustTier, { label: string; desc: string; color: string; icon: React.ElementType }> = {
  browse: { label: 'Browse', desc: 'Explore the workspace freely', color: 'text-muted-foreground', icon: Eye },
  verified: { label: 'Verified', desc: 'Email verified — full workspace access', color: 'text-emerald-400', icon: Shield },
  financial: { label: 'Financial', desc: 'KYC + bank verified — financial services', color: 'text-amber-400', icon: Building2 },
  web3: { label: 'Web3', desc: 'Wallet connected — on-chain operations', color: 'text-purple-400', icon: Wallet },
};

/* ─── MetaMask Wallet Hook ─── */
function useMetaMask() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const connect = useCallback(async () => {
    setError('');
    setConnecting(true);
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('MetaMask not detected. Please install the MetaMask browser extension.');
      }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const chain = await window.ethereum.request({ method: 'eth_chainId' }) as string;
        setChainId(chain);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(msg);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
  }, []);

  return { account, chainId, connecting, error, connect, disconnect };
}

/* ─── KYC Verification Status ─── */
interface KYCStatus {
  verified: boolean;
  level: 'none' | 'basic' | 'full';
  bankConnected: boolean;
  provider: string | null;
}

function useKYC() {
  const [status, setStatus] = useState<KYCStatus>({
    verified: false,
    level: 'none',
    bankConnected: false,
    provider: null,
  });
  const [loading, setLoading] = useState(false);

  const startKYC = useCallback(async (provider: 'stitch' | 'stripe') => {
    setLoading(true);
    // In production: redirect to Stitch/Stripe KYC flow
    // For now, simulate the flow
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStatus({
      verified: true,
      level: provider === 'stitch' ? 'full' : 'basic',
      bankConnected: true,
      provider,
    });
    setLoading(false);
  }, []);

  return { status, loading, startKYC };
}

/* ─── Auth Gate Component ─── */
interface AuthGateProps {
  children: React.ReactNode;
  /** The action the user is trying to perform (shown in the auth prompt) */
  action?: string;
  /** Minimum trust tier required */
  requiredTier?: TrustTier;
}

export function AuthGate({ children, action = 'use this feature', requiredTier = 'verified' }: AuthGateProps) {
  // Use Clerk hooks directly — ClerkProvider wraps the entire app in layout.tsx
  const auth = useAuth();
  const { isSignedIn, isLoaded } = auth;
  const metamask = useMetaMask();
  const kyc = useKYC();
  const [showKYCDialog, setShowKYCDialog] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);

  // Determine current user tier
  const currentTier: TrustTier = !isSignedIn
    ? 'browse'
    : kyc.status.verified
      ? 'financial'
      : metamask.account
        ? 'web3'
        : 'verified';

  const tierOrder: TrustTier[] = ['browse', 'verified', 'financial', 'web3'];
  const hasAccess = tierOrder.indexOf(currentTier) >= tierOrder.indexOf(requiredTier);

  // If user has access, render children directly
  if (hasAccess) {
    return <>{children}</>;
  }

  // If not signed in, show auth prompt
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center backdrop-blur-sm"
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/10">
          <Lock className="h-7 w-7 text-emerald-500" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Sign in to {action}</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Create an account or sign in to unlock the full VVU workspace experience.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <SignInButton mode="modal">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Mail className="h-4 w-4" />
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button variant="outline" className="border-amber-600/40 text-amber-500 hover:bg-amber-600/10 gap-2">
              Create Account
            </Button>
          </SignUpButton>
        </div>
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Github className="h-3 w-3" /> GitHub</span>
          <span className="text-white/10">·</span>
          <span className="flex items-center gap-1"><Chrome className="h-3 w-3" /> Google</span>
          <span className="text-white/10">·</span>
          <span className="flex items-center gap-1"><Apple className="h-3 w-3" /> Apple</span>
          <span className="text-white/10">·</span>
          <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</span>
        </div>
      </motion.div>
    );
  }

  // Signed in but needs higher tier
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center backdrop-blur-sm"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-600/10">
        <Shield className="h-7 w-7 text-amber-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">Additional Verification Required</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        To {action}, you need <span className={TRUST_TIERS[requiredTier].color}>{TRUST_TIERS[requiredTier].label}</span> level access.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {requiredTier === 'financial' && (
          <Dialog open={showKYCDialog} onOpenChange={setShowKYCDialog}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                <Building2 className="h-4 w-4" />
                Start KYC Verification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-500" />
                  KYC & Bank Verification
                </DialogTitle>
                <DialogDescription>
                  Financial services require identity and bank account verification for regulatory compliance.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-amber-900/30 bg-amber-950/20 p-4">
                  <h4 className="text-sm font-semibold text-amber-400">What you'll need</h4>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> South African ID or passport</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Proof of address (utility bill, bank statement)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Bank account for verification</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={() => kyc.startKYC('stitch')}
                    disabled={kyc.loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    {kyc.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
                    Verify via Stitch (SA Banks)
                  </Button>
                  <Button
                    onClick={() => kyc.startKYC('stripe')}
                    disabled={kyc.loading}
                    variant="outline"
                    className="w-full border-amber-600/40 text-amber-500 hover:bg-amber-600/10 gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    Verify via Stripe (International)
                  </Button>
                </div>
                {kyc.status.verified && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-950/30 p-3 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Verification complete — {kyc.status.provider} ({kyc.status.level})
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {(requiredTier === 'web3' || requiredTier === 'financial') && (
          <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-purple-600/40 text-purple-400 hover:bg-purple-600/10 gap-2">
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-purple-400" />
                  Connect Your Wallet
                </DialogTitle>
                <DialogDescription>
                  Connect a Web3 wallet to access on-chain operations and decentralized features.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <Button
                  onClick={metamask.connect}
                  disabled={metamask.connecting}
                  className="w-full bg-[#f6851b]/10 border border-[#f6851b]/30 text-[#f6851b] hover:bg-[#f6851b]/20 gap-2"
                  variant="outline"
                >
                  {metamask.connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                  MetaMask
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Compatible with MetaMask, WalletConnect, Coinbase Wallet, and other Web3 providers.
                </p>
                {metamask.error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {metamask.error}
                  </div>
                )}
                {metamask.account && (
                  <div className="flex items-center gap-2 rounded-lg bg-emerald-950/30 p-3 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Connected: {metamask.account.slice(0, 6)}...{metamask.account.slice(-4)}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Workspace Auth Status Bar ─── */
export function WorkspaceAuthBar() {
  const { isSignedIn, isLoaded } = useAuth();
  const metamask = useMetaMask();
  const kyc = useKYC();

  const currentTier: TrustTier = !isSignedIn
    ? 'browse'
    : kyc.status.verified
      ? 'financial'
      : metamask.account
        ? 'web3'
        : 'verified';

  const tier = TRUST_TIERS[currentTier];
  const TierIcon = tier.icon;

  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isSignedIn ? (
        <>
          <Badge variant="outline" className={`${tier.color} border-current/20 gap-1.5`}>
            <TierIcon className="h-3 w-3" />
            {tier.label}
          </Badge>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </>
      ) : (
        <>
          <Badge variant="outline" className="text-muted-foreground border-white/10 gap-1.5">
            <Eye className="h-3 w-3" />
            Browsing
          </Badge>
          <SignInButton mode="modal">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Lock className="h-3.5 w-3.5" />
              Sign In
            </Button>
          </SignInButton>
        </>
      )}
    </div>
  );
}

/* ─── Ethereum Window Type ─── */
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
