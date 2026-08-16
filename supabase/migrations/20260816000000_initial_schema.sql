create type public.document_type as enum ('article', 'pdf');
create type public.document_status as enum ('unread', 'read', 'starred', 'archived');
create type public.ingestion_source as enum ('extension', 'manual_url', 'file_upload');
create type public.job_status as enum ('pending', 'processing', 'succeeded', 'failed');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.document_type not null,
  status public.document_status not null default 'unread',
  source public.ingestion_source not null default 'manual_url',
  title text not null check (length(btrim(title)) between 1 and 500),
  author text,
  site_name text,
  source_url text,
  canonical_pdf_url text,
  content_html text,
  content_text text not null default '',
  excerpt text,
  raw_file_path text,
  raw_file_size_bytes bigint check (raw_file_size_bytes is null or raw_file_size_bytes between 0 and 52428800),
  page_count integer check (page_count is null or page_count > 0),
  cover_image_path text,
  reading_time_minutes integer not null default 0 check (reading_time_minutes >= 0),
  fts tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(author, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(content_text, '')), 'C')
  ) stored,
  starred_at timestamptz,
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint documents_article_content_check check (type <> 'article' or raw_file_path is null),
  constraint documents_pdf_file_check check (type <> 'pdf' or content_html is null)
);

create table public.document_images (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  original_url text,
  storage_path text not null check (length(btrim(storage_path)) > 0),
  position integer not null default 0 check (position >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  size_bytes integer check (size_bytes is null or size_bytes >= 0),
  format text not null default 'webp' check (format = 'webp'),
  created_at timestamptz not null default now(),
  constraint document_images_document_owner_fkey
    foreign key (document_id, user_id)
    references public.documents (id, user_id)
    on delete cascade,
  unique (document_id, position)
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 60),
  color text not null default '#B5502E' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);

create table public.document_tags (
  document_id uuid not null,
  tag_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (document_id, tag_id),
  constraint document_tags_document_owner_fkey
    foreign key (document_id, user_id)
    references public.documents (id, user_id)
    on delete cascade,
  constraint document_tags_tag_owner_fkey
    foreign key (tag_id, user_id)
    references public.tags (id, user_id)
    on delete cascade
);

create table public.ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id uuid,
  input_url text,
  status public.job_status not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  constraint ingestion_jobs_document_owner_fkey
    foreign key (document_id, user_id)
    references public.documents (id, user_id)
    on delete cascade,
  constraint ingestion_jobs_state_check check (
    (status = 'pending' and started_at is null and finished_at is null) or
    (status = 'processing' and started_at is not null and finished_at is null) or
    (status in ('succeeded', 'failed') and started_at is not null and finished_at is not null)
  ),
  constraint ingestion_jobs_error_check check (status = 'failed' or error_message is null),
  constraint ingestion_jobs_input_check check (input_url is not null or document_id is not null)
);

create index documents_fts_idx on public.documents using gin (fts);
create index documents_user_created_idx on public.documents (user_id, created_at desc);
create index documents_user_type_created_idx on public.documents (user_id, type, created_at desc);
create index documents_user_status_created_idx on public.documents (user_id, status, created_at desc);
create unique index documents_user_source_url_unique
  on public.documents (user_id, source_url)
  where source_url is not null;
create index document_images_user_id_idx on public.document_images (user_id);
create index tags_user_id_idx on public.tags (user_id);
create index document_tags_user_id_idx on public.document_tags (user_id);
create index document_tags_tag_id_idx on public.document_tags (tag_id);
create index ingestion_jobs_user_status_created_idx
  on public.ingestion_jobs (user_id, status, created_at desc);
create index ingestion_jobs_document_id_idx
  on public.ingestion_jobs (document_id)
  where document_id is not null;

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create function public.search_documents(search_query text, result_limit integer default 20)
returns table (
  id uuid,
  type public.document_type,
  status public.document_status,
  title text,
  author text,
  site_name text,
  excerpt text,
  reading_time_minutes integer,
  created_at timestamptz,
  rank real
)
language sql
stable
security invoker
set search_path = ''
as $$
  with query as (
    select websearch_to_tsquery('simple', btrim(search_query)) as value
  )
  select
    d.id, d.type, d.status, d.title, d.author, d.site_name, d.excerpt,
    d.reading_time_minutes, d.created_at,
    ts_rank_cd(d.fts, query.value, 32)::real as rank
  from public.documents d
  cross join query
  where d.user_id = (select auth.uid())
    and length(btrim(search_query)) > 0
    and d.fts @@ query.value
  order by rank desc, d.created_at desc
  limit least(greatest(result_limit, 1), 50);
$$;

alter table public.documents enable row level security;
alter table public.document_images enable row level security;
alter table public.tags enable row level security;
alter table public.document_tags enable row level security;
alter table public.ingestion_jobs enable row level security;

create policy "documents_select_own" on public.documents for select to authenticated
using ((select auth.uid()) = user_id);
create policy "documents_insert_own" on public.documents for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "documents_update_own" on public.documents for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "documents_delete_own" on public.documents for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "document_images_select_own" on public.document_images for select to authenticated
using ((select auth.uid()) = user_id);
create policy "document_images_insert_own" on public.document_images for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "document_images_update_own" on public.document_images for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "document_images_delete_own" on public.document_images for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "tags_select_own" on public.tags for select to authenticated
using ((select auth.uid()) = user_id);
create policy "tags_insert_own" on public.tags for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "tags_update_own" on public.tags for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tags_delete_own" on public.tags for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "document_tags_select_own" on public.document_tags for select to authenticated
using ((select auth.uid()) = user_id);
create policy "document_tags_insert_own" on public.document_tags for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "document_tags_delete_own" on public.document_tags for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "ingestion_jobs_select_own" on public.ingestion_jobs for select to authenticated
using ((select auth.uid()) = user_id);
create policy "ingestion_jobs_insert_own" on public.ingestion_jobs for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "ingestion_jobs_update_own" on public.ingestion_jobs for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ingestion_jobs_delete_own" on public.ingestion_jobs for delete to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('raw-documents', 'raw-documents', false, 52428800, array['application/pdf']),
  ('article-images', 'article-images', false, 15728640, array['image/webp']),
  ('covers', 'covers', false, 15728640, array['image/webp']);

create policy "storage_select_own" on storage.objects for select to authenticated
using (
  bucket_id in ('raw-documents', 'article-images', 'covers')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "storage_insert_own" on storage.objects for insert to authenticated
with check (
  bucket_id in ('raw-documents', 'article-images', 'covers')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "storage_update_own" on storage.objects for update to authenticated
using (
  bucket_id in ('raw-documents', 'article-images', 'covers')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('raw-documents', 'article-images', 'covers')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy "storage_delete_own" on storage.objects for delete to authenticated
using (
  bucket_id in ('raw-documents', 'article-images', 'covers')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

revoke all on function public.search_documents(text, integer) from public, anon;
grant execute on function public.search_documents(text, integer) to authenticated;
