'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface, { ChatMessage, ChatInterfaceConfig } from '@/components/ChatInterface';
import { useEmbedConfig, useEmbedHistory } from '@/hooks/useChat';

interface ChatbotPublicConfig extends ChatInterfaceConfig {
  workspace_id: string;
  workspace_name?: string;
  chatbot_avatar?: string;
  widget_position?: string;
}

function EmbedChatWidget() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspace_id') || '';

  const [isOpen, setIsOpen] = useState(false);
  const [visitorId, setVisitorId] = useState<string>('');
  const [config, setConfig] = useState<ChatbotPublicConfig>({
    workspace_id: workspaceId,
    chatbot_name: 'AI Assistant',
    chatbot_description: 'Powered by FoxxNuts',
    primary_color: '#E50914',
    welcome_message: 'Hello! How can I help you today?',
    suggested_questions: [],
    widget_position: 'bottom-right',
    chatbot_theme: 'dark',
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopChatting = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Initialize Anonymous Visitor Session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.overflow = 'hidden';

      let savedId = localStorage.getItem(`fn_visitor_${workspaceId}`);
      if (!savedId) {
        savedId = `session-${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem(`fn_visitor_${workspaceId}`, savedId);
      }
      setVisitorId(savedId);
    }
  }, [workspaceId]);

  const { data: remoteConfig } = useEmbedConfig(workspaceId || null);
  const { data: remoteHistory, isLoading: isHistoryLoading } = useEmbedHistory(workspaceId || null, visitorId || null);

  // Sync widget configuration from TanStack Query cache
  useEffect(() => {
    if (remoteConfig) {
      setConfig((prev) => ({
        ...prev,
        ...remoteConfig,
      }));

      if (typeof window !== 'undefined') {
        window.parent.postMessage(
          {
            type: 'SYNC_WIDGET_CONFIG',
            position: remoteConfig.widget_position || 'bottom-right',
          },
          '*'
        );
      }
    }
  }, [remoteConfig]);

  // Sync visitor chat history from TanStack Query cache
  useEffect(() => {
    if (remoteHistory?.messages && remoteHistory.messages.length > 0) {
      setMessages(remoteHistory.messages);
    } else if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          role: 'ai',
          content: config.welcome_message || 'Hello! How can I help you today?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [remoteHistory, config.welcome_message]);

  // Send postMessage to Parent Host Window to Resize Iframe
  const toggleWidget = (nextState: boolean) => {
    setIsOpen(nextState);

    if (typeof window !== 'undefined') {
      window.parent.postMessage(
        {
          type: 'TOGGLE_WIDGET',
          isOpen: nextState,
        },
        '*'
      );
    }
  };

  // Listen for open command from parent widget loader (fallback)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (event.data?.type === 'FOXXNUTS_OPEN') {
          setIsOpen(true);
        }
        if (event.data?.type === 'FOXXNUTS_CLOSE') {
          setIsOpen(false);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleResetSession = () => {
    const newSessionId = `session-${Math.random().toString(36).substring(2, 10)}`;
    setVisitorId(newSessionId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`fn_visitor_${workspaceId}`, newSessionId);
    }
    setMessages([
      {
        id: Date.now().toString(),
        role: 'ai',
        content: config.welcome_message || 'Hello! How can I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'human',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 1. Immediately append user message to state
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setDomainError(null);

    const botMsgId = (Date.now() + 1).toString();
    const botMsg: ChatMessage = {
      id: botMsgId,
      role: 'ai',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 2. Append bot placeholder to state
    setMessages((prev) => [...prev, botMsg]);

    let botResponseText = '';
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/embed/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          session_id: visitorId,
          message: textToSend,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (response.status === 403) {
        const errData = await response.json();
        setDomainError(errData.message || 'Domain not authorized to embed this chatbot.');
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          botResponseText += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId ? { ...msg, content: botResponseText } : msg
            )
          );
        }
      } else {
        const data = await response.json();
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId
              ? { ...msg, content: data.reply || data.content || 'Response received' }
              : msg
          )
        );
      }
    } catch (err: any) {
      console.error('Embed chat error:', err);
      const isAborted = err?.name === 'AbortError';

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== botMsgId) return msg;
          if (isAborted) {
            return {
              ...msg,
              content: botResponseText.trim()
                ? `${botResponseText}\n\n*[Response stopped by user]*`
                : '*[Response stopped by user]*',
            };
          }
          return {
            ...msg,
            content: botResponseText.trim()
              ? `${botResponseText}\n\n*[Response interrupted]*`
              : 'Sorry, I am unable to connect right now. Please try again later.',
          };
        })
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Render State A: Collapsed Bubble Button (64px)
  if (!isOpen) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-transparent overflow-hidden">
        <button
          onClick={() => toggleWidget(true)}
          style={{ backgroundColor: config.primary_color }}
          className="w-14 h-14 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none border-none outline-none ring-0"
          title={`Chat with ${config.chatbot_name}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
        </button>
      </div>
    );
  }

  // Render State B: Expanded Real Chat Window (380px x 600px)
  return (
    <div className="w-full h-full h-[100dvh] flex flex-col overflow-hidden">
      {domainError && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs p-3 font-medium flex items-center gap-2 shrink-0">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008H12v-.008z" />
          </svg>
          <span>{domainError}</span>
        </div>
      )}
      <ChatInterface
        config={config}
        messages={messages}
        isChatting={isLoading}
        isLoading={isHistoryLoading && messages.length <= 1}
        onSendMessage={handleSendMessage}
        onStopChatting={handleStopChatting}
        onResetSession={handleResetSession}
        onClose={() => toggleWidget(false)}
        showCloseButton={true}
      />
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div className="w-full h-full bg-transparent" />}>
      <EmbedChatWidget />
    </Suspense>
  );
}
