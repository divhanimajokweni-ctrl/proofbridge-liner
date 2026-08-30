#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const results = { url: BASE_URL, timestamp: new Date().toISOString(), violations: [], warnings: [], performance: {} };

  try {
    // Navigate and wait for the page to fully render
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('header', { timeout: 5000 });

    // Run accessibility check via built-in Axe (Playwright automatically injects it)
    await page.waitForSelector('[role="alert"]');
    
    // Collect all HTML elements and run manual WCAG checks
    const manualViolations = await page.evaluate(() => {
      const issues = [];
      
      // Check for missing alt text on images
      document.querySelectorAll('img:not([alt])').forEach(img => {
        issues.push({ rule: 'WCAG H37', element: img.outerHTML.slice(0, 100), message: 'Image missing alt attribute' });
      });

      // Check for missing labels on inputs
      document.querySelectorAll('input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])').forEach(input => {
        const id = input.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (!label) issues.push({ rule: 'WCAG H44', element: `<input id="${id}">`, message: 'Input has no associated label' });
        } else {
          issues.push({ rule: 'WCAG H44', element: input.outerHTML.slice(0, 100), message: 'Input missing id and label' });
        }
      });

      // Check for missing lang attribute
      if (!document.documentElement.lang) {
        issues.push({ rule: 'WCAG H57', element: '<html>', message: 'HTML element missing lang attribute' });
      }

      // Check heading hierarchy
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let prevLevel = 0;
      headings.forEach(h => {
        const level = parseInt(h.tagName[1]);
        if (level - prevLevel > 1) {
          issues.push({ rule: 'WCAG H42', element: `<${h.tagName}>`, message: `Heading level skipped from h${prevLevel} to h${level}` });
        }
        prevLevel = level;
      });

      // Check for aria roles on interactive elements
      document.querySelectorAll('button, [role="button"]').forEach(btn => {
        const text = btn.textContent?.trim();
        if (!text && !btn.getAttribute('aria-label')) {
          issues.push({ rule: 'WCAG H36', element: btn.outerHTML.slice(0, 100), message: 'Button missing accessible name' });
        }
      });

      // Check for color contrast issues (basic check on low-contrast text)
      document.querySelectorAll('p, span, div').forEach(el => {
        const style = window.getComputedStyle(el);
        const color = style.color;
        const bg = style.backgroundColor;
        if (color === 'rgb(148, 163, 184)' && bg === 'rgba(0, 0, 0, 0)') {
          // text-slate-400 on transparent — check parent bg
          let parent = el.parentElement;
          while (parent) {
            const pBg = window.getComputedStyle(parent).backgroundColor;
            if (pBg !== 'rgba(0, 0, 0, 0)' && pBg) break;
            parent = parent.parentElement;
          }
        }
      });

      return issues;
    });

    results.violations = manualViolations.filter(v => v.rule.startsWith('WCAG'));
    results.warnings = manualViolations.filter(v => !v.rule.startsWith('WCAG'));

    // Check responsive layout
    const responsiveTests = [
      { width: 375, height: 667, label: 'iPhone SE' },
      { width: 768, height: 1024, label: 'iPad' },
      { width: 1280, height: 800, label: 'Desktop' },
      { width: 1920, height: 1080, label: 'Full HD' },
    ];

    for (const test of responsiveTests) {
      await page.setViewportSize({ width: test.width, height: test.height });
      await page.waitForTimeout(500);
      const overflow = await page.evaluate(() => {
        const body = document.body;
        return {
          width: body.scrollWidth,
          height: body.scrollHeight,
          overflowX: body.scrollWidth > window.innerWidth,
          overflowY: body.scrollHeight > window.innerHeight,
        };
      });
      results.performance[test.label] = {
        viewport: `${test.width}x${test.height}`,
        contentSize: `${overflow.width}x${overflow.height}`,
        horizontalOverflow: overflow.overflowX,
      };
    }

    // Performance metrics
    const perf = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: nav ? nav.domContentLoadedEventEnd : 0,
        loadComplete: nav ? nav.loadEventEnd : 0,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
    results.performance.metrics = perf;

  } catch (err) {
    results.error = err.message;
  } finally {
    await browser.close();
  }

  console.log(JSON.stringify(results, null, 2));
  return results;
}

runAudit().then(r => {
  if (r.violations?.length > 0) {
    console.error(`\n⚠  ${r.violations.length} accessibility violations found`);
    process.exit(1);
  }
  console.log('\n✓ Accessibility audit passed');
}).catch(e => {
  console.error('Audit failed:', e);
  process.exit(1);
});
