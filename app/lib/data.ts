import type { User } from "@supabase/supabase-js";
import type {
  AppData,
  DailyEntry,
  Profile,
  RoutineLog,
  RoutineMarker,
} from "../types";
import { getSupabase } from "./supabase";

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id,user_id,display_name,goals,preferences")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function saveOnboarding(
  user: User,
  input: {
    displayName: string;
    goals: string[];
    wakeTime: string;
    workTime: string;
    sleepTime: string;
  },
): Promise<Profile> {
  const supabase = getSupabase();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        display_name: input.displayName,
        goals: input.goals,
        preferences: {
          onboarding_completed: true,
          wake_time: input.wakeTime,
          sleep_time: input.sleepTime,
        },
      },
      { onConflict: "user_id" },
    )
    .select("id,user_id,display_name,goals,preferences")
    .single();

  if (profileError) throw profileError;

  const { error: clearError } = await supabase
    .from("routine_markers")
    .delete()
    .eq("user_id", user.id);
  if (clearError) throw clearError;

  const markers = [
    {
      user_id: user.id,
      name: "Começar o dia",
      scheduled_time: input.wakeTime,
      instruction: "Horário aproximado em que você costuma acordar.",
      frequency: { days: "daily" },
    },
    {
      user_id: user.id,
      name: "Trabalho ou estudo",
      scheduled_time: input.workTime,
      instruction: "Horário aproximado para iniciar sua atividade principal.",
      frequency: { days: "weekdays" },
    },
    {
      user_id: user.id,
      name: "Desacelerar",
      scheduled_time: input.sleepTime,
      instruction: "Horário aproximado para encerrar o dia e se preparar para dormir.",
      frequency: { days: "daily" },
    },
  ];
  const { error: markerError } = await supabase
    .from("routine_markers")
    .insert(markers);
  if (markerError) throw markerError;

  return profile as Profile;
}

export async function loadAppData(userId: string): Promise<AppData> {
  const supabase = getSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const [entriesResult, markersResult, logsResult, messagesResult] =
    await Promise.all([
      supabase
        .from("daily_entries")
        .select(
          "id,entry_date,original_text,ai_summary,mood_score,energy_score,focus_score,sleep_hours,worked_or_studied_minutes,trained,next_action,tags",
        )
        .eq("user_id", userId)
        .order("entry_date", { ascending: false })
        .limit(60),
      supabase
        .from("routine_markers")
        .select("id,name,scheduled_time,instruction,active")
        .eq("user_id", userId)
        .eq("active", true)
        .order("scheduled_time", { ascending: true }),
      supabase
        .from("routine_logs")
        .select("routine_marker_id,status")
        .eq("user_id", userId)
        .eq("log_date", today),
      supabase
        .from("messages")
        .select("id,role,content,created_at")
        .eq("user_id", userId)
        .in("role", ["user", "assistant"])
        .order("created_at", { ascending: true })
        .limit(50),
    ]);

  const firstError = [
    entriesResult.error,
    markersResult.error,
    logsResult.error,
    messagesResult.error,
  ].find(Boolean);
  if (firstError) throw firstError;

  return {
    entries: (entriesResult.data ?? []) as DailyEntry[],
    routineMarkers: (markersResult.data ?? []) as RoutineMarker[],
    routineLogs: (logsResult.data ?? []) as RoutineLog[],
    messages: (messagesResult.data ?? []) as AppData["messages"],
  };
}

export async function setRoutineCompleted(
  userId: string,
  markerId: string,
  completed: boolean,
) {
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await getSupabase()
    .from("routine_logs")
    .upsert(
      {
        user_id: userId,
        routine_marker_id: markerId,
        log_date: today,
        status: completed ? "completed" : "pending",
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "routine_marker_id,log_date" },
    );
  if (error) throw error;
}
