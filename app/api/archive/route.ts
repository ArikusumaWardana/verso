import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  articleImageSources,
  assertSafeUrl,
  attachArchivedImages,
  excerpt,
  fetchArticleImage,
  fetchBounded,
  parseArticle,
  parsePdf,
  readingTime
} from "@/lib/ingestion";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi sudah berakhir. Masuk kembali." }, { status: 401 });

  let inputUrl = "";
  let jobId: string | null = null;
  try {
    const body = await request.json() as { url?: string; source?: "extension" | "manual_url" };
    inputUrl = body.url?.trim() ?? "";
    const ingestionSource = body.source === "extension" ? "extension" : "manual_url";
    const url = await assertSafeUrl(inputUrl);

    const { data: job, error: jobError } = await supabase.from("ingestion_jobs").insert({ user_id: userId, input_url: url.href }).select("id").single();
    if (jobError) throw jobError;
    jobId = job.id;
    await supabase.from("ingestion_jobs").update({ status: "processing", started_at: new Date().toISOString() }).eq("id", job.id);

    const fetched = await fetchBounded(url);
    const isPdf = fetched.contentType.includes("application/pdf") || fetched.finalUrl.pathname.toLowerCase().endsWith(".pdf");
    const documentId = randomUUID();

    if (isPdf) {
      const parsed = await parsePdf(fetched.buffer);
      const path = `${userId}/${documentId}/original.pdf`;
      let coverPath = parsed.cover ? `${userId}/${documentId}/cover.webp` : null;
      const { error: uploadError } = await supabase.storage.from("raw-documents").upload(path, fetched.buffer, { contentType: "application/pdf", upsert: false });
      if (uploadError) throw uploadError;
      if (coverPath && parsed.cover) {
        const { error: coverError } = await supabase.storage.from("covers").upload(coverPath, parsed.cover, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
        if (coverError) { console.warn("Verso could not store the PDF cover", coverError); coverPath = null; }
      }
      const title = decodeURIComponent(fetched.finalUrl.pathname.split("/").pop() || "Paper").replace(/\.pdf$/i, "");
      const { error } = await supabase.from("documents").insert({
        id: documentId, user_id: userId, type: "pdf", source: ingestionSource, title,
        source_url: url.href, canonical_pdf_url: fetched.finalUrl.href, content_text: parsed.text,
        excerpt: excerpt(parsed.text), raw_file_path: path, raw_file_size_bytes: fetched.buffer.byteLength,
        page_count: parsed.pageCount, cover_image_path: coverPath, reading_time_minutes: readingTime(parsed.text)
      });
      if (error) { await supabase.storage.from("raw-documents").remove([path]); if (coverPath) await supabase.storage.from("covers").remove([coverPath]); throw error; }
    } else {
      const parsed = parseArticle(fetched.buffer.toString("utf8"), fetched.finalUrl);
      if (parsed.citationPdfUrl) {
        const pdfUrl = await assertSafeUrl(parsed.citationPdfUrl);
        const pdf = await fetchBounded(pdfUrl);
        const looksLikePdf = pdf.contentType.includes("application/pdf") || pdf.finalUrl.pathname.toLowerCase().endsWith(".pdf");
        if (!looksLikePdf) throw new Error("Tautan PDF jurnal tidak mengarah ke berkas PDF");
        const extracted = await parsePdf(pdf.buffer);
        const path = `${userId}/${documentId}/original.pdf`;
        let coverPath = extracted.cover ? `${userId}/${documentId}/cover.webp` : null;
        const { error: uploadError } = await supabase.storage.from("raw-documents").upload(path, pdf.buffer, { contentType: "application/pdf", upsert: false });
        if (uploadError) throw uploadError;
        if (coverPath && extracted.cover) {
          const { error: coverError } = await supabase.storage.from("covers").upload(coverPath, extracted.cover, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
          if (coverError) { console.warn("Verso could not store the PDF cover", coverError); coverPath = null; }
        }
        const { error } = await supabase.from("documents").insert({
          id: documentId, user_id: userId, type: "pdf", source: ingestionSource, title: parsed.title,
          author: parsed.author, site_name: parsed.siteName, source_url: url.href,
          canonical_pdf_url: pdf.finalUrl.href, content_text: extracted.text,
          excerpt: parsed.excerpt || excerpt(extracted.text), raw_file_path: path,
          raw_file_size_bytes: pdf.buffer.byteLength, page_count: extracted.pageCount, cover_image_path: coverPath,
          reading_time_minutes: readingTime(extracted.text)
        });
        if (error) { await supabase.storage.from("raw-documents").remove([path]); if (coverPath) await supabase.storage.from("covers").remove([coverPath]); throw error; }
      } else {
        const { error } = await supabase.from("documents").insert({
          id: documentId, user_id: userId, type: "article", source: ingestionSource, title: parsed.title,
          author: parsed.author, site_name: parsed.siteName, source_url: url.href,
          content_html: parsed.contentHtml, content_text: parsed.contentText,
          excerpt: parsed.excerpt || excerpt(parsed.contentText),
          reading_time_minutes: readingTime(parsed.contentText)
        });
        if (error) throw error;

        const storagePaths = new Map<string, string>();
        const uploadedPaths: string[] = [];
        const imageErrors: string[] = [];
        const sources = [...new Set(articleImageSources(parsed.contentHtml, fetched.finalUrl))];
        for (const [position, source] of sources.entries()) {
          try {
            const image = await fetchArticleImage(source, fetched.finalUrl);
            const imageId = randomUUID();
            const path = `${userId}/${documentId}/images/${imageId}.webp`;
            const { error: imageUploadError } = await supabase.storage.from("article-images").upload(path, image.buffer, {
              contentType: "image/webp", cacheControl: "31536000", upsert: false
            });
            if (imageUploadError) throw imageUploadError;
            uploadedPaths.push(path);
            const { error: imageRowError } = await supabase.from("document_images").insert({
              id: imageId, document_id: documentId, user_id: userId, original_url: image.originalUrl,
              storage_path: path, position, width: image.width, height: image.height,
              size_bytes: image.buffer.byteLength, format: "webp"
            });
            if (imageRowError) {
              await supabase.storage.from("article-images").remove([path]);
              uploadedPaths.pop();
              throw imageRowError;
            }
            storagePaths.set(source, path);
          } catch (imageError) {
            // One blocked or oversized image must not discard an otherwise valid article.
            imageErrors.push(imageError instanceof Error ? imageError.message : "Gambar tidak dapat diarsipkan");
          }
        }

        if (imageErrors.length) {
          console.warn("Verso skipped article images", {
            sourceUrl: fetched.finalUrl.href,
            discovered: sources.length,
            archived: storagePaths.size,
            errors: imageErrors
          });
        }

        if (storagePaths.size) {
          const archivedHtml = attachArchivedImages(parsed.contentHtml, fetched.finalUrl, storagePaths);
          const firstPath = storagePaths.values().next().value ?? null;
          const { error: updateError } = await supabase.from("documents").update({
            content_html: archivedHtml, cover_image_path: firstPath
          }).eq("id", documentId);
          if (updateError) {
            await supabase.storage.from("article-images").remove(uploadedPaths);
            await supabase.from("documents").delete().eq("id", documentId);
            throw updateError;
          }
        }
      }
    }

    await supabase.from("ingestion_jobs").update({ status: "succeeded", document_id: documentId, finished_at: new Date().toISOString() }).eq("id", job.id);
    return NextResponse.json({ id: documentId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bacaan tidak dapat disimpan";
    if (jobId) await supabase.from("ingestion_jobs").update({ status: "failed", error_message: message, finished_at: new Date().toISOString() }).eq("id", jobId);
    const duplicate = message.includes("documents_user_source_url_unique") || message.includes("duplicate key");
    return NextResponse.json({ error: duplicate ? "Tautan ini sudah ada di arsip" : message }, { status: duplicate ? 409 : 400 });
  }
}
