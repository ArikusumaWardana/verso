import { Vault } from "@/components/vault";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) redirect("/login");

  const { data, error } = await supabase
    .from("documents")
    .select("id,type,status,title,author,site_name,source_url,excerpt,reading_time_minutes,page_count,created_at")
    .order("created_at", { ascending: false });

  return <Vault initialDocuments={data ?? []} userEmail={claimsData.claims.email as string | undefined} loadError={error?.message} />;
}
