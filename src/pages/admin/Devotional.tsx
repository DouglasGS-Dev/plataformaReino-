import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, CheckCircle2, Star, Clock, Flame, 
  Calendar, ChevronRight, BookOpen, Quote
} from 'lucide-react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { UserProfile, SpiritualEntry } from '../../types';
import { User } from 'firebase/auth';

const MOCK_STATS = {
  completed: 0,
  streak: 0,
  lastDate: '',
  favorites: [] as string[]
};

export default function DevotionalPage() {
  const { user, userProfile, handleLogin } = useOutletContext<{ 
    user: User | null; 
    userProfile: UserProfile | null;
    handleLogin: () => void;
  }>();

  const [stats, setStats] = useState(MOCK_STATS);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const statsRef = doc(db, `users/${user.uid}/stats/devotional`);
    const unsubscribe = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data() as typeof MOCK_STATS);
      } else {
        setStats(MOCK_STATS);
      }
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/stats/devotional`);
    });

    return () => unsubscribe();
  }, [user]);

  const handleComplete = async () => {
    if (!user) {
      handleLogin();
      return;
    }
    
    const today = new Date().toDateString();
    if (stats.lastDate === today) {
      showToast('Você já concluiu o devocional de hoje!', 'success');
      return;
    }

    const isConsecutive = stats.lastDate === new Date(Date.now() - 86400000).toDateString();
    
    const newStats = {
      ...stats,
      userId: user.uid,
      completed: stats.completed + 1,
      streak: isConsecutive ? stats.streak + 1 : 1,
      lastDate: today,
      updatedAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, `users/${user.uid}/stats/devotional`), newStats);
      showToast('Devocional concluído! +1 dia de constância.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/stats/devotional`);
    }
  };

  const handleSaveToDiary = async (text: string) => {
    if (!user) {
      handleLogin();
      return;
    }

    const entryId = Date.now();
    const newEntry: SpiritualEntry = {
      id: entryId,
      userId: user.uid,
      title: 'Reflexão Devocional',
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
      bibleVerse: 'Salmos 119:105'
    };

    try {
      await setDoc(doc(db, `users/${user.uid}/entries/${entryId}`), newEntry);
      showToast('Reflexão salva no seu diário!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}/entries/${entryId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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

      <header>
        <h2 className="text-2xl font-bold text-slate-900">Devocional Diário</h2>
        <p className="text-slate-500 text-sm">Alimente seu espírito com a Palavra de Deus.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Constância</p>
            <p className="text-2xl font-bold text-slate-900">{stats.streak} dias</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 text-primary rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Concluídos</p>
            <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hoje</p>
            <p className="text-2xl font-bold text-slate-900">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 md:p-12 space-y-8">
          <div className="relative">
            <Quote className="absolute -top-6 -left-6 text-primary-100 w-16 h-16 -z-10" />
            <blockquote className="text-2xl md:text-3xl font-serif italic text-slate-800 leading-relaxed">
              "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho."
            </blockquote>
            <cite className="block mt-4 text-primary font-bold not-italic tracking-wide">
              — Salmos 119:105
            </cite>
          </div>

          <div className="prose prose-slate max-w-none">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Reflexão do Dia</h3>
            <p className="text-slate-600 text-lg leading-relaxed">
              A Palavra de Deus não é apenas um livro de regras, mas um guia vivo que ilumina cada passo da nossa jornada. 
              Em momentos de escuridão ou incerteza, ela nos oferece a clareza necessária para não tropeçarmos. 
              Hoje, peça ao Espírito Santo que abra seus olhos para as verdades eternas que Ele deseja revelar a você.
            </p>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button 
              onClick={() => handleSaveToDiary("Reflexão do devocional de hoje: Salmos 119:105. A Palavra é luz para o meu caminho.")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all border border-slate-200"
            >
              <Star size={20} /> Salvar no Diário
            </button>
            <button 
              onClick={handleComplete}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold transition-all shadow-lg ${
                stats.lastDate === new Date().toDateString()
                  ? 'bg-emerald-500 text-white shadow-emerald-200'
                  : 'bg-primary text-white hover:opacity-90 shadow-primary/20'
              }`}
            >
              <CheckCircle2 size={20} /> 
              {stats.lastDate === new Date().toDateString() ? 'Concluído Hoje' : 'Concluir Devocional'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-primary-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h3 className="text-xl font-bold">Próximo Passo</h3>
          <p className="text-primary-100 max-w-md">
            Que tal conversar com seu Mentor Espiritual sobre o que você aprendeu hoje?
          </p>
          <button className="flex items-center gap-2 text-white font-bold group">
            Ir para o Mentor <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <BookOpen className="absolute -bottom-8 -right-8 w-48 h-48 text-white/10 -rotate-12" />
      </div>
    </div>
  );
}
