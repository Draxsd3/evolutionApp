import OpenAI from "openai";
import { extractedEntrySchema } from "./schema.js";

const systemPrompt = `Você é a assistente do Evolua, um diário pessoal cuidadoso e não julgador.
Extraia somente fatos explícitos e use null quando não houver evidência.
Nunca diagnostique, prescreva ou trate correlação como causalidade.
Responda em português natural, reconheça dificuldades sem moralizar e faça no máximo uma pergunta curta.
Retorne JSON com as chaves conversation_reply e entry.`;

interface ModelResponse {
  conversation_reply: unknown;
  entry: unknown;
}

export interface UserContext {
  displayName: string | null;
  goals: unknown;
  preferences: unknown;
  routine: Array<{
    name: string;
    scheduled_time: string | null;
    instruction: string | null;
  }>;
}

export async function interpretEntry(
  text: string,
  date: string,
  context: UserContext,
) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    input: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          `Data local: ${date}`,
          `Contexto cadastrado pelo usuário: ${JSON.stringify(context)}`,
          `Relato de hoje: ${text}`,
        ].join("\n"),
      },
    ],
    text: { format: { type: "json_object" } },
  });
  const parsed = JSON.parse(response.output_text) as ModelResponse;

  if (typeof parsed.conversation_reply !== "string") {
    throw new Error("Resposta conversacional inválida");
  }

  return {
    conversation_reply: parsed.conversation_reply,
    entry: extractedEntrySchema.parse(parsed.entry),
  };
}
