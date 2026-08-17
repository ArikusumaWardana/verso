"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MouseEvent, useState } from "react";

export function ReaderBackLink() {
  const router = useRouter();
  const [navigating, setNavigating] = useState(false);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (navigating) return;
    setNavigating(true);
    router.push("/");
  }

  return (
    <>
      {navigating && <span className="reader-back-progress" aria-hidden="true" />}
      <Link href="/" prefetch={false} className="reader-back" onClick={handleClick} aria-busy={navigating} aria-disabled={navigating}>
        <ArrowLeft size={18} strokeWidth={1.5} />
        <span aria-live="polite">{navigating ? "Membuka arsip…" : "Kembali ke arsip"}</span>
      </Link>
    </>
  );
}
