import { randomUUID } from "node:crypto";
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

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.type !== "application/pdf") throw new Error("Pilih berkas PDF yang valid");
    if (file.size > MAX_PDF_BYTES) throw new Error("PDF maksimal 50 MB");

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parsePdf(buffer);
    const documentId = randomUUID();
    const path = `${userId}/${documentId}/original.pdf`;
    const { error: uploadError } = await supabase.storage.from("raw-documents").upload(path, buffer, { contentType: "application/pdf", upsert: false });
    if (uploadError) throw uploadError;

    const title = file.name.replace(/\.pdf$/i, "").trim() || "Paper tanpa judul";
    const { error } = await supabase.from("documents").insert({
      id: documentId, user_id: userId, type: "pdf", source: "file_upload", title,
      content_text: parsed.text, excerpt: excerpt(parsed.text), raw_file_path: path,
      raw_file_size_bytes: file.size, page_count: parsed.pageCount,
      reading_time_minutes: readingTime(parsed.text)
    });
    if (error) { await supabase.storage.from("raw-documents").remove([path]); throw error; }
    return NextResponse.json({ id: documentId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "PDF tidak dapat disimpan" }, { status: 400 });
  }
}
