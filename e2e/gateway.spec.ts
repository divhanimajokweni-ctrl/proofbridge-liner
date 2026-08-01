import { test, expect } from '@playwright/test';

test.describe('VVU Gateway', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load gateway with correct branding', async ({ page }) => {
        await expect(page).toHaveTitle(/VVU Gateway/);
        
        const logo = page.locator('h1:has-text("VENTURE VISION")');
        await expect(logo).toBeVisible();
        
        const poolsCard = page.locator('a:has-text("Ubuntu Pools")');
        const proofbridgeCard = page.locator('a:has-text("ProofBridge Liner")');
        await expect(poolsCard).toBeVisible();
        await expect(proofbridgeCard).toBeVisible();
    });

    test('should navigate to Ubuntu Pools', async ({ page }) => {
        await page.click('a:has-text("Ubuntu Pools")');
        await expect(page).toHaveURL(/.*pools/);
        await expect(page.locator('h1:has-text("Ubuntu Pools")')).toBeVisible();
    });

    test('should navigate to ProofBridge', async ({ page }) => {
        await page.click('a:has-text("ProofBridge Liner")');
        await expect(page).toHaveURL(/.*proofbridge/);
        await expect(page.locator('h1:has-text("ProofBridge Liner")')).toBeVisible();
    });

    test('should load fonts correctly', async ({ page }) => {
        const h1 = page.locator('h1');
        const fontFamily = await h1.evaluate(el => getComputedStyle(el).fontFamily);
        expect(fontFamily).toContain('Syne');
    });

    test('should display footer with pilot disclaimer', async ({ page }) => {
        const disclaimer = page.locator('text=PILOT PROGRAM DISCLAIMER');
        await expect(disclaimer).toBeVisible();
        await expect(disclaimer).toContainText('PILOT PROGRAM DISCLAIMER');
    });
});
