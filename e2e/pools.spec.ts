import { test, expect } from '@playwright/test';

test.describe('Ubuntu Pools', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/pools');
    });

    test('should load pools page', async ({ page }) => {
        await expect(page.locator('h1:has-text("Ubuntu Pools")')).toBeVisible();
    });

    test('should display Ant Telemetry pipeline', async ({ page }) => {
        const pipeline = page.locator('text=Ant Stack Queue Engine');
        await expect(pipeline).toBeVisible();
    });

    test('should display progress bar', async ({ page }) => {
        const progress = page.locator('[style*="background: linear-gradient"]');
        await expect(progress).toBeVisible();
    });

    test('should display Ubuntu Score ring', async ({ page }) => {
        const score = page.locator('text=Reputation Score');
        await expect(score).toBeVisible();
    });

    test('should have DEMO/SIMULATED labels', async ({ page }) => {
        const demoLabels = page.locator('text=DEMO');
        const simulatedLabels = page.locator('text=SIMULATED');
        await expect(demoLabels.first()).toBeVisible();
        await expect(simulatedLabels.first()).toBeVisible();
    });

    test('should navigate back to gateway', async ({ page }) => {
        await page.click('text=RETURN TO CORE GATEWAY');
        await expect(page).toHaveURL('/');
    });
});
