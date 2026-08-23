'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatInterface, { ChatMessage, ChatInterfaceConfig } from '@/components/ChatInterface';

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

  // Initialize Anonymous Visitor Session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.style.background = 'transparent';
      document.body.style.background = 'transparent';

      let savedId = localStorage.getItem(`fn_visitor_${workspaceId}`);
      if (!savedId) {
        savedId = `session-${Math.random().toString(36).substring(2, 10)}`;
        localStorage.setItem(`fn_visitor_${workspaceId}`, savedId);
      }
      setVisitorId(savedId);
    }
  }, [workspaceId]);

  // Fetch Public Workspace Configuration & Previous Chat History
  useEffect(() => {
    if (!workspaceId) return;

    const fetchConfigAndHistory = async () => {
      try {
        let welcomeMsg = 'Hello! How can I help you today?';

        // 1. Fetch public configuration
        const res = await fetch('/api/embed/getConfig', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspace_id: workspaceId }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setConfig(data.config);
            welcomeMsg = data.config.welcome_message || welcomeMsg;

            // Sync configured alignment position with the parent loader iframe container
            if (typeof window !== 'undefined') {
              window.parent.postMessage(
                {
                  type: 'SYNC_WIDGET_CONFIG',
                  position: data.config.widget_position || 'bottom-right',
                },
                '*'
              );
            }
          }
        }

        // 2. Fetch previous chat history for the visitor session
        if (visitorId) {
          const histRes = await fetch('/api/embed/getHistory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              workspace_id: workspaceId,
              session_id: visitorId,
            }),
          });

          if (histRes.ok) {
            const histData = await histRes.json();
            if (Array.isArray(histData.messages) && histData.messages.length > 0) {
              setMessages(histData.messages);
              return;
            }
          }
        }

        // 3. Fallback to default welcome message if no history exists yet
        setMessages([
          {
            id: 'welcome-1',
            role: 'ai',
            content: welcomeMsg,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } catch (err) {
        console.error('Failed to fetch widget config or history:', err);
      }
    };

    fetchConfigAndHistory();
  }, [workspaceId, visitorId]);

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

    try {
      const response = await fetch('/api/embed/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          session_id: visitorId,
          message: textToSend,
        }),
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
      let botResponseText = '';

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
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMsgId
            ? {
                ...msg,
                content: 'Sorry, I am unable to connect right now. Please try again later.',
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
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
    <div className="w-full h-full flex flex-col overflow-hidden">
      {domainError && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs p-3 font-medium">
          ⚠️ {domainError}
        </div>
      )}
      <ChatInterface
        config={config}
        messages={messages}
        isChatting={isLoading}
        onSendMessage={handleSendMessage}
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
