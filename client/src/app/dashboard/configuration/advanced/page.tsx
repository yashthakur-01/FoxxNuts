"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "../../../../supabase/browserClient";
import { useWorkspace } from "../../../../lib/WorkspaceContext";
import { useToast } from "../../../../lib/ToastContext";
import Input from "../../../../components/ui/Input";
import Skeleton from "../../../../components/ui/Skeleton";
import WorkspaceDropdown from "../../../../components/WorkspaceDropdown";
import { SettingInfoButton } from "../../../../components/ui/SettingInfoModal";

const PROVIDERS = [
  { value: "groq", label: "Groq (Ultra-Fast Inference)" },
  { value: "openai", label: "OpenAI (GPT-4o / GPT-4o-mini)" },
];

const MODELS: Record<string, { value: string; label: string }[]> = {
  groq: [
    { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B (Recommended)" },
    { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B (Fast)" },
    { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B" },
    { value: "qwen/qwen3-32b", label: "Qwen 3 32B" },
    { value: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill 70B" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o (Omni Flagship)" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Cost-Efficient)" },
  ],
};

export default function AdvancedConfigPage() {
  const supabase = createClient();
  const { activeWorkspaceId, activeWorkspace, refreshWorkspaces, loading: wsLoading } = useWorkspace();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form State
  const [provider, setProvider] = useState("groq");
  const [modelName, setModelName] = useState("openai/gpt-oss-120b");
  const [temperature, setTemperature] = useState(0.7);
  const [similarityThreshold, setSimilarityThreshold] = useState(0.6);
  const [chunkSize, setChunkSize] = useState<number | "">(1024);
  const [chunkOverlap, setChunkOverlap] = useState<number | "">(250);
  const [topK, setTopK] = useState<number | "">(5);

  // Custom Dropdown States
  const [providerOpen, setProviderOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const providerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (providerRef.current && !providerRef.current.contains(e.target as Node)) {
        setProviderOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Populate from activeWorkspace
  useEffect(() => {
    if (activeWorkspace) {
      setProvider(activeWorkspace.provider || "groq");
      setModelName(activeWorkspace.model_name || "openai/gpt-oss-120b");
      setTemperature(activeWorkspace.temperature ?? 0.7);
      setSimilarityThreshold(activeWorkspace.similarity_threshold ?? 0.6);
      setChunkSize(activeWorkspace.chunk_size ?? 1024);
      setChunkOverlap(activeWorkspace.chunk_overlap ?? 250);
      setTopK(activeWorkspace.top_k ?? 5);
      setHasChanges(false);
    }
  }, [activeWorkspace]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeWorkspaceId) return;

    const finalChunkSize = typeof chunkSize === "number" && !isNaN(chunkSize) && chunkSize > 0 ? chunkSize : 1024;
    const finalChunkOverlap = typeof chunkOverlap === "number" && !isNaN(chunkOverlap) && chunkOverlap >= 0 ? chunkOverlap : 250;
    const finalTopK = typeof topK === "number" && !isNaN(topK) && topK > 0 ? topK : 5;

    setChunkSize(finalChunkSize);
    setChunkOverlap(finalChunkOverlap);
    setTopK(finalTopK);

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/customer/updateConfig", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: session.access_token,
        },
        body: JSON.stringify({
          workspace_id: activeWorkspaceId,
          provider: provider,
          model_name: modelName,
          temperature: temperature,
          similarity_threshold: similarityThreshold,
          chunk_size: finalChunkSize,
          chunk_overlap: finalChunkOverlap,
          top_k: finalTopK,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save advanced settings");
      }

      toast.success("Advanced AI & Retrieval settings saved!");
      setHasChanges(false);
      await refreshWorkspaces();
    } catch (err: any) {
      console.error("Save advanced config error:", err);
      toast.error(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const markDirty = () => {
    if (!hasChanges) setHasChanges(true);
  };

  if (wsLoading) {
    return (
      <div className="w-full h-full flex flex-col p-6 space-y-4">
        <Skeleton height={48} width="30%" />
        <Skeleton height={600} />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-fn-fade-in font-sans">
      {/* ============================================================
          VIBRANT FULL-BLEED END-TO-END RED RIBBON HEADER
          ============================================================ */}
      <div className="w-full bg-gradient-to-r from-[#FF001E] via-[#FF1A35] to-[#E50914] text-white px-6 sm:px-8 py-4 sm:py-5 shadow-lg border-b border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Advanced AI & Retrieval Parameters
            </h1>
            <SettingInfoButton settingId="advanced-section" size="md" className="text-white/80 hover:text-white hover:bg-white/20" />
          </div>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Fine-tune LLM inference engine, temperature creativity, vector similarity threshold, and chunk partitioning.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <WorkspaceDropdown />
          {hasChanges && (
            <span className="px-3 py-1 rounded-lg bg-black/40 text-amber-300 border border-amber-400/30 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Unsaved Changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white hover:bg-neutral-900 border border-white/20 text-xs font-semibold transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto p-5 sm:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Card 1: LLM Engine */}
          <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-2xl p-6 shadow-sm space-y-5">
            <div className="border-b border-[var(--fn-border)] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--fn-text)] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  LLM Inference Engine
                </h3>
                <p className="text-xs text-[var(--fn-text-secondary)] mt-0.5">
                  Select your LLM inference provider and underlying model architecture
                </p>
              </div>
              <SettingInfoButton settingId="provider-model" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Provider Dropdown */}
              <div className="space-y-1.5" ref={providerRef}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[var(--fn-text-secondary)]">
                    LLM Provider
                  </label>
                  <SettingInfoButton settingId="provider-model" />
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setProviderOpen(!providerOpen);
                      setModelOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 bg-[var(--fn-elevated)] hover:bg-[var(--fn-surface)] border border-[var(--fn-border)] hover:border-[var(--fn-accent)] text-[var(--fn-text)] text-xs rounded-[var(--fn-radius)] px-3.5 py-2.5 transition-all duration-150 cursor-pointer font-medium shadow-xs"
                  >
                    <span className="truncate font-semibold">
                      {PROVIDERS.find((p) => p.value === provider)?.label || provider}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-[var(--fn-text-tertiary)] shrink-0 transition-transform duration-200 ${providerOpen ? "rotate-180 text-[var(--fn-accent)]" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {providerOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)] shadow-2xl p-1.5 space-y-0.5 animate-fn-slide-down backdrop-blur-md">
                      {PROVIDERS.map((p) => {
                        const isSelected = p.value === provider;
                        return (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => {
                              setProvider(p.value);
                              setModelName(MODELS[p.value]?.[0]?.value || "");
                              setProviderOpen(false);
                              markDirty();
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-[var(--fn-radius-sm)] text-xs transition-colors text-left cursor-pointer ${
                              isSelected
                                ? "bg-[var(--fn-accent-subtle)] text-[var(--fn-accent)] font-semibold"
                                : "text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] font-medium"
                            }`}
                          >
                            <span>{p.label}</span>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-[var(--fn-accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Model Dropdown */}
              <div className="space-y-1.5" ref={modelRef}>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[var(--fn-text-secondary)]">
                    Model Selection
                  </label>
                  <SettingInfoButton settingId="provider-model" />
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setModelOpen(!modelOpen);
                      setProviderOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 bg-[var(--fn-elevated)] hover:bg-[var(--fn-surface)] border border-[var(--fn-border)] hover:border-[var(--fn-accent)] text-[var(--fn-text)] text-xs rounded-[var(--fn-radius)] px-3.5 py-2.5 transition-all duration-150 cursor-pointer font-medium shadow-xs"
                  >
                    <span className="truncate font-semibold">
                      {(MODELS[provider] || []).find((m) => m.value === modelName)?.label || modelName}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 text-[var(--fn-text-tertiary)] shrink-0 transition-transform duration-200 ${modelOpen ? "rotate-180 text-[var(--fn-accent)]" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {modelOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-[var(--fn-radius-lg)] shadow-2xl p-1.5 space-y-0.5 animate-fn-slide-down backdrop-blur-md">
                      {(MODELS[provider] || []).map((m) => {
                        const isSelected = m.value === modelName;
                        return (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => {
                              setModelName(m.value);
                              setModelOpen(false);
                              markDirty();
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-[var(--fn-radius-sm)] text-xs transition-colors text-left cursor-pointer ${
                              isSelected
                                ? "bg-[var(--fn-accent-subtle)] text-[var(--fn-accent)] font-semibold"
                                : "text-[var(--fn-text)] hover:bg-[var(--fn-elevated)] font-medium"
                            }`}
                          >
                            <span>{m.label}</span>
                            {isSelected && (
                              <svg className="w-3.5 h-3.5 text-[var(--fn-accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[var(--fn-text-secondary)]">Temperature (Creativity):</span>
                  <SettingInfoButton settingId="temperature" />
                </div>
                <span className="font-mono text-[var(--fn-accent)] font-bold">{temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => {
                  setTemperature(parseFloat(e.target.value));
                  markDirty();
                }}
                className="w-full accent-[var(--fn-accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--fn-text-tertiary)]">
                <span>Strict / Grounded (0.0)</span>
                <span>Balanced (0.7)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Retrieval & Similarity */}
          <div className="bg-[var(--fn-surface)] border border-[var(--fn-border)] rounded-2xl p-6 shadow-sm space-y-5">
            <div className="border-b border-[var(--fn-border)] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--fn-text)] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  Vector Search & Relevance Thresholds
                </h3>
                <p className="text-xs text-[var(--fn-text-secondary)] mt-0.5">
                  Controls cosine relevance scoring in Pinecone hybrid retrieval
                </p>
              </div>
              <SettingInfoButton settingId="similarity-threshold" />
            </div>

            {/* Similarity Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[var(--fn-text-secondary)]">Cosine Similarity Threshold:</span>
                  <SettingInfoButton settingId="similarity-threshold" />
                </div>
                <span className="font-mono text-[var(--fn-accent)] font-bold">{similarityThreshold}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={similarityThreshold}
                onChange={(e) => {
                  setSimilarityThreshold(parseFloat(e.target.value));
                  markDirty();
                }}
                className="w-full accent-[var(--fn-accent)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--fn-text-tertiary)]">
                <span>Broad Retrieval (0.3)</span>
                <span>Strict Grounding (0.8)</span>
              </div>
              <p className="text-[11px] text-[var(--fn-text-secondary)] bg-[var(--fn-elevated)] border border-[var(--fn-border)] rounded-lg p-2.5 flex items-start gap-2 mt-1.5 leading-relaxed">
                <span className="text-amber-400 shrink-0 font-bold">💡</span>
                <span>
                  <strong>Tip:</strong> If relevant context is not retrieved even though the exact information is present in your documents, try lowering (relaxing) the similarity threshold and testing again.
                </span>
              </p>
            </div>

            {/* Chunking Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--fn-text-secondary)]">Chunk Size</span>
                  <SettingInfoButton settingId="chunk-size" />
                </div>
                <Input
                  type="number"
                  value={chunkSize}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChunkSize(val === "" ? "" : Number(val));
                    markDirty();
                  }}
                  onBlur={() => {
                    if (chunkSize === "" || isNaN(Number(chunkSize)) || Number(chunkSize) <= 0) {
                      setChunkSize(1024);
                    }
                  }}
                  hint="Characters per chunk"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--fn-text-secondary)]">Chunk Overlap</span>
                  <SettingInfoButton settingId="chunk-overlap" />
                </div>
                <Input
                  type="number"
                  value={chunkOverlap}
                  onChange={(e) => {
                    const val = e.target.value;
                    setChunkOverlap(val === "" ? "" : Number(val));
                    markDirty();
                  }}
                  onBlur={() => {
                    if (chunkOverlap === "" || isNaN(Number(chunkOverlap)) || Number(chunkOverlap) < 0) {
                      setChunkOverlap(250);
                    }
                  }}
                  hint="Overlapping characters"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--fn-text-secondary)]">Top K Context</span>
                  <SettingInfoButton settingId="top-k" />
                </div>
                <Input
                  type="number"
                  value={topK}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTopK(val === "" ? "" : Number(val));
                    markDirty();
                  }}
                  onBlur={() => {
                    if (topK === "" || isNaN(Number(topK)) || Number(topK) <= 0) {
                      setTopK(5);
                    }
                  }}
                  hint="Chunks fed to prompt"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
