"use client";

import React, { useRef, useEffect, useState } from "react";
import MarkdownRenderer from "./ui/MarkdownRenderer";
import ChatGeneratingStatus from "./ui/ChatGeneratingStatus";

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
  isLoading?: boolean;
  onSendMessage: (text: string) => void;
  onStopChatting?: () => void;
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
  isLoading = false,
  onSendMessage,
  onStopChatting,
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

  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Auto-scroll on new messages, streaming updates, or loading state
  useEffect(() => {
    scrollToBottom();
  }, [messages, isChatting, isLoading]);

  // Handle mobile visualViewport resize when virtual keyboard opens or closes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateHeight = () => {
      if (window.visualViewport && window.innerWidth <= 640) {
        setViewportHeight(Math.round(window.visualViewport.height));
      } else {
        setViewportHeight(null);
      }
      scrollToBottom("auto");
    };

    updateHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateHeight);
      window.visualViewport.addEventListener("scroll", updateHeight);
      window.addEventListener("resize", updateHeight);

      return () => {
        window.visualViewport?.removeEventListener("resize", updateHeight);
        window.visualViewport?.removeEventListener("scroll", updateHeight);
        window.removeEventListener("resize", updateHeight);
      };
    } else {
      window.addEventListener("resize", updateHeight);
      return () => window.removeEventListener("resize", updateHeight);
    }
  }, []);

  const MIN_INPUT_HEIGHT = 40;
  const MAX_INPUT_HEIGHT = 120; // Max vertical height (~5 lines)

  // Dynamically control height and show scrollbar ONLY when max vertical height is reached
  useEffect(() => {
    if (!inputRef.current) return;
    const el = inputRef.current;
    if (!inputValue) {
      el.style.height = `${MIN_INPUT_HEIGHT}px`;
      el.style.overflowY = "hidden";
      return;
    }
    el.style.height = "auto";
    const scrollHeight = el.scrollHeight;
    if (scrollHeight > MAX_INPUT_HEIGHT) {
      el.style.height = `${MAX_INPUT_HEIGHT}px`;
      el.style.overflowY = "auto";
    } else {
      el.style.height = `${Math.max(MIN_INPUT_HEIGHT, scrollHeight)}px`;
      el.style.overflowY = "hidden";
    }
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputValue.trim();
    if (!query || isChatting) return;

    onSendMessage(query);
    setInputValue("");
    if (inputRef.current) {
      inputRef.current.style.height = `${MIN_INPUT_HEIGHT}px`;
      inputRef.current.style.overflowY = "hidden";
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
      style={viewportHeight ? { height: `${viewportHeight}px`, maxHeight: `${viewportHeight}px` } : undefined}
      className={`w-full h-full flex flex-col rounded-none sm:rounded-2xl border-0 sm:border shadow-none sm:shadow-xl overflow-hidden font-sans select-none transition-colors duration-200 ${
        isDark
          ? "bg-[#0E0E0E] text-white border-[#222222]"
          : "bg-[#FFFFFF] text-gray-900 border-gray-200"
      } ${className}`}
    >
      {/* ============================================================
          CHATBOT HEADER
          ============================================================ */}
      <header
        style={{ backgroundColor: primaryColor }}
        className="px-3.5 py-2.5 sm:px-6 sm:py-3.5 text-white flex items-center justify-between shrink-0 shadow-xs select-none"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-extrabold text-xs sm:text-base shrink-0 border border-white/25">
            {(chatbotName || "A")[0]}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm sm:text-base leading-tight truncate">{chatbotName}</h3>
            <p className="text-[11px] sm:text-xs text-white/80 leading-tight truncate mt-0.5">
              {chatbotDescription}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {headerExtra}

          {showLiveBadge && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-black/25 text-white px-2.5 sm:px-3 py-1 rounded-full backdrop-blur-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Live Assistant</span>
              <span className="sm:hidden text-[11px]">Live</span>
            </span>
          )}

          {onResetSession && (
            <button
              onClick={onResetSession}
              className="p-1.5 sm:p-2 rounded-lg text-white/80 hover:bg-black/20 hover:text-white transition-colors cursor-pointer"
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
              className="p-1.5 sm:p-2 rounded-lg text-white/80 hover:bg-black/20 hover:text-white transition-colors cursor-pointer"
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
          MESSAGES BODY
          ============================================================ */}
      <main
        className={`flex-1 min-h-0 overflow-y-auto chat-scrollbar p-3 sm:p-5 space-y-3 sm:space-y-4 transition-colors duration-200 ${
          isDark ? "bg-[#080808]" : "bg-gray-50"
        }`}
      >
        {/* Skeleton Loading State for initial chat / history loading */}
        {isLoading && messages.length <= 1 ? (
          <div className="space-y-4 animate-pulse">
            {/* Skeleton AI Welcome Message */}
            <div className="flex flex-col items-start w-full max-w-[85%] sm:max-w-[70%]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-5 h-5 rounded-full ${isDark ? "bg-neutral-800" : "bg-gray-200"}`} />
                <div className={`h-2.5 w-16 rounded ${isDark ? "bg-neutral-800" : "bg-gray-200"}`} />
              </div>
              <div className={`w-full rounded-xl sm:rounded-2xl rounded-bl-xs p-3.5 space-y-2 border ${isDark ? "bg-[#141414] border-[#222222]" : "bg-white border-gray-200 shadow-xs"}`}>
                <div className={`h-3 rounded ${isDark ? "bg-neutral-800" : "bg-gray-200"} w-4/5`} />
                <div className={`h-3 rounded ${isDark ? "bg-neutral-800" : "bg-gray-200"} w-3/5`} />
              </div>
            </div>

            {/* Skeleton User Message */}
            <div className="flex flex-col items-end w-full">
              <div className={`max-w-[75%] sm:max-w-[50%] rounded-xl sm:rounded-2xl rounded-br-xs p-3 space-y-2 border ${isDark ? "bg-[#1E1E1E] border-[#2A2A2A]" : "bg-gray-100 border-gray-200"}`}>
                <div className={`h-3 rounded ${isDark ? "bg-neutral-700" : "bg-gray-300"} w-36`} />
              </div>
            </div>

            {/* Skeleton AI Response */}
            <div className="flex flex-col items-start w-full max-w-[90%] sm:max-w-[75%]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-5 h-5 rounded-full ${isDark ? "bg-neutral-800" : "bg-gray-200"}`} />
                <div className={`h-2.5 w-20 rounded ${isDark ? "bg-neutral-800" : "bg-gray-200"}`} />
              </div>
              <div className={`w-full rounded-xl sm:rounded-2xl rounded-bl-xs p-3.5 space-y-2.5 border ${isDark ? "bg-[#141414] border-[#222222]" : "bg-white border-gray-200 shadow-xs"}`}>
                <div className={`h-3 rounded ${isDark ? "bg-neutral-800" : "bg-gray-200"} w-full`} />
                <div className={`h-3 rounded ${isDark ? "bg-neutral-800" : "bg-gray-200"} w-5/6`} />
                <div className={`h-3 rounded ${isDark ? "bg-neutral-800" : "bg-gray-200"} w-2/5`} />
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isHuman = msg.role === "human";

            // If AI message is still empty (waiting for first streaming chunk), don't render an empty bubble.
            // The typing / skeleton indicator below will show the loading animation instead.
            if (!isHuman && !msg.content?.trim()) {
              return null;
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isHuman ? "items-end" : "items-start"}`}
              >
                <div
                  style={isHuman ? { backgroundColor: primaryColor, color: "#FFFFFF" } : {}}
                  className={`max-w-[90%] sm:max-w-[80%] rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-5 sm:py-3 text-sm sm:text-base leading-relaxed shadow-xs ${
                    isHuman
                      ? "text-white rounded-br-xs font-medium"
                      : isDark
                      ? "bg-[#141414] text-gray-100 border border-[#2A2A2A] rounded-bl-xs font-normal"
                      : "bg-white text-gray-900 border border-gray-200 rounded-bl-xs shadow-xs font-normal"
                  }`}
                >
                  {isHuman ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <MarkdownRenderer content={msg.content} isDark={isDark} />
                  )}
                </div>
                <span
                  className={`text-[10px] sm:text-xs mt-1 px-1 ${
                    isDark ? "text-neutral-500" : "text-gray-400"
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            );
          })
        )}

        {/* AI Generating Response Interactive Status Loader */}
        {isChatting &&
          messages.length > 0 &&
          (!messages[messages.length - 1]?.content?.trim() ||
            messages[messages.length - 1]?.role === "human") && (
            <div className="flex flex-col items-start w-full">
              <ChatGeneratingStatus isDark={isDark} />
            </div>
          )}

        <div ref={messagesEndRef} />
      </main>

      {/* ============================================================
          SUGGESTED QUESTIONS
          ============================================================ */}
      {suggestedQuestions.length > 0 && messages.length <= 1 && !isLoading && (
        <div
          className={`px-3 sm:px-5 py-2 sm:py-2.5 border-t flex flex-wrap gap-1.5 sm:gap-2 shrink-0 transition-colors duration-200 ${
            isDark ? "bg-[#0E0E0E] border-[#222222]" : "bg-white border-gray-200"
          }`}
        >
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(q)}
              type="button"
              className={`text-xs sm:text-sm px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full transition-all duration-150 cursor-pointer truncate max-w-full font-medium border ${
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
          INPUT FORM
          ============================================================ */}
      <form
        onSubmit={handleSubmit}
        className={`p-2 sm:p-3 border-t flex items-end gap-2 sm:gap-3 shrink-0 transition-colors duration-200 ${
          isDark ? "bg-[#0E0E0E] border-[#222222]" : "bg-white border-gray-200"
        }`}
      >
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsInputFocused(true);
            setTimeout(() => {
              scrollToBottom("smooth");
            }, 180);
          }}
          onBlur={() => setIsInputFocused(false)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder}
          style={{
            height: `${MIN_INPUT_HEIGHT}px`,
            overflowY: "hidden",
            borderColor: isInputFocused ? primaryColor : isDark ? "#262626" : "#E5E7EB",
            boxShadow: isInputFocused ? `0 0 0 1px ${primaryColor}40` : "none",
            outline: "none",
          }}
          className={`flex-1 text-[16px] sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border transition-all resize-none min-h-[40px] sm:min-h-[44px] max-h-[100px] sm:max-h-[120px] chat-input-scrollbar leading-relaxed ${
            isDark
              ? "bg-[#141414] text-white placeholder-neutral-500"
              : "bg-gray-50 text-gray-900 placeholder-gray-400"
          }`}
        />

        {isChatting && onStopChatting ? (
          <button
            type="button"
            onClick={onStopChatting}
            className="h-[40px] sm:h-[44px] px-3.5 sm:px-4 text-white bg-neutral-700 hover:bg-neutral-600 rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-xs group"
            title="Stop Generating"
          >
            <div className="w-3.5 h-3.5 bg-white rounded-xs group-hover:scale-90 transition-transform" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!inputValue.trim() || isChatting}
            style={{ backgroundColor: primaryColor }}
            className="h-[40px] sm:h-[44px] px-3.5 sm:px-4 text-white rounded-xl disabled:opacity-40 transition-transform active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
            title="Send (Enter)"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}
