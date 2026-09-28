-- Hashes and counters only. No recipient addresses, message bodies, or IP addresses.
create table if not exists blocked_recipients (
  email_hash text primary key,
  created_at timestamptz not null default now()
);

create table if not exists send_events (
  id bigserial primary key,
  signal_hash text not null,
  recipient_hash text not null,
  message_fingerprint text not null,
  created_at timestamptz not null default now()
);

create index if not exists send_events_signal_created_idx
  on send_events (signal_hash, created_at desc);

create index if not exists send_events_dup_idx
  on send_events (recipient_hash, message_fingerprint, created_at desc);

create table if not exists reports (
  id bigserial primary key,
  report_key text not null unique,
  category text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists product_counters (
  name text primary key,
  count bigint not null default 0
);
