import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Sparkles, Shield, Mountain, Target, HandHeart, 
  CheckCircle2, Lightbulb, Heart, MessageCircle, Search, 
  Filter, X, CheckCircle2 as CheckIcon, PenTool
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { SpiritualEntry, Category, UserProfile } from '../../types';
import { User } from 'firebase/auth';

const DiaryEntryForm = lazy(() => import('../../components/DiaryEntryForm'));

const categoryOptions = [
  { id: 'Milagres', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'Livramentos', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'Desafios', icon: Mountain, color: 'text-slate-500', bg: 'bg-slate-50' },
  { id: 'Propósitos', icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'Pedidos de oração', icon: HandHeart, color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: 'Orações respondidas', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'Lições espirituais', icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'Gratidão', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
  { id: 'O que Deus falou comigo', icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-50' }
];

export default function Diary() {
  const { user, userProfile, handleLogin } = useOutletContext<{ 
    user: User | null; 
    userProfile: UserProfile | null;
    handleLogin: () => void;
  }>();

  const [entries, setEntries] = useState<SpiritualEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [initialCategory, setInitialCategory] = useState<Category | undefined>();
  const [editingEntry, setEditingEntry] = useState<SpiritualEntry | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSaveEntry = async (newEntryData: Omit<SpiritualEntry, 'id' | 'date'>, existingId?: number) => {
    if (!user) {
      handleLogin();
      return;
    }
    
    const entryId = existingId !== undefined ? existingId : Date.now();
    const entryToUpdate = existingId !== undefined ? entries.find(e => e.id === existingId) : undefined;

    const newEntry: SpiritualEntry = {
      ...newEntryData,
      id: entryId,
      userId: user.uid,
      date: entryToUpdate ? entryToUpdate.date : new Date().toISOString(),
      createdAt: entryToUpdate?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      media: newEntryData.media || null,
      aspectRatio: newEntryData.aspectRatio || null,
      bibleVerse: newEntryData.bibleVerse || null
    };

    try {
      const entryRef = doc(db, `users/${user.uid}/entries/${entryId}`);
      if (existingId !== undefined) {
        await setDoc(entryRef, newEntry, { merge: true });
        showToast('Registro atualizado!');
      } else {
        await setDoc(entryRef, newEntry);
        showToast('Novo registro salvo!');
      }
      
      // Sync to community timeline if shared
      if (userProfile?.churchId && newEntry.shareWithCommunity) {
        const postId = `post_diary_${entryId}`;
        const postData = {
          churchId: userProfile.churchId,
          authorId: user.uid,
          authorName: user.displayName || 'Membro',
          authorPhoto: user.photoURL || '',
          content: `Compartilhou um novo registro no diário: "${newEntry.title}"\n\n${newEntry.description.length > 200 ? newEntry.description.substring(0, 200) + '...' : newEntry.description}`,
          type: newEntry.category === 'Pedidos de oração' ? 'prayer' : 'testimony',
          bibleVerse: newEntry.bibleVerse || null,
          media: newEntry.media || null,
          aspectRatio: newEntry.aspectRatio || null,
          likesCount: 0,
          createdAt: serverTimestamp()
        };

        try {
          const { createdAt, likesCount, ...updateData } = postData;
          await updateDoc(doc(db, 'posts', postId), updateData);
        } catch (e) {
          await setDoc(doc(db, 'posts', postId), postData);
        }
      }

      setIsFormOpen(false);
      setEditingEntry(undefined);
    } catch (error) {
      handleFirestoreError(error, existingId !== undefined ? OperationType.UPDATE : OperationType.CREATE, `users/${user.uid}/entries/${entryId}`);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      entry.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [entries, searchQuery]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
          <PenTool size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Seu Diário Espiritual</h2>
        <p className="text-slate-500 max-w-sm mb-8">
          Faça login para começar a registrar sua caminhada com Deus e guardar seus memoriais.
        </p>
        <button onClick={handleLogin} className="btn-primary px-8 py-3">
          Entrar com Google
        </button>
      </div>
    );
  }

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
              <CheckIcon size={18} />
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Meu Diário</h2>
          <p className="text-slate-500">Registre o que Deus tem feito em sua vida.</p>
        </div>
        <button 
          onClick={() => {
            setInitialCategory(undefined);
            setEditingEntry(undefined);
            setIsFormOpen(true);
          }}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-3"
        >
          <Plus size={20} /> Novo Registro
        </button>
      </header>

      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3">
        {categoryOptions.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setInitialCategory(cat.id as Category);
              setEditingEntry(undefined);
              setIsFormOpen(true);
            }}
            className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-all hover:-translate-y-1 group"
          >
            <div className={`w-10 h-10 rounded-full ${cat.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
              <cat.icon size={20} className={cat.color} />
            </div>
            <span className="text-[10px] font-medium text-center text-slate-500 leading-tight">{cat.id}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar nos seus registros..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))
        ) : filteredEntries.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-medium">Nenhum registro encontrado.</p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
              onClick={() => {
                setEditingEntry(entry);
                setIsFormOpen(true);
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-indigo-100">
                  {entry.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(entry.id).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                {entry.title}
              </h3>
              <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                {entry.description}
              </p>
              
              {entry.isMemorial && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-amber-600">
                  <Sparkles size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Memorial</span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      <Suspense fallback={null}>
        {isFormOpen && (
          <DiaryEntryForm 
            onClose={() => setIsFormOpen(false)}
            onSave={handleSaveEntry}
            initialCategory={initialCategory}
            initialEntry={editingEntry}
            showToast={(msg, type) => showToast(msg, type === 'info' ? 'success' : type)}
          />
        )}
      </Suspense>
    </div>
  );
}
