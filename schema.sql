-- ===== LIFFIX GYM AI — SUPABASE SCHEMA =====
-- Run this in your Supabase SQL editor

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  age int,
  weight_kg numeric,
  height_cm numeric,
  target_weight numeric,
  goal text check (goal in ('gain','loss','maintain')),
  gym_frequency text,
  timeline text,
  plan text default 'free' check (plan in ('free','starter','pro','elite')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for all using (auth.uid() = id);

-- DIET LOGS
create table if not exists public.diet_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  meal_slot text check (meal_slot in ('morning','afternoon','evening','night','extra')),
  food_name text not null,
  calories numeric default 0,
  protein_g numeric default 0,
  carbs_g numeric default 0,
  fat_g numeric default 0,
  logged_date date default current_date,
  created_at timestamptz default now()
);
alter table public.diet_logs enable row level security;
create policy "Users manage own logs" on public.diet_logs for all using (auth.uid() = user_id);

-- SUPPLEMENT LOGS
create table if not exists public.supplement_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  supplement_name text not null,
  dose text,
  timing text,
  logged_date date default current_date,
  created_at timestamptz default now()
);
alter table public.supplement_logs enable row level security;
create policy "Users manage own supps" on public.supplement_logs for all using (auth.uid() = user_id);

-- WORKOUT LOGS
create table if not exists public.workout_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  day_name text,
  exercise_name text,
  sets int,
  reps text,
  weight_kg numeric,
  notes text,
  workout_date date default current_date,
  created_at timestamptz default now()
);
alter table public.workout_logs enable row level security;
create policy "Users manage own workouts" on public.workout_logs for all using (auth.uid() = user_id);

-- USER ACTIVITY (admin analytics)
create table if not exists public.user_activity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  page text,
  action text,
  search_term text,
  ip_address text,
  user_agent text,
  country text,
  city text,
  session_id text,
  created_at timestamptz default now()
);
alter table public.user_activity enable row level security;
create policy "Admins can view all activity" on public.user_activity for select using (true);
create policy "Users insert own activity" on public.user_activity for insert with check (auth.uid() = user_id);

-- ADMIN ROLES
create table if not exists public.admin_roles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('ceo','director','rd','coder','designer','promoter','advisor','error_searcher','rebuilder')),
  email text,
  created_at timestamptz default now()
);
alter table public.admin_roles enable row level security;
create policy "Only admins can access" on public.admin_roles for all using (
  exists (select 1 from public.admin_roles where id = auth.uid())
);

-- TEAM MEMBERS
create table if not exists public.team_members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null,
  email text unique,
  avatar_emoji text default '👤',
  created_by uuid references auth.users,
  created_at timestamptz default now()
);

-- WATER LOGS
create table if not exists public.water_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  glasses int default 0,
  log_date date default current_date,
  created_at timestamptz default now(),
  unique(user_id, log_date)
);
alter table public.water_logs enable row level security;
create policy "Users manage own water" on public.water_logs for all using (auth.uid() = user_id);

-- SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade unique,
  plan text default 'free',
  started_at timestamptz default now(),
  expires_at timestamptz,
  payment_ref text
);
alter table public.subscriptions enable row level security;
create policy "Users view own subscription" on public.subscriptions for select using (auth.uid() = user_id);

-- TRIGGER: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  insert into public.subscriptions (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- INDEXES for performance
create index if not exists diet_logs_user_date on public.diet_logs(user_id, logged_date);
create index if not exists user_activity_user on public.user_activity(user_id, created_at);
create index if not exists workout_logs_user on public.workout_logs(user_id, workout_date);
