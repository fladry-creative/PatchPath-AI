'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { User, Sparkles } from 'lucide-react';
import { type Patch } from '@/types/patch';
import { PatchCard } from '@/components/patches/PatchCard';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  patch?: Patch;
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-gradient-to-br from-purple-500 to-pink-500'
            : 'bg-gradient-to-br from-orange-500 to-yellow-500'
        }`}
      >
        {isUser ? (
          <User className="h-5 w-5 text-white" />
        ) : (
          <Sparkles className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'border border-purple-500/30 bg-purple-500/20 text-white'
              : 'border border-white/10 bg-white/5 text-slate-200'
          } max-w-[85%]`}
        >
          {/* Text Content */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
            {message.isStreaming ? (
              <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-purple-400"></span>
            ) : null}
          </div>

          {/* Patch Card (if patch is included) */}
          {message.patch ? (
            <div className="mt-4">
              <PatchCard patch={message.patch} />
            </div>
          ) : null}
        </div>

        {/* Timestamp */}
        <div className="mt-1 px-1 text-xs text-slate-500">
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </motion.div>
  );
}
