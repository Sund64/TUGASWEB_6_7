create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 60),
  category text not null check (char_length(btrim(category)) between 1 and 40),
  type text not null check (type in ('income', 'expense')),
  amount bigint not null check (amount > 0),
  original_amount numeric(18, 2) not null check (original_amount > 0),
  currency text not null check (char_length(currency) = 3),
  exchange_rate numeric(20, 10) not null check (exchange_rate > 0),
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc, created_at desc);

alter table public.transactions enable row level security;

drop policy if exists "Users can read their transactions" on public.transactions;
create policy "Users can read their transactions"
  on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their transactions" on public.transactions;
create policy "Users can insert their transactions"
  on public.transactions for insert to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert on public.transactions to authenticated;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nim text not null check (char_length(btrim(nim)) > 0),
  name text not null check (char_length(btrim(name)) > 0),
  program text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, nim)
);

create index if not exists students_user_name_idx
  on public.students (user_id, name);

alter table public.students enable row level security;

drop policy if exists "Users can read their students" on public.students;
create policy "Users can read their students"
  on public.students for select to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.students to authenticated;
