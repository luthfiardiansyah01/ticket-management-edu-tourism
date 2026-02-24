
'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/components/providers/LanguageProvider';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

export function Chatbot() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  // Initialize with the translated greeting
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setTheme } = useTheme();

  // Reset/Initialize greeting when language changes or on mount
  useEffect(() => {
    setMessages([
        {
          id: 'init',
          text: t('chatbot.greeting'),
          sender: 'bot',
          timestamp: new Date()
        }
    ]);
  }, [t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot thinking and responding
    setTimeout(() => {
      const responseText = getBotResponse(userMessage.text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 800);
  };

  const getBotResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    // Vibe Control Logic
    if (lowerInput.includes('retro')) {
        setTheme('retro');
        return t('chatbot.response.retro');
    }
    if (lowerInput.includes('cosmic') || lowerInput.includes('space') || lowerInput.includes('kosmik') || lowerInput.includes('angkasa')) {
        setTheme('cosmic');
        return t('chatbot.response.cosmic');
    }
    if (lowerInput.includes('neon') || lowerInput.includes('cyber')) {
        setTheme('neon');
        return t('chatbot.response.neon');
    }
    if (lowerInput.includes('minimal') || lowerInput.includes('clean') || lowerInput.includes('light') || lowerInput.includes('sederhana')) {
        setTheme('minimalist');
        return t('chatbot.response.minimalist');
    }

    // River Knowledge Logic (Multilingual Keyword Matching)
    // Location
    if (lowerInput.includes('location') || lowerInput.includes('where') || lowerInput.includes('lokasi') || lowerInput.includes('dimana')) 
        return t('chatbot.response.location');
    
    // Length
    if (lowerInput.includes('long') || lowerInput.includes('length') || lowerInput.includes('panjang')) 
        return t('chatbot.response.length');
    
    // Ecology
    if (lowerInput.includes('ecology') || lowerInput.includes('nature') || lowerInput.includes('pollution') || lowerInput.includes('ekologi') || lowerInput.includes('alam') || lowerInput.includes('polusi')) 
        return t('chatbot.response.ecology');
    
    // Activities
    if (lowerInput.includes('do') || lowerInput.includes('activity') || lowerInput.includes('visit') || lowerInput.includes('aktivitas') || lowerInput.includes('kegiatan')) 
        return t('chatbot.response.activities');
    
    // Booking
    if (lowerInput.includes('book') || lowerInput.includes('ticket') || lowerInput.includes('price') || lowerInput.includes('pesan') || lowerInput.includes('tiket') || lowerInput.includes('harga')) 
        return t('chatbot.response.booking');
    
    // History
    if (lowerInput.includes('history') || lowerInput.includes('culture') || lowerInput.includes('sejarah') || lowerInput.includes('budaya')) 
        return t('chatbot.response.history');
    
    // Greetings
    if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('halo') || lowerInput.includes('hai')) 
        return t('chatbot.response.hello');
    
    if (lowerInput.includes('thank') || lowerInput.includes('terima kasih') || lowerInput.includes('makasih')) 
        return t('chatbot.response.thank');
    
    return t('chatbot.response.default');
  };

  return (
    <>
      {/* Toggle Button - Adjusted Position to be higher up */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-32 right-6 z-50 p-4 rounded-full bg-green-600 text-white shadow-xl hover:bg-green-700 transition-all transform hover:scale-110 hover:rotate-12"
          aria-label="Open Chatbot"
        >
          <MessageSquare className="h-7 w-7" />
        </button>
      )}

      {/* Chat Window - Adjusted Position */}
      {isOpen && (
        <div className="fixed bottom-32 right-6 z-50 w-80 sm:w-96 bg-background border border-foreground/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="bg-green-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-bold">{t('chatbot.header')}</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 h-80 overflow-y-auto p-4 space-y-4 bg-background/95 backdrop-blur-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'bg-green-600 text-white rounded-br-none'
                      : 'bg-foreground/10 text-foreground rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-foreground/10 bg-background flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('chatbot.placeholder')}
              className="flex-1 px-4 py-2 rounded-full bg-foreground/5 border border-foreground/10 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm text-foreground placeholder:text-foreground/50"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
