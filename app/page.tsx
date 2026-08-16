import { Vault } from "@/components/vault";
import { createClient } from "@/lib/supabase/server";
import { withSignedCoverUrls } from "@/lib/document-covers";
import { LandingPage } from "@/components/landing-page";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verso | Arsip artikel & paper yang bisa dicari sampai ke isinya",
  description: "Verso menyimpan artikel web dan paper PDF di satu tempat, lalu membuatnya bisa dicari secara penuh dari judul sampai isi paragraf dalam hitungan milidetik."
};

export default async function Home() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims) return <LandingPage />;

  const { data, error } = await supabase
    .from("documents")
    .select("id,type,status,title,author,site_name,source_url,excerpt,reading_time_minutes,page_count,cover_image_path,created_at")
    .order("created_at", { ascending: false });
  const documents = data ? await withSignedCoverUrls(supabase, data) : [];

  return <Vault initialDocuments={documents} userEmail={claimsData.claims.email as string | undefined} loadError={error?.message} />;
}
