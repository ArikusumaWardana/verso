import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { Document } from "@/lib/types";

export async function withSignedCoverUrls(supabase: SupabaseClient<Database>, documents: Document[]) {
  const groups = {
    "article-images": [...new Set(documents.filter((item) => item.type === "article").map((item) => item.cover_image_path).filter((path): path is string => Boolean(path)))],
    covers: [...new Set(documents.filter((item) => item.type === "pdf").map((item) => item.cover_image_path).filter((path): path is string => Boolean(path)))]
  };
  const signedUrls = new Map<string, string>();

  await Promise.all(Object.entries(groups).map(async ([bucket, paths]) => {
    if (!paths.length) return;
    const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, 3600);
    data?.forEach((item, index) => {
      if (item.signedUrl) signedUrls.set(`${bucket}:${paths[index]}`, item.signedUrl);
    });
  }));

  return documents.map((document) => ({
    ...document,
    cover_url: document.cover_image_path
      ? signedUrls.get(`${document.type === "pdf" ? "covers" : "article-images"}:${document.cover_image_path}`) ?? null
      : null
  }));
}
