#!/usr/bin/env node
/**
 * Customer 360 — Intercom profile aggregator
 *
 * Usage:
 *   node customer-360.mjs <email-or-company>
 *   INTERCOM_TOKEN=... node customer-360.mjs --company AcmeCorp
 *   node customer-360.mjs --json user@example.com   (raw JSON output)
 */

import https from 'node:https';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const API_BASE = 'https://api.intercom.io';
const ACCESS_TOKEN = process.env.INTERCOM_TOKEN;
const OUTPUT_LIMIT = 15;
const MAX_CONVERSATION_PAGES = 10;

if (!ACCESS_TOKEN) {
  console.error('Error: INTERCOM_TOKEN environment variable is required.');
  process.exit(1);
}

const args = process.argv.slice(2);
let mode = 'email';
let query = '';

for (const arg of args) {
  if (arg === '--company') {
    mode = 'company';
    continue;
  }
  if (arg === '--json') {
    mode = mode === 'company' ? 'company-json' : 'email-json';
    continue;
  }
  query = arg;
}

if (!query) {
  console.error('Usage: node customer-360.mjs [--company] [--json] <email_or_company>');
  process.exit(1);
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${text.slice(0, 500)}`));
          return;
        }
        try {
          resolve(JSON.parse(text));
        } catch {
          resolve(text);
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function searchContacts(query) {
  const params = new URLSearchParams();
  params.set('query', JSON.stringify({ field: 'email', operator: '~', value: query }));
  const data = await request('GET', `/contacts?${params.toString()}`);
  return data.data ?? [];
}

async function searchContactsByDomain(domain) {
  const data = await request('GET', `/contacts?query=${encodeURIComponent(JSON.stringify({ field: 'email', operator: '~', value: '@' + domain }))}`);
  return data.data ?? [];
}

async function getContact(id) {
  return request('GET', `/contacts/${encodeURIComponent(id)}`);
}

async function searchConversations(contactId) {
  const params = new URLSearchParams();
  params.set('contact_id', contactId);
  params.set('per_page', '50');
  params.set('page', '1');
  const data = await request('GET', `/conversations?${params.toString()}`);
  return data;
}

async function getConversation(id) {
  return request('GET', `/conversations/${encodeURIComponent(id)}`);
}

async function getCompany(id) {
  return request('GET', `/companies/${encodeURIComponent(id)}`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function paginateConversations(contactId) {
  let all = [];
  let page = 1;
  for (let i = 0; i < MAX_CONVERSATION_PAGES; i++) {
    const data = await searchConversations(contactId);
    const conversations = data.data ?? [];
    all = all.concat(conversations);
    const pages = data.pages ?? {};
    if (!pages.next || pages.next === '') break;
    page++;
    await delay(200);
  }
  return all;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return String(iso);
  }
}

function renderProfile(contact, conversations, companies) {
  const attr = contact.attributes ?? {};
  const nameSource = [attr.first_name, attr.last_name].filter(Boolean).join(' ') || 'Unknown';
  const name = contact.name ?? nameSource;
  const email = contact.email ?? '—';
  const companyName = companies?.[0]?.name || '—';
  const segments = (contact.segments ?? []).map((s) => s.name ?? s.id ?? s).join(', ');
  const segmentsFinal = segments || '—';
  const tags = (attr.tags ?? []).map((t) => (typeof t === 'string' ? t : t.name ?? t.id ?? JSON.stringify(t))).join(', ');
  const tagsFinal = tags || '—';

  const lines = [
    '# Customer 360 Profile',
    '',
    `**ID:** ${contact.id}`,
    `**Name:** ${name}`,
    `**Email:** ${email}`,
    `**Role:** ${contact.role ?? '—'}`,
    `**Company:** ${companyName}`,
    `**Location:** ${attr.location ?? '—'}`,
    `**Timezone:** ${attr.timezone ?? '—'}`,
    `**Last seen:** ${formatDate(attr.last_seen_at)}`,
    `**Tags:** ${tagsFinal}`,
    `**Segments:** ${segmentsFinal}`,
    '',
    '---',
    '',
    '## Conversation History',
    '',
    `**Total conversations:** ${conversations.length}`,
    '',
    '| ID | Subject | State | Channel | Date |',
    '| --- | --- | --- | --- | --- |',
  ];

  const recent = conversations.slice(0, OUTPUT_LIMIT);
  for (const c of recent) {
    const source = c.source ?? c.channel ?? '—';
    const state = c.state ?? '—';
    const subject = c.title ?? c.subject ?? '—';
    const date = formatDate(c.created_at ?? c.updated_at);
    lines.push(`| ${c.id} | ${subject} | ${state} | ${source} | ${date} |`);
  }

  if (conversations.length > OUTPUT_LIMIT) {
    lines.push('');
    lines.push(`*Showing ${OUTPUT_LIMIT} of ${conversations.length} total conversations.*`);
  }

  const openConversations = conversations.filter((c) => ['open', 'snoozed'].includes((c.state ?? '').toLowerCase()));
  if (openConversations.length) {
    lines.push('');
    lines.push('### Open Items');
    for (const c of openConversations) {
      lines.push(`- [${c.state.toUpperCase()}] #${c.id}: ${c.title ?? c.subject ?? '—'} (${formatDate(c.updated_at)})`);
    }
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Next Steps');
  lines.push('- Pick a conversation ID above to pull the full thread with `get_conversation`.');
  lines.push(`- Search similar customers by company: ${companyName}`);
  lines.push('- Check tags/segments for lifecycle-driven campaigns.');

  return lines.join('\n');
}

async function main() {
  try {
    let contacts = [];
    if (mode === 'company') {
      const domain = query.replace(/^@/, '');
      contacts = await searchContactsByDomain(domain);
    } else {
      contacts = await searchContacts(query);
    }

    if (!contacts.length) {
      console.error(`No contact found for query: ${query}`);
      process.exit(1);
    }

    const contact = contacts[0];
    const fullContact = await getContact(contact.id);
    const companyIds = fullContact.companies?.map((c) => c.company?.id ?? c.id).filter(Boolean) ?? [];
    const companies = await Promise.all(companyIds.map((id) => getCompany(id).catch(() => null)));

    const conversations = await paginateConversations(fullContact.id);

    if (mode === 'email-json' || mode === 'company-json') {
      console.log(
        JSON.stringify(
          {
            contact: fullContact,
            companies: companies.filter(Boolean),
            conversations,
          },
          null,
          2
        )
      );
      return;
    }

    const profile = renderProfile(fullContact, conversations, companies.filter(Boolean));
    console.log(profile);
  } catch (err) {
    console.error(`Customer 360 failed: ${err.message}`);
    process.exit(1);
  }
}

main();
