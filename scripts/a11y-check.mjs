#!/usr/bin/env node
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

const html = readFileSync('/tmp/page.html', 'utf-8');
const dom = new JSDOM(html);
const doc = dom.window.document;

const violations = [];

// Check html lang attribute
if (!doc.documentElement.hasAttribute('lang')) {
  violations.push({ rule: 'WCAG H57', element: '<html>', message: 'HTML element missing lang attribute' });
}

// Check main landmark
const main = doc.querySelector('main');
if (!main) {
  violations.push({ rule: 'WCAG H71', element: '<body>', message: 'No <main> landmark found' });
}

// Check all images for alt text
doc.querySelectorAll('img').forEach(img => {
  if (!img.hasAttribute('alt')) {
    violations.push({ rule: 'WCAG H37', element: img.outerHTML.slice(0, 100), message: 'Image missing alt attribute' });
  }
});

// Check all inputs for associated labels
doc.querySelectorAll('input:not([type="hidden"])').forEach(input => {
  const id = input.id;
  const ariaLabel = input.getAttribute('aria-label');
  const ariaLabelledby = input.getAttribute('aria-labelledby');
  if (!id && !ariaLabel && !ariaLabelledby) {
    violations.push({ rule: 'WCAG H44', element: input.outerHTML.slice(0, 100), message: 'Input missing accessible name (id+label, aria-label, or aria-labelledby)' });
  } else if (id && !ariaLabel && !ariaLabelledby) {
    const label = doc.querySelector(`label[for="${id}"]`);
    if (!label) {
      violations.push({ rule: 'WCAG H44', element: `<input id="${id}">`, message: `Input id="${id}" has no associated label` });
    }
  }
});

// Check buttons for accessible names
doc.querySelectorAll('button').forEach(btn => {
  const text = btn.textContent.trim();
  const ariaLabel = btn.getAttribute('aria-label');
  if (!text && !ariaLabel) {
    violations.push({ rule: 'WCAG H36', element: btn.outerHTML.slice(0, 100), message: 'Button missing accessible name' });
  }
});

// Check heading hierarchy
const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
let prevLevel = 0;
headings.forEach(h => {
  const level = parseInt(h.tagName[1]);
  if (level - prevLevel > 1 && prevLevel > 0) {
    violations.push({ rule: 'WCAG H42', element: `<${h.tagName}>`, message: `Heading level skipped from h${prevLevel} to h${level}: "${h.textContent.trim().slice(0, 50)}"` });
  }
  prevLevel = level;
});

// Check for role="alert" (our simulated data banner)
const alertBanner = doc.querySelector('[role="alert"]');
if (alertBanner) {
  console.log('✓ Simulated data banner present with role="alert"');
}

// Check for aria-live regions
const liveRegions = doc.querySelectorAll('[aria-live]');
console.log(`✓ ${liveRegions.length} aria-live regions found`);

// Check for aria-pressed on role switcher
const pressedBtns = doc.querySelectorAll('[aria-pressed]');
console.log(`✓ ${pressedBtns.length} aria-pressed buttons found`);

// Check for sr-only label
const srOnly = doc.querySelectorAll('.sr-only');
console.log(`✓ ${srOnly.length} screen-reader-only labels found`);

// Report
if (violations.length === 0) {
  console.log('\n✓ Zero WCAG accessibility violations in page content');
} else {
  console.log(`\n⚠ ${violations.length} WCAG violations found:`);
  violations.forEach(v => console.log(`  - [${v.rule}] ${v.message}`));
}

// Check for h1
const h1 = doc.querySelector('h1');
if (h1) {
  console.log(`✓ Page has h1: "${h1.textContent.trim()}"`);
} else {
  violations.push({ rule: 'WCAG', message: 'Page is missing h1 heading' });
}

process.exit(violations.length > 0 ? 1 : 0);
