"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { AuthScreen } from "./components/AuthScreen";
import { MainApp } from "./components/MainApp";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { StatusScreen } from "./components/StatusScreen";
import { loadProfile } from "./lib/data";
import { getSupabase, isSupabaseConfigured } from "./lib/supabase";
import type { Profile } from "./types";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabase();

    async function applySession(nextSession: Session | null) {
      setSession(nextSession);
      setProfile(null);
      setError(null);
      if (!nextSession) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        setProfile(await loadProfile(nextSession.user.id));
      } catch {
        setError("Não foi possível acessar seu perfil no Supabase.");
      } finally {
        setLoading(false);
      }
    }

    void supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) {
    return <StatusScreen title="Conecte o Supabase" description="Adicione a URL e a chave pública do seu projeto no arquivo .env para ativar login e dados reais."/>;
  }

  if (loading) {
    return <StatusScreen title="Carregando" description="Estamos preparando seus dados com segurança."/>;
  }

  if (error) {
    return <StatusScreen title="Não foi possível carregar" description={error} action={{ label: "Tentar novamente", onClick: () => window.location.reload() }}/>;
  }

  if (!session) return <AuthScreen/>;
  if (!profile?.preferences?.onboarding_completed) {
    return <OnboardingScreen user={session.user} onComplete={setProfile}/>;
  }

  return <MainApp session={session} profile={profile}/>;
}
