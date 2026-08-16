import { Vault } from "@/components/vault";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { withSignedCoverUrls } from "@/lib/document-covers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) redirect("/login");

  const { data, error } = await supabase
    .from("documents")
    .select("id,type,status,title,author,site_name,source_url,excerpt,reading_time_minutes,page_count,cover_image_path,created_at")
    .order("created_at", { ascending: false });
  const documents = data ? await withSignedCoverUrls(supabase, data) : [];

  return <Vault initialDocuments={documents} userEmail={claimsData.claims.email as string | undefined} loadError={error?.message} />;
}
