"use client";

import { useFormStatus } from "react-dom";
import { signup } from "@/app/login/actions";

export function AuthSubmitButtons() {
  const { pending, action } = useFormStatus();
  const creatingAccount = pending && action === signup;
  const loggingIn = pending && !creatingAccount;

  return (
    <div className="auth-submit-buttons" aria-live="polite">
      <button className="primary-button" type="submit" disabled={pending} aria-busy={loggingIn}>
        {loggingIn ? "Membuka arsip…" : "Buka arsip"}
      </button>
      <button className="secondary-button" type="submit" formAction={signup} disabled={pending} aria-busy={creatingAccount}>
        {creatingAccount ? "Membuat akun…" : "Buat akun pertama"}
      </button>
    </div>
  );
}
