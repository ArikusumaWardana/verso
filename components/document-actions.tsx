"use client";

import { Archive, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DocumentActions({ id, starred }: { id: string; starred: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(status: "unread" | "starred" | "archived") {
    setBusy(true);
    const response = await fetch(`/api/documents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setBusy(false);
    if (response.ok) router.refresh();
  }

  async function remove() {
    if (!window.confirm("Hapus bacaan ini beserta berkas tersimpannya?")) return;
    setBusy(true);
    const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (response.ok) router.push("/"); else setBusy(false);
  }

  return (
    <div className="reader-actions">
      <button disabled={busy} onClick={() => setStatus(starred ? "unread" : "starred")} aria-label={starred ? "Hapus tanda bintang" : "Tandai berbintang"}><Star size={18} fill={starred ? "currentColor" : "none"} /></button>
      <button disabled={busy} onClick={() => setStatus("archived")} aria-label="Arsipkan"><Archive size={18} /></button>
      <button disabled={busy} onClick={remove} aria-label="Hapus"><Trash2 size={18} /></button>
    </div>
  );
}
