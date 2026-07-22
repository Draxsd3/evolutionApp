"use client";

import { useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { saveOnboarding } from "../lib/data";
import type { Profile } from "../types";

const trackingAreas = ["Sono", "Energia", "Foco", "Alimentação", "Movimento"];

interface OnboardingScreenProps {
  user: User;
  onComplete: (profile: Profile) => void;
}

export function OnboardingScreen({ user, onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [wakeTime, setWakeTime] = useState("07:00");
  const [workTime, setWorkTime] = useState("09:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleGoal(goal: string) {
    setGoals((current) => current.includes(goal)
      ? current.filter((item) => item !== goal)
      : [...current, goal]);
  }

  async function finish(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const profile = await saveOnboarding(user, {
        displayName: displayName.trim(), goals, wakeTime, workTime, sleepTime,
      });
      onComplete(profile);
    } catch {
      setError("Não foi possível salvar sua rotina. Verifique a conexão e tente novamente.");
      setSaving(false);
    }
  }

  return (
    <main className="onboarding-screen">
      <section className="onboarding-card">
        <div className="brand"><span>e</span><strong>Evolua</strong></div>
        <div className="step-indicator" aria-label={`Etapa ${step} de 2`}><span className="active"/><span className={step === 2 ? "active" : ""}/></div>

        {step === 1 ? (
          <form onSubmit={(event) => { event.preventDefault(); setStep(2); }}>
            <p className="eyebrow">ETAPA 1 DE 2</p>
            <h1>O que você quer acompanhar?</h1>
            <p>Isso ajuda a IA a prestar atenção ao que importa para você. Você poderá mudar depois.</p>
            <label htmlFor="display-name">Como prefere ser chamado?</label>
            <input id="display-name" required maxLength={80} autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            <fieldset>
              <legend>Áreas importantes</legend>
              <div className="choice-grid">
                {trackingAreas.map((area) => <button type="button" className={goals.includes(area) ? "selected" : ""} aria-pressed={goals.includes(area)} onClick={() => toggleGoal(area)} key={area}>{area}</button>)}
              </div>
            </fieldset>
            <button className="primary-action" type="submit">Continuar</button>
          </form>
        ) : (
          <form onSubmit={finish}>
            <p className="eyebrow">ETAPA 2 DE 2</p>
            <h1>Como costuma ser seu dia?</h1>
            <p>Horários aproximados já são suficientes. Eles servem como contexto, não como cobrança.</p>
            <div className="time-fields">
              <label>Acordo por volta de<input type="time" required value={wakeTime} onChange={(event) => setWakeTime(event.target.value)} /></label>
              <label>Começo trabalho ou estudo<input type="time" required value={workTime} onChange={(event) => setWorkTime(event.target.value)} /></label>
              <label>Desacelero por volta de<input type="time" required value={sleepTime} onChange={(event) => setSleepTime(event.target.value)} /></label>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="form-actions"><button className="text-action" type="button" onClick={() => setStep(1)}>Voltar</button><button className="primary-action" disabled={saving} type="submit">{saving ? "Salvando…" : "Começar"}</button></div>
          </form>
        )}
      </section>
    </main>
  );
}
