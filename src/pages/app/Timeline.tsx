import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, Filter, Sparkles, Search, Calendar, 
  ChevronRight, Star, Heart, MessageCircle, 
  Shield, Mountain, Target, HandHeart, CheckCircle2, 
  Lightbulb, Info, Book
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { SpiritualEntry, Category, UserProfile } from '../../types';
import { User } from 'firebase/auth';
import { MediaCarousel } from '../../components/MediaCarousel';

const categoryOptions = [
  { id: 'Milagres', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'Livramentos', icon: Shield, color: 'text-primary', bg: 'bg-primary/10' },
  { id: 'Desafios', icon: Mountain, color: 'text-slate-500', bg: 'bg-slate-50' },
  { id: 'Propósitos', icon: Target, color: 'text-primary', bg: 'bg-primary-50' },
  { id: 'Pedidos de oração', icon: HandHeart, color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: 'Orações respondidas', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'Lições espirituais', icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'Gratidão', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
  { id: 'O que Deus falou comigo', icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-50' }
];

export default function TimelinePage() {
  const { user } = useOutletContext<{ user: User | null }>();
  const [entries, setEntries] = useState<SpiritualEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Todas' | 'Memoriais'>('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const entriesRef = collection(db, `users/${user.uid}/entries`);
    const q = query(entriesRef, orderBy('id', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEntries: SpiritualEntry[] = [];
      snapshot.forEach((doc) => {
        fetchedEntries.push(doc.data() as SpiritualEntry);
      });
      setEntries(fetchedEntries);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/entries`);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           entry.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'Todas' || entry.isMemorial;
      return matchesSearch && matchesFilter;
    });
  }, [entries, searchQuery, filter]);

  const renderDescription = (desc: string) => {
    if (!desc) return null;
    return desc.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={i} className="block mt-4 mb-2 text-primary-700 text-xs uppercase tracking-wider font-bold">{line.slice(2, -2)}</strong>;
      }
      return <span key={i} className="block text-slate-600 mb-1 leading-relaxed">{line}</span>;
    });
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-primary-50 text-primary rounded-full flex items-center justify-center mb-6">
          <Clock size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sua Linha do Tempo</h2>
        <p className="text-slate-500 max-w-sm">
          Faça login para ver o histórico da sua caminhada com Deus.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Linha do Tempo</h2>
          <p className="text-slate-500">O registro histórico da sua fé.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm self-start">
          <button 
            onClick={() => setFilter('Todas')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'Todas' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Tudo
          </button>
          <button 
            onClick={() => setFilter('Memoriais')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${filter === 'Memoriais' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Star size={16} fill={filter === 'Memoriais' ? 'currentColor' : 'none'} /> Memoriais
          </button>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar no histórico..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
        />
      </div>

      <div className="relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-px before:bg-slate-200 space-y-12">
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="relative pl-16 animate-pulse">
              <div className="absolute left-[18px] top-6 w-4 h-4 rounded-full bg-slate-200 z-10" />
              <div className="bg-white h-48 rounded-3xl border border-slate-200" />
            </div>
          ))
        ) : filteredEntries.length === 0 ? (
          <div className="ml-16 py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">Nenhum registro encontrado.</p>
          </div>
        ) : (
          filteredEntries.map((entry, index) => {
            const cat = categoryOptions.find(c => c.id === entry.category) || categoryOptions[0];
            return (
              <motion.div 
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-16 group"
              >
                <div className={`absolute left-[18px] top-6 w-4 h-4 rounded-full z-10 border-4 border-slate-50 ${entry.isMemorial ? 'bg-amber-400' : 'bg-primary'} shadow-sm group-hover:scale-125 transition-transform`} />
                
                <div className={`bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all ${entry.isMemorial ? 'ring-2 ring-amber-100' : ''}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${cat.bg} flex items-center justify-center`}>
                        <cat.icon size={20} className={cat.color} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{entry.title}</h3>
                        <p className="text-xs text-slate-400 font-medium">{new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.isMemorial && (
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-100 flex items-center gap-1">
                          <Star size={10} fill="currentColor" /> Memorial
                        </span>
                      )}
                      <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-100">
                        {entry.category}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-slate-600 text-sm leading-relaxed">
                      {renderDescription(entry.description)}
                    </div>

                    {entry.media && entry.media.length > 0 && (
                      <div className="mt-6 rounded-2xl overflow-hidden border border-slate-100">
                        <MediaCarousel media={entry.media} aspectRatio={entry.aspectRatio || '16:9'} />
                      </div>
                    )}

                    {entry.bibleVerse && (
                      <div className="mt-6 p-4 bg-primary-50 rounded-2xl border border-primary-100 flex items-start gap-3">
                        <Book size={18} className="text-primary shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-primary-900 italic">"{entry.bibleVerse}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
