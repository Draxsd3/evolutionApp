import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { extractedEntrySchema } from "../../../backend/src/schema";

export const runtime = "nodejs";

const chatRequestSchema = z.object({
  content: z.string().trim().min(1).max(10_000),
  entryDate: z.string().date(),
});

const systemPrompt = `Você é a assistente do Evolua, um diário pessoal cuidadoso e não julgador.
Extraia somente fatos explícitos e use null quando não houver evidência.
Nunca diagnostique, prescreva ou trate correlação como causalidade.
Responda em português natural, reconheça dificuldades sem moralizar e faça no máximo uma pergunta curta.
Retorne JSON com as chaves conversation_reply e entry.`;

async function interpretEntry(text: string, date: string, context: unknown) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: [`Data local: ${date}`, `Contexto cadastrado pelo usuário: ${JSON.stringify(context)}`, `Relato de hoje: ${text}`].join("\n") },
    ],
    text: { format: { type: "json_object" } },
  });
  const parsed = JSON.parse(response.output_text) as { conversation_reply?: unknown; entry?: unknown };
  if (typeof parsed.conversation_reply !== "string") throw new Error("Resposta conversacional inválida");
  return { conversation_reply: parsed.conversation_reply, entry: extractedEntrySchema.parse(parsed.entry) };
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Autenticação necessária" }, { status: 401 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey || !process.env.OPENAI_API_KEY) {
      throw new Error("Configuração do servidor incompleta");
    }

    const body = chatRequestSchema.parse(await request.json());
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const [profileResult, routineResult] = await Promise.all([
      supabase.from("profiles").select("display_name,goals,preferences").eq("user_id", user.id).single(),
      supabase.from("routine_markers").select("name,scheduled_time,instruction").eq("user_id", user.id).eq("active", true).order("scheduled_time"),
    ]);
    if (profileResult.error || routineResult.error) throw profileResult.error ?? routineResult.error;

    const result = await interpretEntry(body.content, body.entryDate, {
      displayName: profileResult.data.display_name,
      goals: profileResult.data.goals,
      preferences: profileResult.data.preferences,
      routine: routineResult.data ?? [],
    });
    const { meals, achievements, difficulties, summary, ...dailyEntry } = result.entry;
    const { data: entry, error: entryError } = await supabase
      .from("daily_entries")
      .upsert({ user_id: user.id, original_text: body.content, ai_summary: summary, ...dailyEntry }, { onConflict: "user_id,entry_date" })
      .select("id")
      .single();
    if (entryError) throw entryError;

    for (const table of ["meals", "achievements", "difficulties"] as const) {
      const { error } = await supabase.from(table).delete().eq("daily_entry_id", entry.id);
      if (error) throw error;
    }
    if (meals.length) {
      const { error } = await supabase.from("meals").insert(meals.map((meal) => ({ user_id: user.id, daily_entry_id: entry.id, meal_type: meal.type, description: meal.description, quality_score: meal.quality_score })));
      if (error) throw error;
    }
    if (achievements.length) {
      const { error } = await supabase.from("achievements").insert(achievements.map((description) => ({ user_id: user.id, daily_entry_id: entry.id, description })));
      if (error) throw error;
    }
    if (difficulties.length) {
      const { error } = await supabase.from("difficulties").insert(difficulties.map((description) => ({ user_id: user.id, daily_entry_id: entry.id, description })));
      if (error) throw error;
    }

    const { data: existingConversation, error: lookupError } = await supabase
      .from("conversations").select("id").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (lookupError) throw lookupError;
    let conversationId = existingConversation?.id;
    if (!conversationId) {
      const { data, error } = await supabase.from("conversations").insert({ user_id: user.id, title: "Diário" }).select("id").single();
      if (error) throw error;
      conversationId = data.id;
    }

    const { error: messagesError } = await supabase.from("messages").insert([
      { user_id: user.id, conversation_id: conversationId, role: "user", content: body.content },
      { user_id: user.id, conversation_id: conversationId, role: "assistant", content: result.conversation_reply, metadata: { daily_entry_id: entry.id } },
    ]);
    if (messagesError) throw messagesError;

    return NextResponse.json({ ...result, entry_id: entry.id });
  } catch (error) {
    console.error("Falha ao processar registro", error instanceof Error ? error.name : "UnknownError");
    const invalidRequest = error instanceof z.ZodError;
    return NextResponse.json(
      { error: invalidRequest ? "Relato inválido" : "Não foi possível registrar agora. Tente novamente." },
      { status: invalidRequest ? 400 : 500 },
    );
  }
}
