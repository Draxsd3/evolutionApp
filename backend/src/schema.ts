import { z } from "zod";

const optionalScore = z.number().int().min(0).max(10).nullable();

export const extractedEntrySchema = z
  .object({
    entry_date: z.string().date(),
    summary: z.string().min(1).max(1_500),
    mood_score: optionalScore,
    energy_score: optionalScore,
    focus_score: optionalScore,
    sleep_hours: z.number().min(0).max(24).nullable(),
    sleep_quality_score: optionalScore,
    difficulty_starting_score: optionalScore,
    hydration_liters: z.number().min(0).max(15).nullable(),
    trained: z.boolean().nullable(),
    worked_or_studied_minutes: z.number().int().min(0).max(1_440).nullable(),
    excessive_phone_use: z.boolean().nullable(),
    meals: z
      .array(
        z.object({
          type: z.string().max(40),
          description: z.string().max(500),
          quality_score: optionalScore,
        }),
      )
      .max(12)
      .default([]),
    achievements: z.array(z.string().max(300)).max(20).default([]),
    difficulties: z.array(z.string().max(300)).max(20).default([]),
    tags: z.array(z.string().max(60)).max(20).default([]),
    next_action: z.string().max(300).nullable().default(null),
  })
  .strict();

export type ExtractedEntry = z.infer<typeof extractedEntrySchema>;
