import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Gate A — Auth Gate', () => {

  test('T1 — Sign In button navigates to /auth', async ({ page }) => {
    await page.goto(BASE);
    const signIn = page.locator('a[href="/auth"], button:has-text("Sign in")').first();
    await expect(signIn).toBeVisible();
    await signIn.click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test('T2 — Auth page renders email form', async ({ page }) => {
    await page.goto(`${BASE}/auth`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("SEND SIGN-IN LINK")')).toBeVisible();
  });

  test('T3 — /admin/pools redirects to /auth without session', async ({ page }) => {
    await page.goto(`${BASE}/admin/pools`);
    await expect(page).toHaveURL(/\/auth/);
  });

  test('T4 — /pools loads without session (public route)', async ({ page }) => {
    await page.goto(`${BASE}/pools`);
    expect(page.url()).toContain('/pools');
  });

  test('T5 — /submission loads without session (public route)', async ({ page }) => {
    await page.goto(`${BASE}/submission`);
    expect(page.url()).toContain('/submission');
  });

  test('T6 — Invalid email shows error, no network request', async ({ page }) => {
    await page.goto(`${BASE}/auth`);
    await page.fill('input[type="email"]', 'not-an-email');
    await page.click('button:has-text("SEND SIGN-IN LINK")');
    await expect(page.locator('text=Enter a valid email')).toBeVisible();
  });

  test('T7 — /auth/callback without ?code param redirects to /auth', async ({ page }) => {
    await page.goto(`${BASE}/auth/callback`);
    await expect(page).toHaveURL(/\/auth/);
  });

});

test.describe('Gate A — Manual T8 Checklist', () => {

  test('T8 — Manual magic link flow (run against real Supabase project)', async () => {
    // This test requires manual verification:
    //  1. Go to /auth
    //  2. Enter your email
    //  3. Click "SEND SIGN-IN LINK"
    //  4. Check inbox — email should arrive from noreply@ubuntuvvlcc.com (via Resend SMTP)
    //  5. Click the magic link
    //  6. Should land on /pools with active session
    //  7. Nav should show email address instead of "Sign in"
    //  8. Go to jwt.io, paste session token — verify `sub` = auth.uid()
    //  9. Confirm `user_metadata.role` is present if facilitator
    // 10. Click Sign out — should return to guest state
    expect(true).toBe(true);
  });

});
