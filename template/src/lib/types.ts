export interface VoiceEntry {
  id: string;
  user_id: string;
  audio_url: string | null;
  transcript_raw: string;
  transcript_user: string;
  language_detected: string;
  language_rendered: string;
  tags_model: string[];
  tags_user: string[];
  category: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  emotion_score_score: number | null;
  embedding: number[] | null;

  // Optional / extended columns in the real DB
  emotion_score_log?: string | null;
  tags_log?: string | null;
  tags_log_user_original?: string | null;
  entry_emoji?: string | null;
  emoji_source?: string | null;
  emoji_log?: string | null;
  reminder_date?: string | null;
  idea_status?: string | null;
}

export interface Task {
  task_text: string;
  due_date: string | null;
  status: 'pending' | 'completed' | 'in_progress';
  category: string | null;
  source_entry_id: string;
}

export interface VoicePerspective {
  text: string;
  emotion_score: number | null;
  perspective_type: 'rational' | 'emotional' | 'conflict';
  source_entry_id: string;
}

export interface ProcessedResult {
  summary: string;
  tagFrequencies: Record<string, number>;
  tasks: Task[];
  perspectives: VoicePerspective[];
} 