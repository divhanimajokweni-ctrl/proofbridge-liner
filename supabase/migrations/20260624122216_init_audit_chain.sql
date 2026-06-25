-- receipts table
create table receipts (
  id uuid primary key default gen_random_uuid(),
  prev_hash text,
  receipt_hash text not null,
  chain_hash text not null,
  payload jsonb not null,
  key_id text not null,
  signature text not null,
  created_at timestamptz default now()
);

-- replay protection table
create table replay_guard (
  nonce text primary key,
  created_at timestamptz default now()
);

alter table receipts enable row level security;

-- allow insert only
create policy "insert_receipts"
on receipts
for insert
with check (true);

-- disallow updates/deletes
create policy "no_update_receipts"
on receipts
for update using (false);

create policy "no_delete_receipts"
on receipts
for delete using (false);

-- allow read for authenticated users
create policy "read_receipts"
on receipts
for select
using (auth.role() = 'authenticated');
