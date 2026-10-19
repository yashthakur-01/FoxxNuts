/**
 * Workspace Configuration & Data Types
 */

export interface Workspace {
  id: string;
  cust_id?: string;
  workspace_name: string;
  workspace_description?: string;
  workspace_url?: string;
  onboarding_completed?: boolean;
  chatbot_name?: string;
  chatbot_description?: string;
  chatbot_avatar?: string;
  primary_color?: string;
  welcome_message?: string;
  suggested_questions?: string[];
  widget_position?: string;
  chatbot_theme?: string;
  temperature?: number;
  model_name?: string;
  provider?: string;
  system_prompt?: string;
  llm_api_key?: string | null;
  has_custom_api_key?: boolean;
  search_enabled?: boolean;
  chunk_size?: number;
  chunk_overlap?: number;
  similarity_threshold?: number;
  top_k?: number;
  allowed_domains?: string;
  created_at: string;
}

export interface WorkspaceFile {
  file_id: string;
  file_name: string;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  created_at: string;
  file_path?: string;
  workspace_id?: string;
}

export interface WorkspaceOwnerCheck {
  cust_id: string;
}
