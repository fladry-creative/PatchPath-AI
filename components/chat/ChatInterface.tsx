'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { ChatMessage, type ChatMessageData } from './ChatMessage';
import { type Patch } from '@/types/patch';

interface ChatInterfaceProps {
  rackUrl?: string;
  onPatchGenerated?: (patch: Patch) => void;
}

export function ChatInterface({ rackUrl, onPatchGenerated }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hey! 👋 I'm your patch design assistant. Tell me what kind of sound or visual you want to create, and I'll help you build it.\n\n${
        rackUrl
          ? 'I can see your rack - just describe what you want to make!'
          : "First, let me know what ModularGrid rack you're working with, then tell me what you want to create."
      }`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    // Add user message
    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      // Create assistant message placeholder for streaming
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: ChatMessageData = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Call streaming API
      const response = await fetch('/api/chat/patches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage).map((m) => ({ role: m.role, content: m.content })),
          rackUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response reader available');
      }

      let accumulatedContent = '';
      let generatedPatch: Patch | undefined;

      // Read stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.type === 'content') {
                accumulatedContent += parsed.content;

                // Update message with accumulated content
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: accumulatedContent, isStreaming: true }
                      : m
                  )
                );
              } else if (parsed.type === 'patch') {
                generatedPatch = parsed.patch;
              } else if (parsed.type === 'error') {
                setError(parsed.error);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      // Finalize message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? {
                ...m,
                content: accumulatedContent || 'Generated your patch!',
                isStreaming: false,
                patch: generatedPatch,
              }
            : m
        )
      );

      // Notify parent if patch was generated
      if (generatedPatch && onPatchGenerated) {
        onPatchGenerated(generatedPatch);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex h-[600px] flex-col rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-yellow-500">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Patch Design Assistant</h3>
          <p className="text-xs text-slate-400">
            {rackUrl ? 'Ready to create patches' : 'Tell me about your rack first'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {isLoading && messages[messages.length - 1]?.role === 'user' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-yellow-500">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-sm text-slate-300">Thinking...</p>
            </div>
          </motion.div>
        ) : null}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-6 mb-4 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
          <p className="text-sm text-red-300">{error}</p>
        </motion.div>
      ) : null}

      {/* Input Area */}
      <div className="border-t border-white/10 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              rackUrl
                ? 'Describe the patch you want to create...'
                : 'Tell me your ModularGrid URL and what you want to create...'
            }
            rows={2}
            className="flex-1 resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-[76px] w-16 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Send className="h-6 w-6" />
            )}
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Press <kbd className="rounded bg-white/10 px-1.5 py-0.5">Enter</kbd> to send,{' '}
          <kbd className="rounded bg-white/10 px-1.5 py-0.5">Shift</kbd> +{' '}
          <kbd className="rounded bg-white/10 px-1.5 py-0.5">Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
