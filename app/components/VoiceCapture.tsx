"use client";

import { Check, Mic, MicOff, Pause, Play, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type VoiceState = "consent" | "starting" | "listening" | "paused" | "denied" | "unsupported" | "error";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: { transcript: string };
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}

interface SpeechRecognitionErrorLike extends Event {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface VoiceCaptureProps {
  onClose: () => void;
  onUseTranscript: (transcript: string) => void;
}

const stateCopy: Record<VoiceState, string> = {
  consent: "Antes de começar",
  starting: "Preparando o microfone…",
  listening: "Ouvindo",
  paused: "Pausado",
  denied: "Microfone bloqueado",
  unsupported: "Navegador incompatível",
  error: "Não foi possível transcrever",
};

function joinTranscript(current: string, addition: string) {
  return [current.trim(), addition.trim()].filter(Boolean).join(" ");
}

export function VoiceCapture({ onClose, onUseTranscript }: VoiceCaptureProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("consent");
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldListenRef = useRef(false);
  const closingRef = useRef(false);

  const stopRecognition = useCallback((abort = false) => {
    shouldListenRef.current = false;
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (abort) recognition.abort();
    else recognition.stop();
  }, []);

  const close = useCallback(() => {
    closingRef.current = true;
    stopRecognition(true);
    onClose();
  }, [onClose, stopRecognition]);

  const createRecognition = useCallback(() => {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceState("unsupported");
      return null;
    }

    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => setVoiceState("listening");
    recognition.onresult = (event) => {
      let confirmed = "";
      let partial = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) confirmed = joinTranscript(confirmed, transcript);
        else partial = joinTranscript(partial, transcript);
      }
      if (confirmed) setFinalText((current) => joinTranscript(current, confirmed));
      setInterimText(partial);
    };
    recognition.onerror = (event) => {
      if (event.error === "aborted" && closingRef.current) return;
      shouldListenRef.current = false;
      setInterimText("");
      setVoiceState(event.error === "not-allowed" || event.error === "service-not-allowed" ? "denied" : "error");
    };
    recognition.onend = () => {
      if (closingRef.current || !shouldListenRef.current) return;
      window.setTimeout(() => {
        if (!closingRef.current && shouldListenRef.current) {
          try { recognition.start(); } catch { setVoiceState("error"); }
        }
      }, 250);
    };
    recognitionRef.current = recognition;
    return recognition;
  }, []);

  const start = useCallback(() => {
    closingRef.current = false;
    setVoiceState("starting");
    shouldListenRef.current = true;
    const recognition = recognitionRef.current ?? createRecognition();
    if (!recognition) return;
    try {
      recognition.start();
    } catch {
      shouldListenRef.current = false;
      setVoiceState("error");
    }
  }, [createRecognition]);

  function pause() {
    stopRecognition();
    setInterimText("");
    setVoiceState("paused");
  }

  function useTranscript() {
    const transcript = joinTranscript(finalText, interimText);
    if (!transcript) return;
    closingRef.current = true;
    stopRecognition();
    onUseTranscript(transcript);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      closingRef.current = true;
      stopRecognition(true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, stopRecognition]);

  const transcript = joinTranscript(finalText, interimText);
  const active = voiceState === "listening" || voiceState === "starting";

  return <div className="voice-backdrop" role="presentation">
    <section className="voice-panel" role="dialog" aria-modal="true" aria-labelledby="voice-title" aria-describedby="voice-description">
      <button className="voice-close" onClick={close} aria-label="Cancelar conversa por voz"><X size={21}/></button>

      {voiceState === "consent" ? <>
        <div className="voice-privacy-icon"><ShieldCheck size={25}/></div>
        <p className="eyebrow">PRIVACIDADE DA VOZ</p>
        <h2 id="voice-title">Fale do seu jeito</h2>
        <p id="voice-description" className="voice-description">O microfone só será ativado após sua confirmação. O navegador processa sua fala para gerar a transcrição; o Evolua não armazena o áudio original. Somente o texto que você confirmar será enviado.</p>
        <div className="voice-actions consent-actions">
          <button className="voice-secondary" onClick={close}>Agora não</button>
          <button className="voice-primary" onClick={start}><Mic size={18}/> Ativar microfone</button>
        </div>
      </> : <>
        <div className={`voice-indicator ${active ? "active" : ""}`} aria-hidden="true">
          <span/><span/><span/><span/>
        </div>
        <p className="voice-state" aria-live="polite">{stateCopy[voiceState]}</p>
        <h2 id="voice-title">Conversa por voz</h2>
        <p id="voice-description" className="voice-description">
          {voiceState === "listening" && "Fale naturalmente. Você pode pausar a qualquer momento."}
          {voiceState === "paused" && "Revise ou edite a transcrição antes de usar no chat."}
          {voiceState === "starting" && "Aguardando a permissão e preparando a captura."}
          {voiceState === "denied" && "Permita o acesso ao microfone nas configurações do navegador e tente novamente."}
          {voiceState === "unsupported" && "Use uma versão recente do Chrome, Edge ou Safari para ditar seu relato."}
          {voiceState === "error" && "Verifique sua conexão e tente iniciar a captura novamente."}
        </p>

        <label className="voice-transcript-label" htmlFor="voice-transcript">Transcrição</label>
        <textarea
          id="voice-transcript"
          className="voice-transcript"
          value={transcript}
          onChange={(event) => { setFinalText(event.target.value); setInterimText(""); }}
          disabled={active}
          placeholder={active ? "Comece a falar…" : "Sua fala aparecerá aqui."}
          rows={5}
        />

        <div className="voice-controls">
          {active ? <button className="voice-control" onClick={pause}><Pause size={20}/><span>Pausar</span></button>
            : <button className="voice-control" onClick={start}><Play size={20}/><span>{voiceState === "paused" ? "Retomar" : "Tentar novamente"}</span></button>}
          <button className="voice-control danger" onClick={close}><MicOff size={20}/><span>Cancelar</span></button>
          <button className="voice-control confirm" onClick={useTranscript} disabled={!transcript.trim()}><Check size={20}/><span>Usar texto</span></button>
        </div>
        <p className="voice-storage-note">Áudio original não armazenado · Transcrição editável</p>
      </>}
    </section>
  </div>;
}
