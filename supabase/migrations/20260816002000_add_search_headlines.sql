drop function if exists public.search_documents(text, integer);

create function public.search_documents(search_query text, result_limit integer default 20)
returns table (
  id uuid,
  type public.document_type,
  status public.document_status,
  title text,
  highlighted_title text,
  author text,
  site_name text,
  excerpt text,
  headline text,
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
    d.id,
    d.type,
    d.status,
    d.title,
    ts_headline(
      'simple',
      d.title,
      query.value,
      'StartSel=<b>, StopSel=</b>, HighlightAll=true'
    ) as highlighted_title,
    d.author,
    d.site_name,
    d.excerpt,
    ts_headline(
      'simple',
      coalesce(nullif(d.content_text, ''), d.excerpt, d.title),
      query.value,
      'StartSel=<b>, StopSel=</b>, MaxWords=32, MinWords=12, ShortWord=3, HighlightAll=false, MaxFragments=2, FragmentDelimiter=…'
    ) as headline,
    d.reading_time_minutes,
    d.created_at,
    ts_rank_cd(d.fts, query.value, 32)::real as rank
  from public.documents d
  cross join query
  where d.user_id = (select auth.uid())
    and length(btrim(search_query)) > 0
    and d.fts @@ query.value
  order by rank desc, d.created_at desc
  limit least(greatest(result_limit, 1), 50);
$$;

revoke all on function public.search_documents(text, integer) from public, anon;
grant execute on function public.search_documents(text, integer) to authenticated;
