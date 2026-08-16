import { login, signup } from "./actions";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/");
  const { error, message } = await searchParams;

  return (
    <main className="login-page">
      <section className="login-intro">
        <div className="wordmark login-wordmark"><span aria-hidden="true">V</span><strong>Verso</strong></div>
        <div>
          <p className="eyebrow">Arsip bacaan pribadi</p>
          <h1>Temukan kembali apa yang pernah kamu baca.</h1>
          <p>Artikel dan paper disimpan utuh, lalu diindeks agar satu frasa yang samar tetap bisa membawamu kembali.</p>
        </div>
        <BookOpen size={34} strokeWidth={1.25} aria-hidden="true" />
      </section>
      <section className="login-panel">
        <form action={login} className="login-form">
          <div><p className="eyebrow">Masuk ke arsip</p><h2>Selamat datang kembali</h2></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-message" role="status">{message}</p>}
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="password">Kata sandi</label>
          <input id="password" name="password" type="password" autoComplete="current-password" minLength={6} required />
          <button className="primary-button" type="submit">Buka arsip</button>
          <button className="secondary-button" type="submit" formAction={signup}>Buat akun pertama</button>
          <p className="form-note">Akun dibuat dan dikelola melalui Supabase Auth.</p>
        </form>
      </section>
    </main>
  );
}
