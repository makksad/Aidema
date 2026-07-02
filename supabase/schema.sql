-- AIDEMA Catalog — Phase 2
-- Выполните этот файл вручную в Supabase Dashboard → SQL Editor.
-- Перед запуском прочитайте блок "Создание первого администратора" в конце файла.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  brand text not null,
  name text not null,
  category text not null,
  category_label text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  old_price integer null check (old_price is null or old_price >= 0),
  in_stock boolean not null default true,
  badges jsonb not null default '[]'::jsonb,
  image text not null default '',
  colors jsonb not null default '[]'::jsonb,
  images_by_color jsonb not null default '{}'::jsonb,
  specs jsonb not null default '[]'::jsonb,
  image_alt text not null default '',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_published_sort_idx
  on public.products (is_published, sort_order);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.order_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid null references public.products(id) on delete set null,
  product_slug text,
  product_name text,
  brand text,
  category text,
  selected_color text,
  price integer check (price is null or price >= 0),
  source text not null default 'whatsapp',
  page_url text,
  user_agent text null,
  created_at timestamptz not null default now()
);

create index if not exists order_requests_created_at_idx
  on public.order_requests (created_at desc);

create schema if not exists private;
grant usage on schema private to authenticated;

-- SECURITY DEFINER нужен, чтобы проверка admin_users не вызвала рекурсию RLS.
-- Функция возвращает только true/false и не раскрывает список администраторов.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.admin_users enable row level security;
alter table public.order_requests enable row level security;

-- Явные права Postgres. Реальный доступ дополнительно ограничивают политики RLS ниже.
revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

revoke all on table public.order_requests from anon, authenticated;
grant insert on table public.order_requests to anon, authenticated;
grant select on table public.order_requests to authenticated;

drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products"
on public.products
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "Admins can read all products" on public.products;
create policy "Admins can read all products"
on public.products
for select
to authenticated
using ((select private.is_admin()));

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
on public.products
for insert
to authenticated
with check ((select private.is_admin()));

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products
for delete
to authenticated
using ((select private.is_admin()));

-- Авторизованный пользователь видит только собственную запись администратора.
-- Добавлять себя в admin_users через браузер он не может: INSERT/UPDATE/DELETE не выданы.
drop policy if exists "Admin can read own membership" on public.admin_users;
create policy "Admin can read own membership"
on public.admin_users
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Public can create WhatsApp requests" on public.order_requests;
create policy "Public can create WhatsApp requests"
on public.order_requests
for insert
to anon, authenticated
with check (source = 'whatsapp');

drop policy if exists "Admins can read WhatsApp requests" on public.order_requests;
create policy "Admins can read WhatsApp requests"
on public.order_requests
for select
to authenticated
using ((select private.is_admin()));

-- Storage bucket для публичных фотографий товаров.
-- Файлы можно читать по public URL, а изменять — только администратору.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  1048576,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (select private.is_admin())
);

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and (select private.is_admin())
)
with check (
  bucket_id = 'product-images'
  and (select private.is_admin())
);

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (select private.is_admin())
);

-- Удаляем helper Phase 1 из exposed-схемы после перевода всех policies в private.
drop function if exists public.is_admin();

-- ---------------------------------------------------------------------------
-- СОЗДАНИЕ ПЕРВОГО АДМИНИСТРАТОРА — выполнить вручную после создания пользователя
-- в Supabase Dashboard → Authentication → Users.
-- Замените email и запустите этот запрос отдельно в SQL Editor:
--
-- insert into public.admin_users (user_id, email)
-- select id, email
-- from auth.users
-- where email = 'admin@example.com'
-- on conflict (user_id) do update set email = excluded.email;
-- ---------------------------------------------------------------------------
