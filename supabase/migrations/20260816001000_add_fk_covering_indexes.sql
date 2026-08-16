create index document_images_document_user_idx
  on public.document_images (document_id, user_id);

create index document_tags_document_user_idx
  on public.document_tags (document_id, user_id);

create index document_tags_tag_user_idx
  on public.document_tags (tag_id, user_id);

create index ingestion_jobs_document_user_idx
  on public.ingestion_jobs (document_id, user_id)
  where document_id is not null;
