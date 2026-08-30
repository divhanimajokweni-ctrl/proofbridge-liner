import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

const gh = process.env.GITHUB_ID && process.env.GITHUB_SECRET ? [GitHubProvider({ clientId: process.env.GITHUB_ID, clientSecret: process.env.GITHUB_SECRET })] : [];
const go = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })] : [];

export const authOptions: NextAuthOptions = {
  providers: [CredentialsProvider({ name: "Credentials", credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } }, async authorize(c) { if (!c?.email || !c?.password) return null; try { const u = await db.user.findUnique({ where: { email: c.email } }); if (!u) return null; if (!(await bcrypt.compare(c.password, u.password))) return null; return { id: u.id, email: u.email, name: u.name }; } catch { return null; } } }), ...gh, ...go],
  session: { strategy: "jwt" },
  callbacks: { async jwt({ token, user, account }) { if (user) token.id = user.id; if (account) token.provider = account.provider; return token; }, async session({ session, token }) { if (session.user) { session.user.id = token.id as string; (session as any).provider = token.provider; } return session; }, async signIn({ user, account }) { if (account?.provider === "github" || account?.provider === "google") { try { if (!(await db.user.findUnique({ where: { email: user.email! } }))) await db.user.create({ data: { email: user.email!, name: user.name || user.email!.split("@")[0], password: `oauth-${account.provider}-no-password` } }); } catch {} } return true; } },
  pages: { signIn: "/login", error: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
