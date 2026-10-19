/**
 * Observability & Analytics Type Definitions
 * Represents telemetry metrics, trace logs, and knowledge gap analyses.
 */

export interface MinutePoint {
  time: string;
  rpm: number;
  tpm: number;
}

export interface DailyPoint {
  date: string;
  rpd: number;
  tpd: number;
}

export interface Metrics {
  total_queries: number;
  total_tokens: number;
  avg_duration_ms: number;
  context_found_rate: number;
  csat_score: number;
  likes: number;
  dislikes: number;
  total_rated: number;
  rpm: number;
  tpm: number;
  rpd: number;
  tpd: number;
  minute_timeline: MinutePoint[];
  daily_timeline: DailyPoint[];
}

export interface QueryContextPair {
  query: string;
  context_received: string;
  context_found?: boolean;
  query_type?: string;
}

export interface TrajectoryStep {
  node_name?: string;
  name?: string;
  duration_ms?: number;
  tokens?: {
    total_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  output?: any;
  timestamp?: string;
}

export interface Trace {
  id: string;
  session_id: string;
  query: string;
  final_response: string;
  total_tokens: number;
  total_duration_ms: number;
  trajectory: TrajectoryStep[];
  error_messages: any[];
  query_context_pairs: QueryContextPair[];
  query_type?: string;
  csat_rating?: number | null;
  created_at: string;
}

export interface GapItem {
  trace_id: string;
  session_id: string;
  query: string;
  context_received: string;
  context_found: boolean;
  created_at: string;
}

export interface SessionGroup {
  sessionId: string;
  traces: Trace[];
  totalTokens: number;
  totalDurationMs: number;
  firstTimestamp: string;
  lastTimestamp: string;
  messageCount: number;
  hasGap: boolean;
}
