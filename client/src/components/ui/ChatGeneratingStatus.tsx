"use client";

import React, { useState, useEffect } from "react";

const GENERATING_PHRASES = [
  "Generating...",
  "Searching knowledge base...",
  "Synthesizing context...",
  "Connecting insights...",
  "Thinking through details...",
  "Taking a little longer than usual...",
  "Consolidating best answer...",
  "Polishing response...",
  "Almost ready...",
  "Wrapping up response...",
];

export interface ChatGeneratingStatusProps {
  isDark?: boolean;
  className?: string;
}

/**
 * ChatGeneratingStatus
 *
 * Displays an interactive loading indicator for response generation:
 * 1. Begins with a clean 3-dot bouncing animation.
 * 2. If response takes > 2 seconds, dynamically types out status messages.
 * 3. Shows each message on screen longer (~3.4s) for comfortable reading.
 * 4. Collapses (backspaces) with an intentional gap (~1.0s pause) before the next message begins.
 * 5. Uses lighter, smaller typography with a blinking vertical cursor to keep the user engaged.
 * 6. Loops back through consolidating phrases if response generation continues.
 */
export default function ChatGeneratingStatus({
  isDark = false,
  className = "",
}: ChatGeneratingStatusProps) {
  const [hasElapsed2Sec, setHasElapsed2Sec] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Trigger dynamic text after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setHasElapsed2Sec(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Typewriter effect state machine: forward typing -> long pause -> collapsing delete -> pause gap -> next phrase
  useEffect(() => {
    if (!hasElapsed2Sec) return;

    const currentPhrase = GENERATING_PHRASES[phraseIndex];
    let timeout: NodeJS.Timeout;

    if (isPaused) {
      // Pause at full phrase: ~3400ms (ample reading time)
      // Pause when fully collapsed (gap before next message): ~1000ms
      const pauseDuration = isDeleting ? 1000 : 3400;
      timeout = setTimeout(() => {
        setIsPaused(false);
        if (isDeleting) {
          // Finished gap pause, transition to next phrase
          setIsDeleting(false);
          setPhraseIndex((prev) => {
            const next = prev + 1;
            // When reaching the end of list, loop back through consolidating phrases (index 4 to end)
            return next < GENERATING_PHRASES.length ? next : 4;
          });
          setCharIndex(0);
        } else {
          // Finished reading time, begin collapsing/deleting
          setIsDeleting(true);
        }
      }, pauseDuration);
    } else {
      if (!isDeleting) {
        // Typing forward
        if (charIndex < currentPhrase.length) {
          timeout = setTimeout(() => {
            setCharIndex((prev) => prev + 1);
          }, 38);
        } else {
          // Reached end of phrase, hold message on screen
          setIsPaused(true);
        }
      } else {
        // Collapsing backward
        if (charIndex > 0) {
          timeout = setTimeout(() => {
            setCharIndex((prev) => prev - 1);
          }, 20);
        } else {
          // Fully collapsed, enter the inter-message gap pause
          setIsPaused(true);
        }
      }
    }

    return () => clearTimeout(timeout);
  }, [hasElapsed2Sec, phraseIndex, charIndex, isDeleting, isPaused]);

  const currentPhrase = GENERATING_PHRASES[phraseIndex] || "";
  const displayedText = currentPhrase.slice(0, charIndex);

  return (
    <div
      className={`inline-flex items-center rounded-2xl rounded-bl-xs px-3.5 py-2.5 sm:px-4 sm:py-3 border shadow-xs transition-all duration-300 max-w-[90%] sm:max-w-[80%] ${
        isDark
          ? "bg-[#141414] border-[#222222] text-neutral-400"
          : "bg-white border-gray-200 text-gray-500"
      } ${className}`}
    >
      {/* 3 Dots + Dynamic Typewriter Status Line */}
      <div className="flex items-center gap-2">
        {/* 3 Animated Bouncing Dots */}
        <div className="flex items-center space-x-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce" />
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-bounce [animation-delay:300ms]" />
        </div>

        {/* Dynamic Typewriter Text (Revealed after > 2 seconds) */}
        {hasElapsed2Sec && (
          <div className="flex items-center text-[11px] sm:text-xs text-[var(--fn-text-tertiary)] dark:text-neutral-400 font-sans tracking-tight animate-fn-fade-in min-h-[18px]">
            <span className="select-none leading-none">{displayedText}</span>
            {/* Blinking Vertical Typing Cursor */}
            <span
              className="inline-block w-[1.5px] h-3 ml-0.5 bg-[var(--fn-accent)] animate-pulse"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    </div>
  );
}
