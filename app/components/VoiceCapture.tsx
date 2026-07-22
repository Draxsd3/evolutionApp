"use client";

import { Check, Mic, MicOff, Pause, Play, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

type VoiceState = "consent" | "starting" | "listening" | "transcribing" | "paused" | "denied" | "unsupported" | "quota" | "no_speech" | "error";

interface VoiceCaptureProps {
  token: string;
  onClose: () => void;
  onUseTranscript: (transcript: string) => void;
}

const stateCopy: Record<VoiceState, string> = {
  consent: "Antes de começar",
  starting: "Preparando o microfone…",
  listening: "Ouvindo",
  transcribing: "Transcrevendo…",
  paused: "Pausado",
  denied: "Microfone bloqueado",
  unsupported: "Navegador incompatível",
  quota: "Transcrição indisponível",
  no_speech: "Nenhuma fala detectada",
  error: "Não foi possível transcrever",
};

function joinTranscript(current: string, addition: string) {
  return [current.trim(), addition.trim()].filter(Boolean).join(" ");
}

function preferredMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function VoiceCapture({ token, onClose, onUseTranscript }: VoiceCaptureProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("consent");
  const [transcript, setTranscript] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [inputLevel, setInputLevel] = useState(0);
  const [hasAudioSignal, setHasAudioSignal] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const meterFrameRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef(0);

  const releaseMicrophone = useCallback(() => {
    if (meterFrameRef.current !== null) cancelAnimationFrame(meterFrameRef.current);
    meterFrameRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setInputLevel(0);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  const close = useCallback(() => {
    discardRef.current = true;
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
    releaseMicrophone();
    onClose();
  }, [onClose, releaseMicrophone]);

  const transcribe = useCallback(async (blob: Blob, durationMs: number) => {
    if (blob.size < 1_000) {
      setVoiceState("paused");
      return;
    }
    setVoiceState("transcribing");
    const extension = blob.type.includes("mp4") ? "m4a" : "webm";
    const form = new FormData();
    form.append("audio", blob, `relato.${extension}`);
    form.append("duration_ms", String(durationMs));

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const result = await response.json() as { text?: string; error?: string; code?: string };
      if (!response.ok) {
        setVoiceState(result.code === "insufficient_quota" ? "quota" : result.code === "no_speech" ? "no_speech" : "error");
        return;
      }
      setTranscript((current) => joinTranscript(current, result.text ?? ""));
      setVoiceState("paused");
    } catch {
      setVoiceState("error");
    }
  }, [token]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVoiceState("unsupported");
      return;
    }
    setVoiceState("starting");
    discardRef.current = false;
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const mimeType = preferredMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      const updateMeter = () => {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) {
          const normalized = (sample - 128) / 128;
          sum += normalized * normalized;
        }
        const level = Math.min(1, Math.sqrt(sum / samples.length) * 5);
        setInputLevel(level);
        if (level > 0.04) setHasAudioSignal(true);
        meterFrameRef.current = requestAnimationFrame(updateMeter);
      };
      audioContextRef.current = audioContext;
      updateMeter();
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        releaseMicrophone();
        setVoiceState("error");
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const durationMs = Date.now() - recordingStartedAtRef.current;
        chunksRef.current = [];
        releaseMicrophone();
        if (!discardRef.current) void transcribe(blob, durationMs);
      };
      recorder.start(500);
      recordingStartedAtRef.current = Date.now();
      setRecordingSeconds(0);
      setHasAudioSignal(false);
      setVoiceState("listening");
    } catch (error) {
      releaseMicrophone();
      const permissionDenied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
      setVoiceState(permissionDenied ? "denied" : "error");
    }
  }, [releaseMicrophone, transcribe]);

  function pause() {
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
  }

  function useTranscript() {
    if (!transcript.trim()) return;
    releaseMicrophone();
    onUseTranscript(transcript.trim());
  }

  useEffect(() => {
    if (voiceState !== "listening") return;
    const timer = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1_000);
    return () => window.clearInterval(timer);
  }, [voiceState]);

  useEffect(() => {
    if (recordingSeconds >= 300 && recorderRef.current?.state === "recording") pause();
  }, [recordingSeconds]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      discardRef.current = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      releaseMicrophone();
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, releaseMicrophone]);

  const active = voiceState === "listening" || voiceState === "starting" || voiceState === "transcribing";
  const minutes = Math.floor(recordingSeconds / 60).toString().padStart(2, "0");
  const seconds = (recordingSeconds % 60).toString().padStart(2, "0");

  return <div className="voice-backdrop" role="presentation">
    <section className="voice-panel" role="dialog" aria-modal="true" aria-labelledby="voice-title" aria-describedby="voice-description">
      <button className="voice-close" onClick={close} aria-label="Cancelar conversa por voz"><X size={21}/></button>

      {voiceState === "consent" ? <>
        <div className="voice-privacy-icon"><ShieldCheck size={25}/></div>
        <p className="eyebrow">PRIVACIDADE DA VOZ</p>
        <h2 id="voice-title">Fale do seu jeito</h2>
        <p id="voice-description" className="voice-description">O microfone só será ativado após sua confirmação. O áudio será enviado com segurança apenas para gerar a transcrição e não será armazenado pelo Evolua. Somente o texto que você confirmar será salvo.</p>
        <div className="voice-actions consent-actions">
          <button className="voice-secondary" onClick={close}>Agora não</button>
          <button className="voice-primary" onClick={() => void start()} autoFocus><Mic size={18}/> Ativar microfone</button>
        </div>
      </> : <>
        <div className={`voice-indicator ${voiceState === "listening" ? "active" : ""}`} style={{ "--input-level": inputLevel } as CSSProperties} aria-hidden="true"><span/><span/><span/><span/></div>
        <p className="voice-state" aria-live="polite">{stateCopy[voiceState]}{voiceState === "listening" ? ` · ${minutes}:${seconds}` : ""}</p>
        <h2 id="voice-title">Conversa por voz</h2>
        <p id="voice-description" className="voice-description">
          {voiceState === "listening" && "Fale naturalmente. Ao pausar, seu áudio será transcrito."}
          {voiceState === "paused" && "Revise ou edite a transcrição antes de usar no chat."}
          {voiceState === "starting" && "Aguardando sua permissão para usar o microfone."}
          {voiceState === "transcribing" && "Convertendo sua fala em texto. O áudio será descartado em seguida."}
          {voiceState === "denied" && "Permita o microfone nas configurações do navegador e tente novamente."}
          {voiceState === "unsupported" && "Este navegador não permite capturar áudio. Use uma versão recente do Chrome, Edge ou Safari."}
          {voiceState === "quota" && "A conta da OpenAI está sem créditos para transcrever. Seu áudio não foi armazenado."}
          {voiceState === "no_speech" && "Não encontramos voz nesse trecho. Confirme o microfone selecionado, aproxime-se e fale novamente."}
          {voiceState === "error" && "Verifique sua conexão e tente iniciar a captura novamente."}
        </p>
        {voiceState === "listening" && recordingSeconds >= 2 && !hasAudioSignal && <p className="voice-signal-warning" role="status">Sinal muito baixo. Verifique se o microfone correto está ativo.</p>}

        <label className="voice-transcript-label" htmlFor="voice-transcript">Transcrição</label>
        <textarea id="voice-transcript" className="voice-transcript" value={transcript} onChange={(event) => setTranscript(event.target.value)} disabled={active} placeholder={voiceState === "listening" ? "Sua fala será transcrita ao pausar…" : "Sua fala aparecerá aqui."} rows={5}/>

        <div className="voice-controls">
          {voiceState === "listening" ? <button className="voice-control" onClick={pause}><Pause size={20}/><span>Pausar</span></button>
            : <button className="voice-control" onClick={() => void start()} disabled={voiceState === "starting" || voiceState === "transcribing"}><Play size={20}/><span>{voiceState === "paused" ? "Continuar" : "Tentar novamente"}</span></button>}
          <button className="voice-control danger" onClick={close}><MicOff size={20}/><span>Cancelar</span></button>
          <button className="voice-control confirm" onClick={useTranscript} disabled={!transcript.trim() || active}><Check size={20}/><span>Usar texto</span></button>
        </div>
        <p className="voice-storage-note">Limite de 5 minutos por trecho · Áudio descartado após transcrição</p>
      </>}
    </section>
  </div>;
}
