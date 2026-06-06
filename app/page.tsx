/**
 * Home page
 * 
 * The "/" route doesn't have a rewrite rule, so it will render this page.
 * However, users should access /vvv/index.html directly or we need to
 * serve it. For now, redirect to the actual content.
 */

export const dynamic = 'force-static';

export default function Home() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <p>Redirecting to dashboard...</p>
    </div>
  );
}
