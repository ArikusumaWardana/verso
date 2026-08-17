import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MobileSaveForm } from "@/components/mobile-save-form";

export const dynamic = "force-dynamic";

type SaveSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function sharedUrl(url: string, text: string) {
  const direct = url.trim();
  if (/^https?:\/\//i.test(direct)) return direct;
  return text.match(/https?:\/\/[^\s]+/i)?.[0] ?? "";
}

export default async function SavePage({ searchParams }: { searchParams: Promise<SaveSearchParams> }) {
  const params = await searchParams;
  const title = first(params.title).trim();
  const text = first(params.text).trim();
  const url = sharedUrl(first(params.url), text);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    const returnParams = new URLSearchParams();
    if (title) returnParams.set("title", title);
    if (text) returnParams.set("text", text);
    if (url) returnParams.set("url", url);
    const returnPath = `/save${returnParams.size ? `?${returnParams.toString()}` : ""}`;
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }

  return <MobileSaveForm initialUrl={url} sharedTitle={title} />;
}
