// C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\frontend\src\components\Chatbot.js
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export default function Chatbot() {
  const { API_BASE_URL } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { label: 'Court Rates 🎾', text: 'What are the court rates and surfaces?' },
    { label: 'Memberships 💎', text: 'Tell me about the membership tiers' },
    { label: 'Coaching Camps 🏆', text: 'What coaching sessions or camps are available?' },
    { label: 'Contact Info 📞', text: 'Where is the club located and how can I call you?' }
  ];

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle open welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'model',
          content: 'Hello! Welcome to **The Courtyard AI Concierge**. I can help you with court bookings, coaching programs, membership details, tournaments, or club timings. What would you like to know today?'
        }
      ]);
    }
  }, [isOpen]);

  const handleSend = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    // Add user message to history
    const userMessage = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Prepare history formatted for API (excluding the current user message)
      const historyPayload = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.content
      }));

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: historyPayload
        })
      });

      const data = await response.json();
      
      if (response.ok && data.reply) {
        setMessages((prev) => [...prev, { role: 'model', content: data.reply }]);
      } else {
        throw new Error(data.error || 'Failed to get a response');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: 'Sorry, I am having trouble connecting to the concierge desk. Please try again in a moment or contact hello@thecourtyard.com directly.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatText = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      // Handle bold formatting **text**
      const boldRegex = /\*\*(.*?)\*\//g;
      // Also match regular **text**
      const boldRegexAlt = /\*\*(.*?)\*\*/g;
      
      const parts = [];
      let lastIndex = 0;
      let match;

      // Use the standard bold regex
      while ((match = boldRegexAlt.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-neon-green">{match[1]}</strong>);
        lastIndex = boldRegexAlt.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <p key={idx} className="mb-1.5 last:mb-0 leading-relaxed text-[13px]">
          {parts}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full bg-gradient-to-tr from-electric-blue to-neon-green flex items-center justify-center text-sport-dark shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 neon-glow cursor-pointer group"
      >
        {isOpen ? (
          <span className="text-xl font-bold font-sans text-sport-dark">✕</span>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-6 h-6 text-sport-dark group-hover:rotate-12 transition-transform duration-300"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
            />
          </svg>
        )}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9998] w-[380px] h-[520px] flex flex-col bg-sport-dark/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden glass-panel animate-fade-in-up transition-all duration-300">
          
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-sport-charcoal to-sport-dark border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-electric-blue to-neon-green flex items-center justify-center text-sport-dark font-extrabold text-sm shadow-md">
                CY
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">Courtyard Concierge</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                  <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">AI Concierge Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer text-lg p-1"
            >
              ✕
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-electric-blue text-sport-dark font-semibold rounded-tr-none shadow-md'
                      : 'bg-white/5 border border-white/10 text-gray-100 rounded-tl-none'
                  }`}
                >
                  {formatText(msg.content)}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="self-start max-w-[85%] flex items-center gap-1.5 bg-white/5 border border-white/10 px-4 py-3.5 rounded-2xl rounded-tl-none">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-neon-green animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-neon-green animate-bounce" />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick-reply Suggestions */}
          {messages.length === 1 && (
            <div className="px-5 pb-3 pt-2 border-t border-white/5 bg-sport-dark/50">
              <span className="text-[10px] text-gray-500 font-bold tracking-wider uppercase block mb-1.5">Suggested Topics</span>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.text)}
                    className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 hover:border-neon-green/30 transition-all duration-300 cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 bg-sport-charcoal border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about the club..."
              disabled={loading}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[13px] text-gray-100 placeholder-gray-500 focus:outline-none focus:border-neon-green/40 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 bg-neon-green text-sport-dark rounded-xl font-bold disabled:opacity-50 disabled:bg-gray-700 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4 text-sport-dark"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </button>
          </form>

        </div>
      )}
    </>
  );
}
