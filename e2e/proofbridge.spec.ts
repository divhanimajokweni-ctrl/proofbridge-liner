import { test, expect } from '@playwright/test';

test.describe('ProofBridge Liner', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/proofbridge');
    });

    test('should load ProofBridge page', async ({ page }) => {
        await expect(page.locator('h1:has-text("ProofBridge Liner")')).toBeVisible();
    });

    test('should display 3D Canvas Globe', async ({ page }) => {
        const canvas = page.locator('canvas');
        await expect(canvas).toBeVisible();
        
        const hasContent = await canvas.evaluate((el: HTMLCanvasElement) => {
            const ctx = el.getContext('2d');
            if (!ctx) return false;
            const imageData = ctx.getImageData(0, 0, el.width, el.height);
            return imageData.data.some(pixel => pixel !== 0);
        });
        expect(hasContent).toBe(true);
    });

    test('should display terminal shell', async ({ page }) => {
        const terminal = page.locator('text=proofbridge');
        await expect(terminal).toBeVisible();
        await expect(terminal).toContainText('proofbridge');
    });

    test('should display Polygon Amoy badge', async ({ page }) => {
        const badge = page.locator('text=POLYGON AMOY');
        await expect(badge).toBeVisible();
    });

    test('should display software-attested label', async ({ page }) => {
        const attestation = page.locator('text=software-attested');
        await expect(attestation).toBeVisible();
    });

    test('should navigate back to gateway', async ({ page }) => {
        await page.click('text=RETURN TO CORE GATEWAY');
        await expect(page).toHaveURL('/');
    });
});
