"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function messageForReason(reason?: string) {
  switch (reason) {
    case "session-expired":
      return "Сессия истекла. Войдите снова.";
    case "session-invalid":
      return "Сессия была отозвана защитой авторизации. Войдите снова.";
    case "rate-limited":
      return "Слишком много попыток входа. Подождите минуту и попробуйте снова.";
    case "forbidden":
      return "Вход временно заблокирован или аккаунт недоступен.";
    case "captcha-required":
      return "Сработала защита от частых попыток входа. Нужно добавить captcha-flow для админского входа.";
    case "login-failed":
      return "Не удалось войти. Проверьте доступность backend и попробуйте снова.";
    case "session-refresh-failed":
      return "Не удалось обновить сессию из-за временной ошибки. Попробуйте войти снова.";
    case "invalid-credentials":
    default:
      return reason ? "Неверный email или пароль." : null;
  }
}

export function LoginForm({ reason }: { reason?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(messageForReason(reason));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);

    if (!res) {
      setSubmitting(false);
      setError("Не удалось связаться с frontend auth route. Попробуйте еще раз.");
      return;
    }

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setSubmitting(false);
      setError(messageForReason(payload?.error) ?? "Неверный email или пароль.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-[360px] flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Email</span>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Пароль</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary"
        />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Вход…" : "Войти"}
      </button>
    </form>
  );
}
