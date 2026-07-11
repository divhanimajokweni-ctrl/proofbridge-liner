import Link from 'next/link';

export function DashboardNav() {
  return (
    <nav className="flex gap-4">
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/pools">Pools</Link>
    </nav>
  );
}
