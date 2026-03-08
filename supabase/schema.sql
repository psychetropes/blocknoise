-- blocknoise database schema for supabase
-- run this in the supabase sql editor to set up the database

-- usis table
create table if not exists usis (
  id               uuid primary key default gen_random_uuid(),
  wallet_address   text not null,
  arweave_url      text not null,
  metadata_url     text not null,
  mint_address     text not null,
  tier             text check (tier in ('standard', 'pro')) not null,
  genre            text not null,
  spatial_path     jsonb,
  catalog_number   serial not null,
  stem_urls        text[],
  created_at       timestamptz default now()
);

-- votes table
create table if not exists votes (
  id               uuid primary key default gen_random_uuid(),
  usi_id           uuid references usis(id),
  voter_wallet     text not null,
  voter_has_skr    boolean default false,
  created_at       timestamptz default now(),
  unique(usi_id, voter_wallet)
);

-- genres table
create table if not exists genres (
  id   serial primary key,
  name text not null unique
);

-- leaderboard view (skr votes weighted x2)
create or replace view leaderboard as
  select
    u.id,
    u.wallet_address,
    u.arweave_url,
    u.tier,
    u.genre,
    u.catalog_number,
    u.spatial_path,
    u.stem_urls,
    u.created_at,
    coalesce(sum(case when v.voter_has_skr then 2 else 1 end), 0) as score,
    count(v.id) as vote_count
  from usis u
  left join votes v on v.usi_id = u.id
  group by u.id
  order by score desc;

-- seed genres
insert into genres (name) values
  ('ambient'),
  ('asmr'),
  ('avant-pop'),
  ('breakcore'),
  ('dark ambient'),
  ('deconstructed club'),
  ('doom'),
  ('drone'),
  ('easy listening'),
  ('electroacoustic'),
  ('esoteric'),
  ('experimental pop'),
  ('field recording'),
  ('folklore'),
  ('free improvisation'),
  ('glitch'),
  ('glossolalia'),
  ('gothic'),
  ('harsh noise'),
  ('hauntology'),
  ('hip hop'),
  ('idm'),
  ('industrial'),
  ('jazz'),
  ('lo-fi'),
  ('lowercase'),
  ('math rock'),
  ('metal'),
  ('minimalism'),
  ('musique concrète'),
  ('new age'),
  ('no wave'),
  ('noise wall'),
  ('noisecore'),
  ('plunderphonics'),
  ('power electronics'),
  ('psychedelic'),
  ('ritual'),
  ('sludge'),
  ('sound art'),
  ('spoken word'),
  ('systems music')
on conflict (name) do nothing;

-- row level security
alter table usis enable row level security;
alter table votes enable row level security;
alter table genres enable row level security;

-- rls policies: public read, authenticated insert
create policy "usis are publicly readable" on usis for select using (true);
create policy "votes are publicly readable" on votes for select using (true);
create policy "genres are publicly readable" on genres for select using (true);

-- ══════════════════════════════════════════════════════════════
-- migration: run against existing database (safe to re-run)
-- ══════════════════════════════════════════════════════════════
-- allow multiple mints per wallet
alter table usis drop constraint if exists usis_wallet_address_key;
-- add catalog numbering
alter table usis add column if not exists catalog_number serial not null;
-- add stem urls for pro multi-stem tracks
alter table usis add column if not exists stem_urls text[];
