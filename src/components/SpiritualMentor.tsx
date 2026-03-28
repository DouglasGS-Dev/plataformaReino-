import React from 'react';
import { motion } from 'motion/react';
import { MessageCircle, Sparkles, Send, Bot, User, Star } from 'lucide-react';

import { SpiritualEntry } from '../types';

interface SpiritualMentorProps {
  entries: SpiritualEntry[];
  devotionalStats: any;
  onNavigate: (view: any) => void;
  onSaveToDiary: (text: string) => Promise<void>;
}

const SpiritualMentor: React.FC<SpiritualMentorProps> = ({ entries, devotionalStats, onNavigate, onSaveToDiary }) => {
  const [messages, setMessages] = React.useState([
    { role: 'bot', text: 'Olá! Sou seu Mentor Espiritual. Como posso ajudar na sua caminhada hoje?' }
  ]);
  const [input, setInput] = React.useState('');
  const [isSaving, setIsSaving] = React.useState<number | null>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');
    
    // Simulate bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: 'Essa é uma excelente reflexão. A Bíblia nos ensina que a perseverança produz caráter. Como você sente que Deus está trabalhando nisso na sua vida?' 
      }]);
    }, 1000);
  };

  const handleSaveToDiary = async (text: string, index: number) => {
    setIsSaving(index);
    try {
      await onSaveToDiary(text);
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 border-bottom border-slate-100 bg-slate-50 flex items-center gap-3">
        <div className="p-2 bg-primary text-white rounded-lg">
          <Bot size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Mentor Espiritual</h3>
          <p className="text-xs text-slate-500">IA treinada em princípios bíblicos</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: msg.role === 'bot' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex ${msg.role === 'bot' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-2xl relative group ${
              msg.role === 'bot' 
                ? 'bg-slate-100 text-slate-800 rounded-tl-none' 
                : 'bg-primary text-white rounded-tr-none'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
              
              {msg.role === 'bot' && (
                <button
                  onClick={() => handleSaveToDiary(msg.text, i)}
                  disabled={isSaving === i}
                  className="absolute -right-10 top-0 p-2 text-slate-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                  title="Salvar no Diário"
                >
                  {isSaving === i ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Star size={16} />
                  )}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua dúvida ou reflexão..."
            className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
          />
          <button
            onClick={handleSend}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpiritualMentor;
