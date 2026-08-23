"use client";

import React, { useRef, useEffect, useState } from "react";

export interface ChatMessage {
  id: string;
  role: "human" | "ai";
  content: string;
  timestamp: string;
}

export interface ChatInterfaceConfig {
  chatbot_name?: string;
  chatbot_description?: string;
  primary_color?: string;
  welcome_message?: string;
  suggested_questions?: string[];
  chatbot_theme?: "dark" | "light";
}

export interface ChatInterfaceProps {
  config: ChatInterfaceConfig;
  messages: ChatMessage[];
  isChatting: boolean;
  onSendMessage: (text: string) => void;
  onResetSession?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
  showLiveBadge?: boolean;
  headerExtra?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

export default function ChatInterface({
  config,
  messages,
  isChatting,
  onSendMessage,
  onResetSession,
  onClose,
  showCloseButton = false,
  showLiveBadge = false,
  headerExtra,
  placeholder = "Ask a question...",
  className = "",
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatbotName = config.chatbot_name || "AI Assistant";
  const chatbotDescription = config.chatbot_description || "Powered by FoxxNuts";
  const primaryColor = config.primary_color || "#E50914";
  const isDark = config.chatbot_theme !== "light";
  const suggestedQuestions =
    Array.isArray(config.suggested_questions) && config.suggested_questions.length > 0
      ? config.suggested_questions
      : [];

  // Auto-scroll on new messages or streaming updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatting]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputValue.trim();
    if (!query || isChatting) return;

    onSendMessage(query);
    setInputValue("");
    if (inputRef.current) {
      inputRef.current.style.height = "44px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col rounded-2xl border shadow-2xl overflow-hidden font-sans select-none transition-colors duration-200 ${
        isDark
          ? "bg-[#0E0E0E] text-white border-[#222222]"
          : "bg-[#FFFFFF] text-gray-900 border-gray-200"
      } ${className}`}
    >
      {/* ============================================================
          CHATBOT HEADER (ENLARGED TYPOGRAPHY)
          ============================================================ */}
      <header
        style={{ backgroundColor: primaryColor }}
        className="px-4 py-3.5 sm:px-6 sm:py-4 text-white flex items-center justify-between shrink-0 shadow-xs select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-extrabold text-sm sm:text-base shrink-0 border border-white/25">
            {(chatbotName || "A")[0]}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base sm:text-lg leading-tight truncate">{chatbotName}</h3>
            <p className="text-xs sm:text-sm text-white/80 leading-tight truncate mt-0.5">
              {chatbotDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {headerExtra}

          {showLiveBadge && (
            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-black/25 text-white px-3 py-1 rounded-full backdrop-blur-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Assistant
            </span>
          )}

          {onResetSession && (
            <button
              onClick={onResetSession}
              className="p-2 rounded-lg text-white/80 hover:bg-black/20 hover:text-white transition-colors cursor-pointer"
              title="Start new conversation"
              type="button"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </button>
          )}

          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/80 hover:bg-black/20 hover:text-white transition-colors cursor-pointer"
              title="Minimize"
              type="button"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* ============================================================
          MESSAGES BODY (ENLARGED READABLE CHAT FONT)
          ============================================================ */}
      <main
        className={`flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 transition-colors duration-200 ${
          isDark ? "bg-[#080808]" : "bg-gray-50"
        }`}
      >
        {messages.map((msg) => {
          const isHuman = msg.role === "human";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isHuman ? "items-end" : "items-start"}`}
            >
              <div
                style={isHuman ? { backgroundColor: primaryColor, color: "#FFFFFF" } : {}}
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4.5 py-3 sm:px-5 sm:py-3.5 text-base sm:text-lg leading-relaxed shadow-xs ${
                  isHuman
                    ? "text-white rounded-br-xs font-medium"
                    : isDark
                    ? "bg-[#141414] text-gray-100 border border-[#2A2A2A] rounded-bl-xs font-normal"
                    : "bg-white text-gray-900 border border-gray-200 rounded-bl-xs shadow-xs font-normal"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              <span
                className={`text-xs mt-1.5 px-1 ${
                  isDark ? "text-neutral-500" : "text-gray-400"
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {isChatting &&
          messages.length > 0 &&
          messages[messages.length - 1]?.content === "" && (
            <div className="flex flex-col items-start">
              <div
                className={`rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-2 shadow-xs border ${
                  isDark ? "bg-[#141414] border-[#2A2A2A]" : "bg-white border-gray-200"
                }`}
              >
                <div className="w-2.5 h-2.5 bg-neutral-400 rounded-full animate-bounce" />
                <div className="w-2.5 h-2.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-2.5 h-2.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

        <div ref={messagesEndRef} />
      </main>

      {/* ============================================================
          SUGGESTED QUESTIONS (ENLARGED PILLS)
          ============================================================ */}
      {suggestedQuestions.length > 0 && messages.length <= 1 && (
        <div
          className={`px-4 sm:px-6 py-3.5 border-t flex flex-wrap gap-2.5 shrink-0 transition-colors duration-200 ${
            isDark ? "bg-[#0E0E0E] border-[#222222]" : "bg-white border-gray-200"
          }`}
        >
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(q)}
              type="button"
              className={`text-sm px-3.5 py-1.5 rounded-full transition-all duration-150 cursor-pointer truncate max-w-full font-medium border ${
                isDark
                  ? "bg-[#1A1A1A] hover:bg-[#252525] border-[#2A2A2A] text-gray-300 hover:text-white"
                  : "bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-800 hover:text-gray-900"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ============================================================
          INPUT FORM (ENLARGED TEXTAREA & SEND BUTTON)
          ============================================================ */}
      <form
        onSubmit={handleSubmit}
        className={`p-3.5 sm:p-4.5 border-t flex items-end gap-3 shrink-0 transition-colors duration-200 ${
          isDark ? "bg-[#0E0E0E] border-[#222222]" : "bg-white border-gray-200"
        }`}
      >
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder}
          style={{
            borderColor: isInputFocused ? primaryColor : isDark ? "#262626" : "#E5E7EB",
            boxShadow: isInputFocused ? `0 0 0 1px ${primaryColor}40` : "none",
            outline: "none",
          }}
          className={`flex-1 text-base px-4 py-3 rounded-xl border transition-all resize-none min-h-[44px] max-h-[140px] overflow-y-auto leading-relaxed ${
            isDark
              ? "bg-[#141414] text-white placeholder-neutral-500"
              : "bg-gray-50 text-gray-900 placeholder-gray-400"
          }`}
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || isChatting}
          style={{ backgroundColor: primaryColor }}
          className="h-[44px] px-4 text-white rounded-xl disabled:opacity-40 transition-transform active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
          title="Send (Enter)"
        >
          <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
