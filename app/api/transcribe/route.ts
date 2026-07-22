import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set(["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg"]);

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!supabaseUrl || !supabaseKey || !openaiKey) throw new Error("Configuração do servidor incompleta");

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

    const form = await request.formData();
    const audio = form.get("audio");
    const durationMs = Number(form.get("duration_ms") ?? 0);
    if (!(audio instanceof File) || audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "Áudio inválido ou muito grande" }, { status: 400 });
    }
    const baseType = audio.type.split(";")[0];
    if (baseType && !ALLOWED_AUDIO_TYPES.has(baseType)) {
      return NextResponse.json({ error: "Formato de áudio não suportado" }, { status: 415 });
    }

    console.info("[api/transcribe] audio received", {
      bytes: audio.size,
      type: baseType || "unknown",
      durationMs: Number.isFinite(durationMs) ? durationMs : 0,
    });

    const client = new OpenAI({ apiKey: openaiKey, maxRetries: 0, timeout: 45_000 });
    const result = await client.audio.transcriptions.create({
      file: audio,
      model: process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-mini-transcribe",
      language: "pt",
      prompt: "Transcreva em português brasileiro, preservando pontuação e nomes mencionados.",
    });
    const text = result.text.trim();
    console.info("[api/transcribe] completed", { textLength: text.length });
    if (!text) {
      return NextResponse.json({ error: "Nenhuma fala detectada", code: "no_speech" }, { status: 422 });
    }
    return NextResponse.json({ text });
  } catch (error) {
    const details = error && typeof error === "object" ? error as Record<string, unknown> : {};
    const quotaUnavailable = details.code === "insufficient_quota";
    console.error("[api/transcribe] failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      status: details.status,
      code: details.code,
    });
    return NextResponse.json(
      { error: quotaUnavailable ? "Créditos de transcrição indisponíveis" : "Não foi possível transcrever o áudio", code: details.code },
      { status: quotaUnavailable ? 503 : 500 },
    );
  }
}
