"use client";

import { useState, type FormEvent } from "react";
import { getSupabase } from "../lib/supabase";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = getSupabase();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setError(result.error.message);
    } else if (mode === "signup" && !result.data.session) {
      setMessage("Confira seu e-mail para confirmar a conta antes de entrar.");
    }
    setLoading(false);
  }

  return (
    <main className="auth-screen">
      <section className="auth-copy">
        <div className="brand"><span>e</span><strong>Evolua</strong></div>
        <div>
          <p className="eyebrow">SEU DIA, COM MAIS CLAREZA</p>
          <h1>Entenda sua rotina conversando naturalmente.</h1>
          <p>Registre o que aconteceu, acompanhe padrões e mantenha seus dados sob seu controle.</p>
        </div>
        <small>Seus registros são privados e protegidos por acesso individual.</small>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <h2>{mode === "login" ? "Entrar" : "Criar conta"}</h2>
          <p>{mode === "login" ? "Continue de onde parou." : "Comece com algumas informações básicas."}</p>

          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />

          <label htmlFor="password">Senha</label>
          <input id="password" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required value={password} onChange={(event) => setPassword(event.target.value)} />

          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p className="form-success" role="status">{message}</p>}

          <button className="primary-action" disabled={loading} type="submit">
            {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
          <button className="text-action" type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setMessage(null); }}>
            {mode === "login" ? "Ainda não tenho uma conta" : "Já tenho uma conta"}
          </button>
        </form>
      </section>
    </main>
  );
}
