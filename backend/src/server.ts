import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import express from "express";
import { z } from "zod";
import { interpretEntry } from "./ai.js";

const port = Number(process.env.PORT ?? 8787);
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";

const chatRequestSchema = z.object({
  content: z.string().trim().min(1).max(10_000),
  entryDate: z.string().date(),
});

const app = express();

app.use(cors({ origin: frontendUrl }));
app.use(express.json({ limit: "64kb" }));

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/chat", async (request, response) => {
  try {
    const token = request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return response.status(401).json({ error: "Autenticação necessária" });
    }

    const body = chatRequestSchema.parse(request.body);
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return response.status(401).json({ error: "Sessão inválida" });
    }

    const [{ data: profile, error: profileError }, { data: routine, error: routineError }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("display_name,goals,preferences")
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("routine_markers")
          .select("name,scheduled_time,instruction")
          .eq("user_id", user.id)
          .eq("active", true)
          .order("scheduled_time"),
      ]);

    if (profileError || routineError) throw profileError ?? routineError;

    const result = await interpretEntry(body.content, body.entryDate, {
      displayName: profile.display_name,
      goals: profile.goals,
      preferences: profile.preferences,
      routine: routine ?? [],
    });
    const { meals, achievements, difficulties, summary, ...dailyEntry } =
      result.entry;
    const { data: entry, error } = await supabase
      .from("daily_entries")
      .upsert(
        {
          user_id: user.id,
          original_text: body.content,
          ai_summary: summary,
          ...dailyEntry,
        },
        { onConflict: "user_id,entry_date" },
      )
      .select()
      .single();

    if (error) throw error;

    const childTables = ["meals", "achievements", "difficulties"] as const;
    for (const table of childTables) {
      const { error: clearError } = await supabase
        .from(table)
        .delete()
        .eq("daily_entry_id", entry.id);
      if (clearError) throw clearError;
    }

    if (meals.length > 0) {
      const { error: mealsError } = await supabase.from("meals").insert(
        meals.map((meal) => ({
          user_id: user.id,
          daily_entry_id: entry.id,
          meal_type: meal.type,
          description: meal.description,
          quality_score: meal.quality_score,
        })),
      );
      if (mealsError) throw mealsError;
    }

    if (achievements.length > 0) {
      const { error: achievementsError } = await supabase
        .from("achievements")
        .insert(
          achievements.map((description) => ({
            user_id: user.id,
            daily_entry_id: entry.id,
            description,
          })),
        );
      if (achievementsError) throw achievementsError;
    }

    if (difficulties.length > 0) {
      const { error: difficultiesError } = await supabase
        .from("difficulties")
        .insert(
          difficulties.map((description) => ({
            user_id: user.id,
            daily_entry_id: entry.id,
            description,
          })),
        );
      if (difficultiesError) throw difficultiesError;
    }

    const { data: existingConversation, error: conversationLookupError } =
      await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
    if (conversationLookupError) throw conversationLookupError;

    let conversationId = existingConversation?.id as string | undefined;
    if (!conversationId) {
      const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: "Diário" })
        .select("id")
        .single();
      if (conversationError) throw conversationError;
      conversationId = conversation.id;
    }

    const { error: messagesError } = await supabase.from("messages").insert([
      {
        user_id: user.id,
        conversation_id: conversationId,
        role: "user",
        content: body.content,
      },
      {
        user_id: user.id,
        conversation_id: conversationId,
        role: "assistant",
        content: result.conversation_reply,
        metadata: { daily_entry_id: entry.id },
      },
    ]);
    if (messagesError) throw messagesError;

    return response.json({ ...result, entry_id: entry.id });
  } catch (error) {
    console.error(
      "Falha ao processar registro",
      error instanceof Error ? error.name : "UnknownError",
    );

    const isValidationError = error instanceof z.ZodError;
    return response.status(isValidationError ? 400 : 500).json({
      error: isValidationError
        ? "Relato inválido"
        : "Não foi possível registrar agora. Tente novamente.",
    });
  }
});

app.listen(port, () => {
  console.log(`API pronta na porta ${port}`);
});
