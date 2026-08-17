"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function safeNextPath(formData: FormData) {
  const next = String(formData.get("next") ?? "");
  return next === "/save" || next.startsWith("/save?") ? next : "/";
}

function loginError(message: string, next: string) {
  const params = new URLSearchParams({ error: message });
  if (next !== "/") params.set("next", next);
  return `/login?${params.toString()}`;
}

export async function login(formData: FormData) {
  const next = safeNextPath(formData);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 6) redirect(loginError("Periksa email dan kata sandi", next));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(loginError("Email atau kata sandi tidak cocok", next));

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const next = safeNextPath(formData);
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) redirect(loginError("Gunakan kata sandi minimal 8 karakter", next));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) redirect(loginError("Akun belum dapat dibuat. Periksa email atau coba kata sandi lain.", next));
  if (!data.session) redirect(`/login?message=${encodeURIComponent("Periksa email untuk mengonfirmasi akun, lalu masuk.")}`);
  revalidatePath("/", "layout");
  redirect(next);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
