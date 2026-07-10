import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";

const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => search.parse(s),
  component: AuthPage,
});

function AuthPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: redirect ?? "/map" });
    });
  }, [navigate, redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { username: username || email.split("@")[0] }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: redirect ?? "/map" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(false); }
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-primary via-gold to-indigo" />
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <a href="/" className="font-display text-xl">✿ HeritageQuest</a>
        <LanguageToggle />
      </header>
      <main className="mx-auto grid min-h-[80vh] max-w-md place-items-center px-6">
        <div className="paper-card w-full p-8 pop-in">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">{t("tagline")}</p>
          <h1 className="mt-2 font-display text-3xl">{t("auth_welcome")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth_sub")}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("username")}</span>
                <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-ring" />
              </label>
            )}
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("email")}</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-ring" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("password")}</span>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:border-ring" />
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button disabled={busy} type="submit" className="bounce-soft w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60">
              {busy ? "…" : mode === "signin" ? t("signin") : t("signup")}
            </button>
          </form>

          <div className="ornament-rule my-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            <span>{lang === "bm" ? "atau" : "or"}</span>
          </div>

          <button
            type="button"
            onClick={() => { setError(null); setMode(mode === "signin" ? "signup" : "signin"); }}
            className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {mode === "signin" ? t("auth_new_here") : t("auth_have_acct")}
          </button>
        </div>
      </main>
    </div>
  );
}
