-- Green Energy Dashboard: roluri admin / user
-- Rulează în Supabase Dashboard -> SQL Editor.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
drop policy if exists "Users can read own role" on public.user_roles;
create policy "Users can read own role" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);
revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;

create or replace function public.assign_default_user_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_roles (user_id, role) values (new.id, 'user')
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_assign_role on auth.users;
create trigger on_auth_user_created_assign_role after insert on auth.users
  for each row execute procedure public.assign_default_user_role();

-- Completează rolul pentru conturile existente.
insert into public.user_roles (user_id, role) select id, 'user' from auth.users
  on conflict (user_id) do nothing;

-- Pentru a promova primul administrator, execută separat după înlocuirea emailului:
-- update public.user_roles ur set role = 'admin'
-- from auth.users au where au.id = ur.user_id
-- and lower(au.email) = lower('EMAILUL_TAU');