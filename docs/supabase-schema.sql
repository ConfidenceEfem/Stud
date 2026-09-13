-- Run this once in your Supabase project's SQL editor (Dashboard → SQL
-- Editor → New query → paste → Run). This is the whole setup.
--
-- Already ran this before and just need the new `image` columns? Just
-- run these two lines again — CREATE TABLE below won't touch existing
-- tables, but these ALTERs will add what's missing without deleting data.
alter table if exists collections add column if not exists image text;
alter table if exists tokens add column if not exists image text;
alter table if exists tokens add column if not exists creator text;

create table if not exists collections (
  address text primary key,
  name text,
  description text,
  wallet text,
  update_authority text,
  metadata_uri text,
  image text,
  price numeric default 0,
  supply integer default 0,
  eligibility text default 'public',
  whitelist text[] default '{}',
  max_per_wallet integer default 0,
  candy_machine_address text,
  start_time timestamptz,
  end_time timestamptz,
  status text default 'live',
  updated_at timestamptz default now()
);

create table if not exists tokens (
  address text primary key,
  name text,
  ticker text,
  decimals integer default 6,
  supply numeric default 0,
  image text,
  creator text,
  updated_at timestamptz default now()
);

create table if not exists pools (
  mint_address text primary key,
  swap_account text,
  authority text,
  vault_sol text,
  vault_token text,
  pool_mint text,
  fee_account text,
  creator text,
  updated_at timestamptz default now()
);

-- Row Level Security: on by default in Supabase. This app has no backend
-- of its own and no user accounts — every read/write comes straight from
-- whoever's browser is running it, authenticated only by their wallet
-- signature (which Supabase never sees). These policies make both tables
-- fully public: anyone can read, anyone can write.
--
-- That's an intentional, stated tradeoff for a client-only app, not an
-- oversight — but it does mean anyone could insert or overwrite a row
-- (e.g. squat a collection's config, or spam fake listings) without ever
-- touching the blockchain. Real on-chain state (ownership, mint counts,
-- guard rules) is never at risk since that's enforced by Solana programs,
-- not this table — but the display metadata here (name, description,
-- which Candy Machine an address claims to belong to) could be tampered
-- with by anyone. For production, replace the public-write policies below
-- with a serverless function that verifies the deploying wallet actually
-- signed the on-chain transaction before writing the row.

alter table collections enable row level security;
alter table tokens enable row level security;
alter table pools enable row level security;

-- DROP + CREATE (instead of a plain CREATE) so this whole file is safe to
-- run more than once — re-running it after your first setup won't error
-- out on "policy already exists" the way a plain CREATE POLICY would.
drop policy if exists "public read collections" on collections;
drop policy if exists "public write collections" on collections;
drop policy if exists "public update collections" on collections;
drop policy if exists "public read tokens" on tokens;
drop policy if exists "public write tokens" on tokens;
drop policy if exists "public update tokens" on tokens;
drop policy if exists "public read pools" on pools;
drop policy if exists "public write pools" on pools;
drop policy if exists "public update pools" on pools;

create policy "public read collections" on collections for select using (true);
create policy "public write collections" on collections for insert with check (true);
create policy "public update collections" on collections for update using (true);

create policy "public read tokens" on tokens for select using (true);
create policy "public write tokens" on tokens for insert with check (true);
create policy "public update tokens" on tokens for update using (true);

create policy "public read pools" on pools for select using (true);
create policy "public write pools" on pools for insert with check (true);
create policy "public update pools" on pools for update using (true);
