import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { excerpt, MAX_PDF_BYTES, parsePdf, readingTime } from "@/lib/ingestion";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi sudah berakhir. Masuk kembali." }, { status: 401 });

  let path: string | null = null;
  let coverPath: string | null = null;
  try {
    const body = await request.json() as { documentId?: string; fileName?: string; fileSize?: number };
    const documentId = body.documentId?.trim() ?? "";
    const fileName = body.fileName?.trim() ?? "";
    const fileSize = body.fileSize;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentId)) {
      throw new Error("Identitas PDF tidak valid");
    }
    if (!fileName.toLowerCase().endsWith(".pdf")) throw new Error("Pilih berkas PDF yang valid");
    if (!Number.isInteger(fileSize) || !fileSize || fileSize < 1 || fileSize > MAX_PDF_BYTES) {
      throw new Error("PDF maksimal 50 MB");
    }

    path = `${userId}/${documentId}/original.pdf`;
    const { data: storedFile, error: downloadError } = await supabase.storage.from("raw-documents").download(path);
    if (downloadError) throw downloadError;
    if (storedFile.size !== fileSize) throw new Error("Ukuran PDF yang diunggah tidak sesuai");
    const buffer = Buffer.from(await storedFile.arrayBuffer());
    const parsed = await parsePdf(buffer);
    if (parsed.cover) {
      coverPath = `${userId}/${documentId}/cover.webp`;
      const { error: coverError } = await supabase.storage.from("covers").upload(coverPath, parsed.cover, {
        contentType: "image/webp", cacheControl: "31536000", upsert: false
      });
      if (coverError) { console.warn("Verso could not store the PDF cover", coverError); coverPath = null; }
    }

    const title = fileName.replace(/\.pdf$/i, "").trim().slice(0, 500) || "Paper tanpa judul";
    const { error } = await supabase.from("documents").insert({
      id: documentId, user_id: userId, type: "pdf", source: "file_upload", title,
      content_text: parsed.text, excerpt: excerpt(parsed.text), raw_file_path: path,
      raw_file_size_bytes: fileSize, page_count: parsed.pageCount,
      cover_image_path: coverPath, reading_time_minutes: readingTime(parsed.text)
    });
    if (error) throw error;
    return NextResponse.json({ id: documentId }, { status: 201 });
  } catch (error) {
    if (path) await supabase.storage.from("raw-documents").remove([path]);
    if (coverPath) await supabase.storage.from("covers").remove([coverPath]);
    return NextResponse.json({ error: error instanceof Error ? error.message : "PDF tidak dapat disimpan" }, { status: 400 });
  }
}
