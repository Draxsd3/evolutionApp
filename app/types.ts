import type { Session } from "@supabase/supabase-js";

export type View = "chat" | "history" | "summaries" | "routine" | "settings";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  goals: string[];
  preferences: {
    onboarding_completed?: boolean;
    wake_time?: string;
    sleep_time?: string;
  };
}

export interface DailyEntry {
  id: string;
  entry_date: string;
  original_text: string;
  ai_summary: string | null;
  mood_score: number | null;
  energy_score: number | null;
  focus_score: number | null;
  sleep_hours: number | null;
  worked_or_studied_minutes: number | null;
  trained: boolean | null;
  next_action: string | null;
  tags: string[];
}

export interface RoutineMarker {
  id: string;
  name: string;
  scheduled_time: string | null;
  instruction: string | null;
  active: boolean;
}

export interface RoutineLog {
  routine_marker_id: string;
  status: "pending" | "completed" | "skipped";
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface AppData {
  entries: DailyEntry[];
  routineMarkers: RoutineMarker[];
  routineLogs: RoutineLog[];
  messages: ConversationMessage[];
}

export interface AuthenticatedAppProps {
  session: Session;
  profile: Profile;
}
