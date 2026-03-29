import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Bot, User as UserIcon, Star, Sparkles, 
  MessageCircle, Trash2, Info, CheckCircle2
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { collection, query, orderBy, limit, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { SpiritualEntry, UserProfile } from '../../types';
import { User } from 'firebase/auth';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'bot';
  text: string;
  timestamp: number;
}

export default function MentorPage() {
  const { user, userProfile, handleLogin } = useOutletContext<{ 
    user: User | null; 
    userProfile: UserProfile | null;
    handleLogin: () => void;
  }>();

  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Olá! Sou seu Mentor Espiritual. Como posso ajudar na sua caminhada hoje?', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSaving, setIsSaving] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    if (!user) {
      handleLogin();
      return;
    }

    const userMessage: Message = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Fetch recent entries for context
      const entriesRef = collection(db, `users/${user.uid}/entries`);
      const q = query(entriesRef, orderBy('id', 'desc'), limit(5));
      let recentEntries: SpiritualEntry[] = [];
      try {
        const entriesSnap = await getDocs(q);
        recentEntries = entriesSnap.docs.map(d => d.data() as SpiritualEntry);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/entries`);
      }

      const context = recentEntries.length > 0 
        ? `Recentemente, o usuário registrou: ${recentEntries.map(e => `[${e.category}] ${e.title}: ${e.description}`).join('; ')}`
        : 'O usuário ainda não possui registros no diário.';

      const prompt = `
        Você é um Mentor Espiritual cristão sábio, encorajador e profundamente bíblico.
        Seu objetivo é ajudar o usuário em sua caminhada de fé, oferecendo conselhos baseados na Bíblia, 
        conforto em momentos de luta e celebração em momentos de vitória.
        
        Contexto do usuário: ${context}
        Nome do usuário: ${user.displayName || 'Irmão(ã)'}
        
        Mensagem do usuário: ${input}
        
        Responda de forma empática, use versículos bíblicos quando apropriado e mantenha um tom de discipulado.
        Seja breve (máximo 3 parágrafos).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const botMessage: Message = { 
        role: 'bot', 
        text: response.text || 'Desculpe, tive um problema para processar sua mensagem. Posso orar por você?', 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Mentor AI error:", error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: 'Sinto muito, tive uma pequena falha na conexão espiritual. Pode repetir?', 
        timestamp: Date.now() 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveToDiary = async (text: string, index: number) => {
    if (!user) {
      handleLogin();
      return;
    }

    setIsSaving(index);
    const entryId = Date.now().toString();
    const newEntry: SpiritualEntry = {
      id: entryId,
      userId: user.uid,
      title: 'Conselho do Mentor',
      category: 'O que Deus falou comigo',
      description: text,
      date: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      impact: 'Médio',
      isMemorial: false,
      shareWithCommunity: false,
      media: null,
      aspectRatio: null,
      bibleVerse: null
    };

    try {
      await setDoc(doc(db, `users/${user.uid}/entries/${entryId}`), newEntry);
      showToast('Conselho salvo no seu diário!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/entries/${entryId}`);
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-50"
          >
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border ${
              toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-red-500 border-red-400 text-white'
            }`}>
              <CheckCircle2 size={18} />
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Mentor Espiritual</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Sparkles size={12} className="text-primary" /> IA baseada em princípios bíblicos
            </p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([{ role: 'bot', text: 'Olá! Sou seu Mentor Espiritual. Como posso ajudar na sua caminhada hoje?', timestamp: Date.now() }])}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          title="Limpar conversa"
        >
          <Trash2 size={20} />
        </button>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.role === 'bot' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'bot' ? 'flex-row' : 'flex-row-reverse'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                msg.role === 'bot' ? 'bg-primary-100 text-primary' : 'bg-slate-100 text-slate-600'
              }`}>
                {msg.role === 'bot' ? <Bot size={16} /> : <UserIcon size={16} />}
              </div>
              
              <div className="space-y-2">
                <div className={`p-4 rounded-2xl relative group ${
                  msg.role === 'bot' 
                    ? 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100' 
                    : 'bg-primary text-white rounded-tr-none shadow-md shadow-primary/20'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  
                  {msg.role === 'bot' && (
                    <button
                      onClick={() => handleSaveToDiary(msg.text, i)}
                      disabled={isSaving === i}
                      className="absolute -right-10 top-0 p-2 text-slate-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
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
                <p className={`text-[10px] text-slate-400 ${msg.role === 'bot' ? 'text-left' : 'text-right'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="O que está em seu coração hoje?"
            className="flex-1 pl-4 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-4 bg-primary text-white rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2 px-2">
          <Info size={12} className="text-slate-400" />
          <p className="text-[10px] text-slate-400">
            O Mentor Espiritual usa inteligência artificial para oferecer aconselhamento baseado em princípios bíblicos.
          </p>
        </div>
      </div>
    </div>
  );
}
