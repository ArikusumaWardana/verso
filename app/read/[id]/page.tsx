import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DocumentActions } from "@/components/document-actions";
import { PdfReader } from "@/components/pdf-reader";
import { ReadingProgress } from "@/components/reading-progress";
import { resolveArchivedImages } from "@/lib/reader-html";

export const dynamic = "force-dynamic";

export default async function ReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/login");
  const { id } = await params;
  const { data: document } = await supabase.from("documents").select("*").eq("id", id).single();
  if (!document) notFound();

  if (document.status === "unread") {
    const { error: readError } = await supabase
      .from("documents")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("id", document.id)
      .eq("status", "unread");
    if (readError) console.error("Verso could not mark document as read", readError);
  }

  let pdfUrl: string | null = null;
  let articleHtml = document.content_html ?? "";
  if (document.raw_file_path) {
    const { data } = await supabase.storage.from("raw-documents").createSignedUrl(document.raw_file_path, 3600);
    pdfUrl = data?.signedUrl ?? null;
  }
  if (document.type === "article" && articleHtml) {
    const { data: images } = await supabase
      .from("document_images")
      .select("storage_path")
      .eq("document_id", document.id)
      .order("position");
    const paths = images?.map((image) => image.storage_path) ?? [];
    if (paths.length) {
      const { data: signed } = await supabase.storage.from("article-images").createSignedUrls(paths, 3600);
      const signedUrls = new Map(
        signed?.flatMap((item, index) => item.signedUrl ? [[paths[index], item.signedUrl] as const] : []) ?? []
      );
      articleHtml = resolveArchivedImages(articleHtml, signedUrls);
    }
  }

  return (
    <main className="reader-page">
      {document.type === "article" && <ReadingProgress />}
      <header className="reader-header">
        <Link href="/" prefetch={false} className="reader-back"><ArrowLeft size={18} />Kembali ke arsip</Link>
        <div className="reader-toolbar">
          {document.source_url && <a href={document.source_url} target="_blank" rel="noreferrer" aria-label="Buka sumber asli"><ExternalLink size={18} /></a>}
          <DocumentActions id={document.id} starred={document.status === "starred"} />
        </div>
      </header>
      <article className="reader-article">
        <p className="eyebrow">{document.type === "pdf" ? "Paper" : document.site_name || "Artikel"}</p>
        <h1>{document.title}</h1>
        <p className="reader-byline">{[document.author, `${document.reading_time_minutes} menit baca`].filter(Boolean).join(" · ")}</p>
        {document.type === "pdf" ? (
          <PdfReader title={document.title} pdfUrl={pdfUrl} pageCount={document.page_count} contentText={document.content_text} />
        ) : (
          <div className="reader-body" dangerouslySetInnerHTML={{ __html: articleHtml }} />
        )}
      </article>
    </main>
  );
}
