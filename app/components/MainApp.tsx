"use client";

import {
  ArrowUp, CalendarDays, Check, ChevronRight, Clock3, History,
  LogOut, Menu, MessageCircle, Mic, Moon, Search, Settings, Sun,
  Target, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabase } from "../lib/supabase";
import { loadAppData, setRoutineCompleted } from "../lib/data";
import type { AppData, AuthenticatedAppProps, DailyEntry, View } from "../types";

const nav = [
  { id: "chat", label: "Conversa", icon: MessageCircle },
  { id: "history", label: "Histórico", icon: History },
  { id: "summaries", label: "Resumos", icon: CalendarDays },
  { id: "routine", label: "Rotina", icon: Target },
  { id: "settings", label: "Configurações", icon: Settings },
] as const;

const emptyData: AppData = { entries: [], routineMarkers: [], routineLogs: [], messages: [] };

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" })
    .format(new Date(`${date}T12:00:00`));
}

function todayLabel() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date()).toUpperCase();
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function average(values: Array<number | null>) {
  const valid = values.filter((value): value is number => value !== null);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: { label: string; onClick: () => void } }) {
  return <div className="empty"><h3>{title}</h3><p>{description}</p>{action && <button className="primary-action compact" onClick={action.onClick}>{action.label}</button>}</div>;
}

interface ChatViewProps {
  data: AppData;
  name: string;
  token: string;
  onSaved: () => Promise<void>;
}

function ChatView({ data, name, token, onSaved }: ChatViewProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [data.messages, sending]);

  async function send() {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    setText("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content, entryDate: new Date().toISOString().slice(0, 10) }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Falha ao registrar");
      await onSaved();
    } catch (sendError) {
      setText(content);
      setError(sendError instanceof Error ? sendError.message : "Não foi possível enviar agora.");
    } finally {
      setSending(false);
    }
  }

  return <div className="chat-view">
    <header className="topbar"><div><p className="eyebrow">{todayLabel()}</p><h1>Olá, {firstName(name)}</h1></div></header>
    <div className="messages" aria-live="polite">
      {data.messages.length === 0 && <div className="message assistant"><div className="bubble">Como foi seu dia? Pode escrever do seu jeito. Vou organizar somente o que você contar.</div></div>}
      {data.messages.map((message) => <div key={message.id} className={`message ${message.role}`}><div className="bubble">{message.content}</div></div>)}
      {sending && <div className="thinking"><i/><i/><i/><span>Organizando seu relato…</span></div>}
      {error && <div className="inline-error" role="alert">{error} <button onClick={send}>Tentar novamente</button></div>}
      <div ref={end}/>
    </div>
    <div className="composer-wrap"><div className="composer"><label htmlFor="daily-text" className="sr-only">Conte como foi seu dia</label><textarea id="daily-text" value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Conte como foi seu dia…" rows={1}/><div className="composer-actions"><button className="mic" aria-label="Conversar por voz" title="Disponível em uma próxima etapa"><Mic size={20}/></button><span>Shift + Enter para nova linha</span><button className="send" onClick={() => void send()} disabled={!text.trim() || sending} aria-label="Enviar mensagem"><ArrowUp size={20}/></button></div></div><p className="privacy-note">Seu relato é privado e pode ser corrigido ou excluído.</p></div>
  </div>;
}

function HistoryView({ entries, onStart }: { entries: DailyEntry[]; onStart: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = entries.filter((entry) => `${entry.ai_summary ?? ""} ${entry.original_text} ${entry.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="page"><div className="page-head"><div><p className="eyebrow">SUA LINHA DO TEMPO</p><h1>Histórico</h1><p>Seus registros aparecem aqui conforme você conversa.</p></div></div>{entries.length > 0 && <div className="search"><Search size={18}/><input aria-label="Buscar no histórico" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por palavra-chave"/></div>}<div className="timeline">{filtered.map((entry) => <article className="day-entry" key={entry.id}><div className="timeline-mark"><i/><span/></div><div className="entry-content"><div className="entry-date"><strong>{formatDate(entry.entry_date)}</strong></div><p>{entry.ai_summary ?? entry.original_text}</p><div className="entry-meta">{entry.energy_score !== null && <span>Energia {entry.energy_score}/10</span>}{entry.sleep_hours !== null && <span>Sono {entry.sleep_hours}h</span>}{entry.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div></div></article>)}{entries.length === 0 && <EmptyState title="Nenhum registro ainda" description="Converse com a IA para criar seu primeiro registro." action={{ label: "Fazer meu primeiro registro", onClick: onStart }}/>} {entries.length > 0 && filtered.length === 0 && <EmptyState title="Nenhum registro encontrado" description="Tente buscar com outras palavras."/>}</div></section>;
}

function SummariesView({ entries }: { entries: DailyEntry[] }) {
  const recent = entries.slice(0, 7);
  const energy = average(recent.map((entry) => entry.energy_score));
  const focus = average(recent.map((entry) => entry.focus_score));
  const sleep = average(recent.map((entry) => entry.sleep_hours));
  const productiveMinutes = recent.reduce((sum, entry) => sum + (entry.worked_or_studied_minutes ?? 0), 0);

  return <section className="page"><div className="page-head"><div><p className="eyebrow">ÚLTIMOS REGISTROS</p><h1>Seus resumos</h1><p>Leituras simples baseadas somente no que você registrou.</p></div></div>{recent.length < 3 ? <EmptyState title="Ainda não há dados suficientes" description="Depois de alguns registros, seus padrões aparecerão aqui."/> : <><div className="summary-lead"><h2>Uma visão dos seus últimos dias</h2><p>Estes números resumem seus registros recentes. Eles ajudam a observar tendências, mas não indicam causa ou diagnóstico.</p></div><div className="metrics"><div><span>Energia média</span><strong>{energy?.toFixed(1).replace(".", ",") ?? "—"}</strong><small>{energy === null ? "sem dados" : "de 10"}</small></div><div><span>Foco médio</span><strong>{focus?.toFixed(1).replace(".", ",") ?? "—"}</strong><small>{focus === null ? "sem dados" : "de 10"}</small></div><div><span>Sono médio</span><strong>{sleep?.toFixed(1).replace(".", ",") ?? "—"}</strong><small>{sleep === null ? "sem dados" : "horas"}</small></div><div><span>Tempo produtivo</span><strong>{Math.round(productiveMinutes / 60)}h</strong><small>nos registros</small></div></div></>}</section>;
}

function RoutineView({ data, userId, onChanged }: { data: AppData; userId: string; onChanged: () => Promise<void> }) {
  const [updating, setUpdating] = useState<string | null>(null);
  async function toggle(markerId: string, completed: boolean) {
    setUpdating(markerId);
    try { await setRoutineCompleted(userId, markerId, !completed); await onChanged(); } finally { setUpdating(null); }
  }
  return <section className="page"><div className="page-head"><div><p className="eyebrow">HOJE</p><h1>Sua rotina</h1><p>Marcos informados por você durante a configuração inicial.</p></div></div>{data.routineMarkers.length === 0 ? <EmptyState title="Nenhum marco configurado" description="Atualize seu perfil para informar os horários principais do seu dia."/> : <div className="routine-list">{data.routineMarkers.map((marker) => { const completed = data.routineLogs.some((log) => log.routine_marker_id === marker.id && log.status === "completed"); return <button disabled={updating === marker.id} key={marker.id} className={`routine-item ${completed ? "done" : ""}`} onClick={() => void toggle(marker.id, completed)}><span className="routine-check">{completed && <Check size={16}/>}</span><span className="routine-time">{marker.scheduled_time?.slice(0, 5) ?? "—"}</span><span className="routine-copy"><strong>{marker.name}</strong><small>{marker.instruction}</small></span></button>; })}</div>}<p className="routine-help">Esta rotina é um apoio, não uma cobrança.</p></section>;
}

function SettingsView({ name, email, onSignOut }: { name: string; email: string; onSignOut: () => Promise<void> }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  return <section className="page narrow"><div className="page-head"><div><p className="eyebrow">PREFERÊNCIAS E DADOS</p><h1>Configurações</h1><p>Controle sua experiência e sua sessão.</p></div></div><div className="settings-group"><h2>Conta</h2><div className="setting-row static"><span className="avatar">{name.slice(0, 2).toUpperCase()}</span><span><strong>{name}</strong><small>{email}</small></span></div><button className="setting-row" onClick={() => void onSignOut()}><span className="setting-icon"><LogOut size={19}/></span><span><strong>Sair da conta</strong><small>Seus dados permanecem protegidos no Supabase.</small></span><ChevronRight size={18}/></button></div><div className="settings-group"><h2>Aparência</h2><button className="setting-row" onClick={() => setDark(!dark)}><span className="setting-icon">{dark ? <Moon size={19}/> : <Sun size={19}/>}</span><span><strong>Tema {dark ? "escuro" : "claro"}</strong><small>Toque para alternar a aparência.</small></span><i className={`switch ${dark ? "on" : ""}`}/></button></div><div className="settings-group"><h2>Privacidade</h2><div className="setting-row static"><span className="setting-icon"><Mic size={19}/></span><span><strong>Áudio não é armazenado</strong><small>Somente textos enviados por você são salvos.</small></span></div></div></section>;
}

export function MainApp({ session, profile }: AuthenticatedAppProps) {
  const [view, setView] = useState<View>("chat");
  const [menu, setMenu] = useState(false);
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try { setData(await loadAppData(session.user.id)); }
    catch { setError("Não foi possível carregar seus dados. Tente novamente."); }
    finally { setLoading(false); }
  }, [session.user.id]);

  useEffect(() => {
    let cancelled = false;
    loadAppData(session.user.id)
      .then((loadedData) => {
        if (!cancelled) setData(loadedData);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar seus dados. Tente novamente.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [session.user.id]);

  const content = useMemo(() => ({
    chat: <ChatView data={data} name={profile.display_name} token={session.access_token} onSaved={refresh}/>,
    history: <HistoryView entries={data.entries} onStart={() => setView("chat")}/>,
    summaries: <SummariesView entries={data.entries}/>,
    routine: <RoutineView data={data} userId={session.user.id} onChanged={refresh}/>,
    settings: <SettingsView name={profile.display_name} email={session.user.email ?? ""} onSignOut={async () => { await getSupabase().auth.signOut(); }}/>,
  })[view], [data, profile.display_name, refresh, session.access_token, session.user.email, session.user.id, view]);

  return <main className="app-shell"><aside className={menu ? "open" : ""}><div className="brand"><span>e</span><strong>Evolua</strong><button onClick={() => setMenu(false)} aria-label="Fechar menu"><X size={20}/></button></div><nav>{nav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setMenu(false); }}><item.icon size={19}/><span>{item.label}</span></button>)}</nav><div className="side-footer"><div className="avatar">{profile.display_name.slice(0, 2).toUpperCase()}</div><div><strong>{profile.display_name}</strong><span>Conta pessoal</span></div></div></aside><div className="mobile-bar"><button onClick={() => setMenu(true)} aria-label="Abrir menu"><Menu size={22}/></button><div className="brand"><span>e</span><strong>Evolua</strong></div><button aria-label="Abrir histórico" onClick={() => setView("history")}><Clock3 size={21}/></button></div>{menu && <button className="backdrop" onClick={() => setMenu(false)} aria-label="Fechar menu"/>}<div className="content">{loading ? <div className="page-loading" role="status">Carregando seus dados…</div> : error ? <div className="page-error" role="alert"><p>{error}</p><button onClick={() => void refresh()}>Tentar novamente</button></div> : content}</div></main>;
}
