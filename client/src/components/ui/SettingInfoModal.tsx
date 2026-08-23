"use client";

import React, { useState } from "react";
import Modal from "./Modal";

export interface SettingDetail {
  title: string;
  category?: string;
  use: string;
  differences: {
    label: string;
    description: string;
  }[];
  recommendations: {
    useCase: string;
    value: string;
    explanation: string;
  }[];
  notes?: string;
}

export const SETTINGS_INFO_DATABASE: Record<string, SettingDetail> = {
  // ============================================================
  // PROMPTS & BEHAVIOUR
  // ============================================================
  "prompts-section": {
    title: "Prompt & Behaviour Settings",
    category: "Prompt & Persona",
    use: "Configures how the AI introduces itself, its tone of voice, operational boundaries, and pre-configured quick question suggestions.",
    differences: [
      {
        label: "Welcome Message",
        description: "The initial greeting message shown to users as soon as they open the chat.",
      },
      {
        label: "System Prompt",
        description: "Master system instructions that govern how strictly the AI relies on uploaded documents versus general knowledge.",
      },
      {
        label: "Suggested Questions",
        description: "Interactive pills that allow users to ask common questions with a single click.",
      },
      {
        label: "Google Web Search",
        description: "Enables fallback internet search when answers are not present in your local document collection.",
      },
    ],
    recommendations: [
      {
        useCase: "Enterprise Knowledge Base",
        value: "Strict Grounding + Web Search OFF",
        explanation: "Ensures the chatbot only answers from your approved documents and avoids external hallucinations.",
      },
      {
        useCase: "Customer Support & Sales",
        value: "Friendly Persona + 3-4 FAQ Suggestions",
        explanation: "Guides visitors immediately to pricing, features, and help resources.",
      },
    ],
  },
  "welcome-message": {
    title: "Welcome Message",
    category: "Prompt & Persona",
    use: "The first message displayed to visitors before they start typing. Sets the first impression and introduces what the chatbot can help with.",
    differences: [
      {
        label: "Short & Direct",
        description: "'Hello! How can I help you today?' — Minimalist, leaves full freedom to the user.",
      },
      {
        label: "Domain-Specific Guidance",
        description: "'Welcome to Acme HR! Ask me about leave policies, salary slips, or benefits.' — Immediately sets expectations.",
      },
      {
        label: "Action-Oriented",
        description: "'Hi there! Looking for pricing, documentation, or booking a demo?' — Drives high-intent user actions.",
      },
    ],
    recommendations: [
      {
        useCase: "Internal HR / Company Wiki",
        value: "'Hi! Ask me anything about company policies, leave, health insurance, or travel claims.'",
        explanation: "Clarifies the scope of documents indexed in the knowledge base.",
      },
      {
        useCase: "Customer Support",
        value: "'Hello! How can I help you with your account, billing, or technical questions today?'",
        explanation: "Welcomes customers with a helpful and accessible tone.",
      },
    ],
  },
  "system-prompt": {
    title: "System Prompt & Persona",
    category: "Prompt & Persona",
    use: "The foundational system prompt injected into the LLM context. Instructs the AI on tone, persona, grounding boundaries, and anti-hallucination rules.",
    differences: [
      {
        label: "Strict Document Grounding",
        description: "Instructs the AI to rely ONLY on retrieved context chunks and explicitly say 'I cannot find this information' if not found.",
      },
      {
        label: "Conversational & Explanatory",
        description: "Balances document context with clear, professional explanations and polite conversational replies.",
      },
      {
        label: "Roleplay / Specialized Expert",
        description: "Adopts a specialized persona (e.g. Senior DevOps Architect, Legal Compliance Auditor).",
      },
    ],
    recommendations: [
      {
        useCase: "Compliance, Legal, Financial & Medical",
        value: "Strict Grounding: 'Answer relying strictly on provided context. Never fabricate facts. If absent, reply strictly: I cannot find this information.'",
        explanation: "Zero-tolerance for hallucinations or unverified assumptions.",
      },
      {
        useCase: "SaaS Product Support",
        value: "'You are a friendly customer success agent. Provide clear step-by-step troubleshooting guides based on our documentation.'",
        explanation: "Optimized for user satisfaction and clarity.",
      },
    ],
  },
  "suggested-questions": {
    title: "Suggested Questions (Quick-Replies)",
    category: "Prompt & Persona",
    use: "Pre-configured question pills displayed when the conversation starts. Enables users to explore high-frequency topics in 1 click.",
    differences: [
      {
        label: "1–2 Questions",
        description: "Minimalist, keeps chat window clean and uncluttered.",
      },
      {
        label: "3–4 Questions (Recommended)",
        description: "Provides balanced variety covering the main areas of your knowledge base.",
      },
      {
        label: "5+ Questions",
        description: "Renders in a scrollable wrap; best for broad catalogs.",
      },
    ],
    recommendations: [
      {
        useCase: "HR / Operations Portal",
        value: "'What is the annual leave policy?', 'How do I submit expense claims?', 'What are the health benefits?'",
        explanation: "Addresses the top 80% of routine employee inquiries.",
      },
      {
        useCase: "Website Product Assistant",
        value: "'What are your pricing plans?', 'Do you support custom integrations?', 'How do I get started?'",
        explanation: "Accelerates lead qualification and customer onboarding.",
      },
    ],
  },
  "search-enabled": {
    title: "Real-Time Google Web Search (Tavily)",
    category: "Search & Retrieval",
    use: "Grants the chatbot live internet search capabilities via Tavily engine to answer queries requiring real-time information or external references.",
    differences: [
      {
        label: "Enabled (ON)",
        description: "When internal document context is insufficient, the AI can search Google and return web snippets with source links.",
      },
      {
        label: "Disabled (OFF)",
        description: "The AI is strictly restricted to your uploaded internal files. No external web queries are made.",
      },
    ],
    recommendations: [
      {
        useCase: "Confidential Internal Enterprise Documents",
        value: "OFF (Disabled)",
        explanation: "Guarantees no outside data leakage and keeps responses strictly enclosed to proprietary documents.",
      },
      {
        useCase: "Market Research, Tech Support & News",
        value: "ON (Enabled)",
        explanation: "Allows the bot to lookup latest API changes, live pricing, or external public facts.",
      },
    ],
  },

  // ============================================================
  // ADVANCED AI & RETRIEVAL SETTINGS
  // ============================================================
  "advanced-section": {
    title: "Advanced AI & Retrieval Parameters",
    category: "Advanced Inference",
    use: "Fine-tunes the underlying LLM provider, inference models, temperature creativity, vector similarity threshold, and chunk partitioning.",
    differences: [
      {
        label: "AI Provider & Model",
        description: "Controls the engine generating completions (Groq ultra-fast LPU vs OpenAI).",
      },
      {
        label: "Temperature",
        description: "Controls the degree of randomness/creativity in token generation (0.0 to 1.0).",
      },
      {
        label: "Similarity Threshold",
        description: "Controls how strictly vector search chunks must match the query before being sent to the LLM.",
      },
      {
        label: "Chunk Size & Overlap",
        description: "Defines how large document text pieces are partitioned when ingested into Pinecone.",
      },
    ],
    recommendations: [
      {
        useCase: "Production RAG Chatbot",
        value: "Groq (GPT-OSS 120B) · Temp: 0.3 · Threshold: 0.6 · Chunk: 1024/250",
        explanation: "Delivers sub-second response speeds with high factual accuracy.",
      },
    ],
  },
  "provider-model": {
    title: "AI Provider & LLM Model Selection",
    category: "Advanced Inference",
    use: "Determines which inference hardware infrastructure and neural network model generates the answers for your workspace.",
    differences: [
      {
        label: "Groq: GPT-OSS 120B (Recommended)",
        description: "Flagship 120B open-weights model running on Groq LPUs. Ultra-fast (~400 tokens/sec), deep document comprehension, and low cost.",
      },
      {
        label: "Groq: Llama 4 Scout / Qwen 3",
        description: "Next-generation open architectures with high multilingual reasoning and lightweight latency.",
      },
      {
        label: "Groq: DeepSeek R1 Distill 70B",
        description: "Specialized in complex mathematical, coding, and multi-step deductive reasoning.",
      },
      {
        label: "OpenAI: GPT-4o",
        description: "OpenAI flagship omni-model. Highest general benchmark capabilities, best for ambiguous queries.",
      },
      {
        label: "OpenAI: GPT-4o Mini",
        description: "Cost-optimized OpenAI model suitable for straightforward Q&A.",
      },
    ],
    recommendations: [
      {
        useCase: "Live Customer Support & Widget Embed",
        value: "Groq · openai/gpt-oss-120b",
        explanation: "Instant token streaming with top-tier document summarization and extraction.",
      },
      {
        useCase: "Deep Analytical / Legal Auditing",
        value: "OpenAI · gpt-4o or DeepSeek R1",
        explanation: "Handles deep nuance, long contradictory clauses, and multi-page cross-referencing.",
      },
    ],
  },
  "temperature": {
    title: "Temperature (Creativity vs Determinism)",
    category: "Advanced Inference",
    use: "Controls the probability distribution when selecting output tokens. Lower values make the model deterministic; higher values make it creative.",
    differences: [
      {
        label: "0.0 – 0.2 (Deterministic & Strict)",
        description: "Virtually zero creativity. Gives repeatable, verbatim factual answers. Ideal for data extraction and formulas.",
      },
      {
        label: "0.3 – 0.5 (Focused & Professional)",
        description: "Standard for document search. Natural human phrasing without hallucinating facts outside the context.",
      },
      {
        label: "0.7 – 1.0 (Creative & Conversational)",
        description: "High linguistic variety. May introduce outside metaphors or creative variations. Not recommended for strict legal/medical facts.",
      },
    ],
    recommendations: [
      {
        useCase: "Policy Manuals, Contracts, Finance & FAQs",
        value: "0.1 to 0.3",
        explanation: "Ensures the LLM strictly quotes and summarizes facts without creative embellishments.",
      },
      {
        useCase: "Interactive Sales Coach & General Assistant",
        value: "0.6 to 0.7",
        explanation: "Produces friendly, engaging, and dynamic conversational replies.",
      },
    ],
  },
  "similarity-threshold": {
    title: "Similarity Threshold (Relevance Cutoff)",
    category: "Vector Retrieval",
    use: "The minimum cosine similarity score (0.0 to 1.0) required for a vector chunk in Pinecone to be included in the LLM context.",
    differences: [
      {
        label: "0.3 – 0.5 (Permissive)",
        description: "Retrieves a broad set of chunks even with weak relevance. Useful if user queries have typos or phrasing differs heavily from documents.",
      },
      {
        label: "0.6 – 0.7 (Balanced - Default)",
        description: "Filters out noise and irrelevant sections while reliably capturing accurate answers.",
      },
      {
        label: "0.8 – 0.95 (Strict)",
        description: "Requires near-exact semantic alignment. May return 'no relevant context found' if queries are slightly conversational.",
      },
    ],
    recommendations: [
      {
        useCase: "Standard Business Documentation",
        value: "0.60 (Default)",
        explanation: "Provides the best balance between retrieval recall and precision.",
      },
      {
        useCase: "Large High-Volume Document Archives",
        value: "0.70 – 0.75",
        explanation: "Prevents unrelated document chunks from polluting the context window.",
      },
    ],
    notes: "If relevant context is not retrieved even though the exact information exists in your documents, try lowering (relaxing) the similarity threshold (e.g. to 0.40–0.50) and test again.",
  },
  "chunk-size": {
    title: "Chunk Size (Character Partitioning)",
    category: "Ingestion Pipeline",
    use: "The maximum character length of text segments partitioned from uploaded PDF/Markdown files during embedding ingestion.",
    differences: [
      {
        label: "256 – 512 chars (Small Chunks)",
        description: "Granular sentences. Pinpoint retrieval precision, but may break across sentences or split related tables.",
      },
      {
        label: "1024 chars (Standard - Recommended)",
        description: "Captures full paragraphs with cohesive meaning. Fits standard embeddings cleanly.",
      },
      {
        label: "2048+ chars (Large Chunks)",
        description: "Captures whole document sections and large tables, but fills up the LLM token budget faster.",
      },
    ],
    recommendations: [
      {
        useCase: "Standard Multi-Page PDFs & Knowledge Bases",
        value: "1024 characters",
        explanation: "Optimal size for Cohere dense embeddings and BM25 sparse keyword extraction.",
      },
      {
        useCase: "Short FAQs / Structured Glossary",
        value: "512 characters",
        explanation: "Enables fast retrieval of concise question-and-answer pairs.",
      },
    ],
  },
  "chunk-overlap": {
    title: "Chunk Overlap (Context Continuity)",
    category: "Ingestion Pipeline",
    use: "The number of trailing characters from one chunk repeated at the beginning of the next chunk to preserve context continuity across split boundaries.",
    differences: [
      {
        label: "0 chars (No Overlap)",
        description: "Risk of splitting crucial sentences or definitions in half, causing context fragmentation.",
      },
      {
        label: "150 – 250 chars (Recommended)",
        description: "Provides ~15-25% overlap, guaranteeing that sentences spanning boundaries remain intact.",
      },
      {
        label: "400+ chars (High Overlap)",
        description: "High redundancy; increases vector database storage and ingestion time.",
      },
    ],
    recommendations: [
      {
        useCase: "For 1024 Chunk Size",
        value: "200 to 250 characters",
        explanation: "Preserves full sentence boundaries without bloating vector storage.",
      },
      {
        useCase: "For 512 Chunk Size",
        value: "100 characters",
        explanation: "Provides balanced context overlap for smaller chunks.",
      },
    ],
  },
  "top-k": {
    title: "Top K (Retrieved Context Chunks)",
    category: "Vector Retrieval",
    use: "The maximum number of top-ranking document chunks retrieved and passed into the LLM prompt for grounding.",
    differences: [
      {
        label: "3 – 5 Chunks (Fast & Focused)",
        description: "Low latency, minimal token consumption, and low cost. Sufficient for 90% of specific questions.",
      },
      {
        label: "7 – 10 Chunks (Comprehensive)",
        description: "Captures multi-document context. Best for comparison questions (e.g. 'compare policy A vs policy B').",
      },
    ],
    recommendations: [
      {
        useCase: "Standard Interactive Chatbots",
        value: "5 chunks",
        explanation: "Provides thorough grounding while keeping response times fast.",
      },
      {
        useCase: "Complex Synthesis & Multi-Document Reports",
        value: "8 to 10 chunks",
        explanation: "Supplies the LLM with comprehensive material across multiple sections.",
      },
    ],
  },

  // ============================================================
  // CHATBOT STYLING & GENERAL
  // ============================================================
  "styling-section": {
    title: "Chatbot Styling & Appearance Settings",
    category: "Chatbot Appearance",
    use: "Customizes visual branding, primary accent colors, widget alignment position, and dark/light themes.",
    differences: [
      {
        label: "Primary Accent Color",
        description: "Applies your brand color to headers, send buttons, active indicators, and user chat bubbles.",
      },
      {
        label: "Widget Position",
        description: "Places the floating trigger bubble in the bottom-right or bottom-left corner of the hosting webpage.",
      },
      {
        label: "Theme",
        description: "Switches between a sleek dark aesthetic and a clean, high-contrast light mode.",
      },
    ],
    recommendations: [
      {
        useCase: "Brand Consistency",
        value: "Match brand primary hex color + Bottom-Right alignment",
        explanation: "Matches standard web UX conventions where 95% of users expect chat widgets.",
      },
    ],
  },
};

interface SettingInfoButtonProps {
  settingId: keyof typeof SETTINGS_INFO_DATABASE | string;
  className?: string;
  size?: "sm" | "md";
}

export function SettingInfoButton({
  settingId,
  className = "",
  size = "sm",
}: SettingInfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const detail = SETTINGS_INFO_DATABASE[settingId];

  if (!detail) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`inline-flex items-center justify-center rounded-full text-[var(--fn-text-tertiary)] hover:text-[var(--fn-accent)] hover:bg-[var(--fn-accent-subtle)] transition-all cursor-pointer select-none focus:outline-none shrink-0 ${
          size === "sm" ? "w-5 h-5 text-[11px]" : "w-6 h-6 text-xs font-bold"
        } ${className}`}
        title={`Learn more about ${detail.title}`}
        aria-label={`Info about ${detail.title}`}
      >
        <span className="font-bold font-mono border border-current rounded-full w-full h-full flex items-center justify-center">
          i
        </span>
      </button>

      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          size="lg"
          title={
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[var(--fn-accent-subtle)] text-[var(--fn-accent)] border border-[var(--fn-accent)]/30 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                i
              </span>
              <span className="text-[var(--fn-text)] font-bold">{detail.title}</span>
              {detail.category && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-[var(--fn-surface)] text-[var(--fn-text-secondary)] border border-[var(--fn-border)] font-normal">
                  {detail.category}
                </span>
              )}
            </div>
          }
          footer={
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-[var(--fn-accent)] hover:opacity-90 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              Got it
            </button>
          }
        >
          <div className="space-y-6 text-sm text-[var(--fn-text)] leading-relaxed">
            {/* 1. What is the use of this setting */}
            <div className="space-y-1.5 bg-[var(--fn-surface)] p-4 rounded-xl border border-[var(--fn-border)] shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fn-accent)] flex items-center gap-1.5">
                <span>📌</span> What is this setting used for?
              </h4>
              <p className="text-sm text-[var(--fn-text)] leading-relaxed">{detail.use}</p>
            </div>

            {/* 2. Difference between different values */}
            {detail.differences && detail.differences.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fn-text)] flex items-center gap-1.5">
                  <span>📊</span> How Different Options/Values Behave
                </h4>
                <div className="grid gap-2.5">
                  {detail.differences.map((diff, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[var(--fn-surface)] border border-[var(--fn-border)] space-y-1 shadow-xs"
                    >
                      <div className="font-semibold text-xs text-[var(--fn-text)] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--fn-accent)] shrink-0" />
                        {diff.label}
                      </div>
                      <p className="text-xs text-[var(--fn-text-secondary)] pl-3.5 leading-relaxed">
                        {diff.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Recommended values for different use cases */}
            {detail.recommendations && detail.recommendations.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fn-text)] flex items-center gap-1.5">
                  <span>💡</span> Recommended Values by Use Case
                </h4>
                <div className="grid gap-3">
                  {detail.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[var(--fn-surface)] border border-[var(--fn-border)] space-y-2.5 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-bold text-xs text-[var(--fn-text)]">
                          {rec.useCase}
                        </span>
                      </div>
                      <div className="px-3 py-2 rounded-lg bg-[var(--fn-elevated)] border border-[var(--fn-border)] text-xs font-mono text-[var(--fn-accent)] font-semibold break-words select-text">
                        {rec.value}
                      </div>
                      <p className="text-xs text-[var(--fn-text-secondary)] leading-relaxed">
                        {rec.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Pro Tip / Troubleshooting Note */}
            {detail.notes && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                  <span>💡</span> Troubleshooting Tip
                </h4>
                <p className="text-xs text-[var(--fn-text)] leading-relaxed">
                  {detail.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
