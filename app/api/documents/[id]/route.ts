import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type Status = Database["public"]["Enums"]["document_status"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return NextResponse.json({ error: "Sesi sudah berakhir" }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { status?: Status };
  if (!body.status || !["unread", "read", "starred", "archived"].includes(body.status)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const updates: Database["public"]["Tables"]["documents"]["Update"] = {
    status: body.status,
    read_at: body.status === "read" ? now : null,
    starred_at: body.status === "starred" ? now : null,
    archived_at: body.status === "archived" ? now : null
  };
  const { data, error } = await supabase.from("documents").update(updates).eq("id", id).select("status").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi sudah berakhir" }, { status: 401 });
  const { id } = await params;

  const { data: document, error: fetchError } = await supabase.from("documents").select("raw_file_path").eq("id", id).single();
  if (fetchError) return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
  const { data: images } = await supabase.from("document_images").select("storage_path").eq("document_id", id);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (document.raw_file_path) await supabase.storage.from("raw-documents").remove([document.raw_file_path]);
  if (images?.length) await supabase.storage.from("article-images").remove(images.map((image) => image.storage_path));
  await supabase.storage.from("covers").remove([`${userId}/${id}/cover.webp`]);
  return new NextResponse(null, { status: 204 });
}
