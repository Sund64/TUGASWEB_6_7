create extension if not exists pgcrypto with schema extensions;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  constraint app_users_username_length check (
    char_length(btrim(username)) between 3 and 50
  )
);

create unique index if not exists app_users_username_lower_idx
  on public.app_users (lower(username));

create table if not exists public.app_sessions (
  token_hash text primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
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

alter table public.transactions
  drop constraint if exists transactions_user_id_fkey;

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc, created_at desc);

alter table public.transactions enable row level security;

drop policy if exists "Users can read their transactions" on public.transactions;
drop policy if exists "Users can insert their transactions" on public.transactions;
revoke all on table public.app_users, public.app_sessions, public.transactions
  from public, anon, authenticated;

create or replace function public.app_login(p_username text, p_password text)
returns table (session_token text, username text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.app_users%rowtype;
  v_token text;
begin
  if p_username is null or p_password is null then
    return;
  end if;

  select u.*
    into v_user
    from public.app_users as u
    where lower(u.username) = lower(btrim(p_username))
      and extensions.crypt(p_password, u.password_hash) = u.password_hash;

  if not found then
    return;
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  delete from public.app_sessions
    where user_id = v_user.id
      and expires_at <= now();

  insert into public.app_sessions (token_hash, user_id, expires_at)
    values (
      encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex'),
      v_user.id,
      now() + interval '12 hours'
    );

  return query select v_token, v_user.username;
end;
$$;

create or replace function public.app_register(p_username text, p_password text)
returns table (session_token text, username text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.app_users%rowtype;
  v_token text;
begin
  if p_username is null
    or char_length(btrim(p_username)) < 3
    or char_length(btrim(p_username)) > 50 then
    raise exception 'Username harus terdiri dari 3 sampai 50 karakter.'
      using errcode = '22023';
  end if;

  if p_password is null
    or char_length(p_password) < 8
    or octet_length(convert_to(p_password, 'UTF8')) > 72 then
    raise exception 'Kata sandi harus minimal 8 karakter dan maksimal 72 byte.'
      using errcode = '22023';
  end if;

  insert into public.app_users (username, password_hash)
    values (
      btrim(p_username),
      extensions.crypt(p_password, extensions.gen_salt('bf'))
    )
    returning * into v_user;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.app_sessions (token_hash, user_id, expires_at)
    values (
      encode(extensions.digest(convert_to(v_token, 'UTF8'), 'sha256'), 'hex'),
      v_user.id,
      now() + interval '12 hours'
    );

  return query select v_token, v_user.username;
exception
  when unique_violation then
    raise exception 'Username sudah digunakan.'
      using errcode = '23505';
end;
$$;

create or replace function public.app_session_user_id(p_session_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  if p_session_token is null or p_session_token = '' then
    raise exception 'Sesi login tidak valid. Silakan masuk kembali.'
      using errcode = '28000';
  end if;

  select s.user_id
    into v_user_id
    from public.app_sessions as s
    where s.token_hash = encode(
      extensions.digest(convert_to(p_session_token, 'UTF8'), 'sha256'),
      'hex'
    )
      and s.expires_at > now();

  if v_user_id is null then
    raise exception 'Sesi login telah berakhir. Silakan masuk kembali.'
      using errcode = '28000';
  end if;

  return v_user_id;
end;
$$;

create or replace function public.app_get_transactions(p_session_token text)
returns setof public.transactions
language sql
security definer
set search_path = ''
as $$
  select t.*
    from public.transactions as t
    where t.user_id = public.app_session_user_id(p_session_token)
    order by t.date desc, t.created_at desc;
$$;

create or replace function public.app_create_transaction(
  p_session_token text,
  p_title text,
  p_category text,
  p_type text,
  p_amount bigint,
  p_original_amount numeric,
  p_currency text,
  p_exchange_rate numeric,
  p_date date
)
returns setof public.transactions
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
    insert into public.transactions (
      user_id,
      title,
      category,
      type,
      amount,
      original_amount,
      currency,
      exchange_rate,
      date
    )
    values (
      public.app_session_user_id(p_session_token),
      p_title,
      p_category,
      p_type,
      p_amount,
      p_original_amount,
      p_currency,
      p_exchange_rate,
      p_date
    )
    returning *;
end;
$$;

create or replace function public.app_logout(p_session_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.app_sessions
    where token_hash = encode(
      extensions.digest(convert_to(p_session_token, 'UTF8'), 'sha256'),
      'hex'
    );
$$;

revoke all on function public.app_login(text, text) from public, anon, authenticated;
revoke all on function public.app_register(text, text) from public, anon, authenticated;
revoke all on function public.app_session_user_id(text) from public, anon, authenticated;
revoke all on function public.app_get_transactions(text) from public, anon, authenticated;
revoke all on function public.app_create_transaction(
  text, text, text, text, bigint, numeric, text, numeric, date
) from public, anon, authenticated;
revoke all on function public.app_logout(text) from public, anon, authenticated;

grant execute on function public.app_login(text, text) to anon, authenticated;
grant execute on function public.app_register(text, text) to anon, authenticated;
grant execute on function public.app_get_transactions(text) to anon, authenticated;
grant execute on function public.app_create_transaction(
  text, text, text, text, bigint, numeric, text, numeric, date
) to anon, authenticated;
grant execute on function public.app_logout(text) to anon, authenticated;
