-- THE DEMIGOD ARCHIVES / Supabase schema
-- Execute este arquivo no SQL Editor do seu projeto Supabase.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'player' check (role in ('player','admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null, nickname text, age text, parent_god text, cabin text, weapon text,
  personality text, abilities text, strengths text, weaknesses text, fear text, desire text, fun_facts text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, content text, mood text, created_at timestamptz not null default now()
);
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, description text, category text, created_at timestamptz not null default now()
);
create table if not exists public.relations (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  character_name text not null, relation_type text, notes text, created_at timestamptz not null default now()
);
create table if not exists public.board_posts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  body text not null, display_name text, created_at timestamptz not null default now()
);
create table if not exists public.oracle_responses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(), name text not null, description text, icon text default 'award'
);
create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(), unique(user_id,achievement_id)
);

-- RLS: cada jogador só altera seus próprios dados; mural é coletivo.
alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.journal_entries enable row level security;
alter table public.inventory_items enable row level security;
alter table public.relations enable row level security;
alter table public.board_posts enable row level security;
alter table public.oracle_responses enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

create policy "profile read own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profile update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles public names for board" on public.profiles for select to authenticated using (true);

create policy "characters own all" on public.characters for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "journal own all" on public.journal_entries for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "inventory own all" on public.inventory_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "relations own all" on public.relations for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "oracle own all" on public.oracle_responses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "board read authenticated" on public.board_posts for select to authenticated using (true);
create policy "board insert own" on public.board_posts for insert to authenticated with check (user_id = auth.uid());
create policy "board delete own" on public.board_posts for delete to authenticated using (user_id = auth.uid());

create policy "achievements read authenticated" on public.achievements for select to authenticated using (true);
create policy "user achievements read authenticated" on public.user_achievements for select to authenticated using (true);

insert into public.achievements(name,description,icon) values
('Recém-chegado','Registrou seu primeiro arquivo pessoal.','user-plus'),
('Cronista','Manteve um diário de bordo.','book-open'),
('Primeira relíquia','Adicionou um item ao inventário.','package'),
('Voz do acampamento','Publicou no mural coletivo.','message-square')
on conflict do nothing;

-- Após criar sua conta, promova-a a administradora substituindo o e-mail:
-- update public.profiles set role='admin'
-- where id=(select id from auth.users where email='SEU_EMAIL_AQUI');
