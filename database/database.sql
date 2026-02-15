-- ================================
-- EXTENSIONS
-- ================================
create extension if not exists "pgcrypto";

-- ================================
-- PROFILES TABLE (Auth Extension)
-- ================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'viewer',
  school_id uuid,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Profile RLS
create policy "Profiles: read own"
on public.profiles
for select
using (auth.uid() = id);

create policy "Profiles: update own"
on public.profiles
for update
using (auth.uid() = id);

-- ================================
-- SCHOOLS TABLE
-- ================================
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  address text,
  phone text,
  email text,
  opening_cash numeric default 0,
  opening_bank numeric default 0,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

alter table public.schools enable row level security;

-- Schools RLS
create policy "Schools: insert authenticated"
on public.schools
for insert
with check (auth.uid() = created_by);

create policy "Schools: read own"
on public.schools
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.school_id = schools.id
  )
);

create policy "Schools: update by owner"
on public.schools
for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.school_id = schools.id
      and p.role = 'owner'
  )
);

-- ================================
-- AUTO LINK SCHOOL CREATOR → OWNER
-- ================================
create or replace function public.assign_school_owner()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles
  set
    school_id = new.id,
    role = 'owner'
  where id = new.created_by;

  return new;
end;
$$;

create trigger on_school_created
after insert on public.schools
for each row
execute function public.assign_school_owner();

-- ================================
-- ROJMEL ENTRIES TABLE
-- ================================
create table if not exists public.rojmel_entries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  entry_date date not null,
  description text,
  amount numeric not null check (amount > 0),
  entry_type text not null,
  payment_mode text not null,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

alter table public.rojmel_entries enable row level security;

-- ================================
-- ROJMEL RLS POLICIES
-- ================================
create policy "Rojmel: read own school"
on public.rojmel_entries
for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.school_id = rojmel_entries.school_id
  )
);

create policy "Rojmel: insert by owner or accountant"
on public.rojmel_entries
for insert
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.school_id = rojmel_entries.school_id
      and p.role in ('owner', 'accountant')
  )
);

-- ================================
-- DATA CONSTRAINTS
-- ================================
alter table public.profiles
add constraint role_check
check (role in ('owner', 'accountant', 'viewer'));

alter table public.rojmel_entries
add constraint entry_type_check
check (entry_type in ('IN', 'OUT'));

alter table public.rojmel_entries
add constraint payment_mode_check
check (payment_mode in ('CASH', 'BANK', 'UPI'));

-- ================================
-- INDEXES (PERFORMANCE)
-- ================================
create index if not exists idx_profiles_school_id
on public.profiles (school_id);

create index if not exists idx_rojmel_school_date
on public.rojmel_entries (school_id, entry_date);

create index if not exists idx_rojmel_created_by
on public.rojmel_entries (created_by);

-- ================================
-- SAFETY: BLOCK PUBLIC ACCESS
-- ================================
revoke all on public.profiles from anon;
revoke all on public.schools from anon;
revoke all on public.rojmel_entries from anon;
