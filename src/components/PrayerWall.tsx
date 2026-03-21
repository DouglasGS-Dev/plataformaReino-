import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  increment,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { PrayerRequest, Intercession, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  MessageCircle, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Lock, 
  Globe, 
  Send,
  X,
  ChevronRight
} from 'lucide-react';
import { Toast } from './UIComponents';

interface PrayerWallProps {
  churchId: string;
  userProfile: UserProfile;
}

const CATEGORIES = ["Saúde", "Família", "Finanças", "Espiritual", "Outros"] as const;

export default function PrayerWall({ churchId, userProfile }: PrayerWallProps) {
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('Todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState<PrayerRequest | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New Prayer State
  const [newPrayer, setNewPrayer] = useState({
    content: '',
    category: 'Espiritual' as PrayerRequest['category'],
    isPrivate: false
  });

  // Answer Testimony State
  const [testimony, setTestimony] = useState('');

  useEffect(() => {
    if (!churchId) return;

    // Query for public prayers in the church OR private prayers by the user
    // Note: Firestore rules will also enforce this, but we filter here for UI
    const q = query(
      collection(db, 'prayer_requests'),
      where('churchId', '==', churchId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prayersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PrayerRequest[];

      // Client-side filtering for privacy (since we can't easily do OR in simple queries with different fields)
      const filtered = prayersData.filter(p => 
        !p.isPrivate || p.authorId === auth.currentUser?.uid || userProfile.role === 'admin' || userProfile.role === 'pastor'
      );

      setPrayers(filtered);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching prayers:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId, userProfile.role]);

  const handleCreatePrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrayer.content.trim()) return;

    try {
      const prayerData = {
        churchId,
        authorId: auth.currentUser?.uid,
        authorName: userProfile.displayName || 'Membro',
        authorPhoto: userProfile.photoURL || '',
        content: newPrayer.content,
        category: newPrayer.category,
        isPrivate: newPrayer.isPrivate,
        status: 'active',
        intercessorsCount: 0,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'prayer_requests'), prayerData);
      setNewPrayer({ content: '', category: 'Espiritual', isPrivate: false });
      setShowCreateModal(false);
      setToast({ message: 'Pedido de oração enviado!', type: 'success' });
    } catch (error) {
      console.error("Error creating prayer:", error);
      setToast({ message: 'Erro ao enviar pedido.', type: 'error' });
    }
  };

  const handleIntercede = async (prayerId: string) => {
    try {
      const intercessionId = `${auth.currentUser?.uid}_${prayerId}`;
      const intercessionRef = doc(db, 'prayer_requests', prayerId, 'intercessions', intercessionId);
      
      // Check if already interceding (optional, but good for UX)
      // For simplicity, we'll just try to set it. Rules should handle duplicates if needed.
      
      await setDoc(intercessionRef, {
        id: intercessionId,
        prayerRequestId: prayerId,
        intercessorId: auth.currentUser?.uid,
        intercessorName: userProfile.displayName || 'Intercessor',
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'prayer_requests', prayerId), {
        intercessorsCount: increment(1)
      });

      setToast({ message: 'Você se comprometeu a orar por isso!', type: 'success' });
    } catch (error) {
      console.error("Error interceding:", error);
      setToast({ message: 'Erro ao registrar intercessão.', type: 'error' });
    }
  };

  const handleMarkAsAnswered = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAnswerModal) return;

    try {
      await updateDoc(doc(db, 'prayer_requests', showAnswerModal.id), {
        status: 'answered',
        testimony: testimony,
        answeredAt: serverTimestamp()
      });

      setShowAnswerModal(null);
      setTestimony('');
      setToast({ message: 'Glória a Deus! Testemunho registrado.', type: 'success' });
    } catch (error) {
      console.error("Error marking as answered:", error);
      setToast({ message: 'Erro ao registrar testemunho.', type: 'error' });
    }
  };

  const filteredPrayers = filter === 'Todos' 
    ? prayers 
    : prayers.filter(p => p.category === filter);

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Mural de Oração</h2>
          <p className="text-slate-500 text-sm">Interceda pelos irmãos e compartilhe suas vitórias.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Novo Pedido
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setFilter('Todos')}
          className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
            filter === 'Todos' 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
          }`}
        >
          Todos
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              filter === cat 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Prayers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-white rounded-3xl animate-pulse border border-slate-100"></div>
          ))}
        </div>
      ) : filteredPrayers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart size={32} />
          </div>
          <p className="text-slate-500 font-medium">Nenhum pedido encontrado nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredPrayers.map((prayer) => (
              <motion.div
                key={prayer.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`group relative bg-white rounded-3xl p-6 border transition-all hover:shadow-xl hover:-translate-y-1 ${
                  prayer.status === 'answered' ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100'
                }`}
              >
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    prayer.status === 'answered' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {prayer.status === 'answered' ? 'Oração Respondida' : prayer.category}
                  </span>
                  {prayer.isPrivate && (
                    <div className="flex items-center gap-1 text-amber-600 text-[10px] font-bold uppercase">
                      <Lock size={12} />
                      Confidencial
                    </div>
                  )}
                </div>

                {/* Content */}
                <p className="text-slate-700 leading-relaxed mb-6 font-medium">
                  "{prayer.content}"
                </p>

                {prayer.status === 'answered' && prayer.testimony && (
                  <div className="mb-6 p-4 bg-white/60 rounded-2xl border border-emerald-100 italic text-slate-600 text-sm">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold mb-1 not-italic text-xs">
                      <CheckCircle2 size={14} />
                      Testemunho:
                    </div>
                    {prayer.testimony}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <img 
                      src={prayer.authorPhoto || `https://ui-avatars.com/api/?name=${prayer.authorName}&background=random`}
                      alt={prayer.authorName}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-900">{prayer.authorName}</p>
                      <p className="text-[10px] text-slate-400">
                        {prayer.createdAt?.toDate().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {prayer.status === 'active' && (
                      <>
                        {prayer.authorId === auth.currentUser?.uid ? (
                          <button
                            onClick={() => setShowAnswerModal(prayer)}
                            className="flex items-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                          >
                            <CheckCircle2 size={14} />
                            Fui Atendido!
                          </button>
                        ) : (
                          <button
                            onClick={() => handleIntercede(prayer.id)}
                            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                          >
                            <Heart size={14} className="group-hover:fill-indigo-600" />
                            {prayer.intercessorsCount > 0 ? `${prayer.intercessorsCount} Orando` : 'Vou Orar'}
                          </button>
                        )}
                      </>
                    )}
                    {prayer.status === 'answered' && (
                      <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                        <CheckCircle2 size={16} />
                        Glória a Deus!
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Novo Pedido de Oração</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreatePrayer} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Qual o seu pedido?</label>
                  <textarea
                    required
                    value={newPrayer.content}
                    onChange={(e) => setNewPrayer({...newPrayer, content: e.target.value})}
                    placeholder="Escreva aqui seu motivo de oração..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[120px] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                    <select
                      value={newPrayer.category}
                      onChange={(e) => setNewPrayer({...newPrayer, category: e.target.value as any})}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Privacidade</label>
                    <div className="flex items-center gap-2 h-[48px]">
                      <button
                        type="button"
                        onClick={() => setNewPrayer({...newPrayer, isPrivate: !newPrayer.isPrivate})}
                        className={`flex-1 h-full rounded-2xl border flex items-center justify-center gap-2 transition-all font-bold text-xs ${
                          newPrayer.isPrivate 
                            ? 'bg-amber-50 border-amber-200 text-amber-700' 
                            : 'bg-slate-50 border-slate-100 text-slate-600'
                        }`}
                      >
                        {newPrayer.isPrivate ? <Lock size={14} /> : <Globe size={14} />}
                        {newPrayer.isPrivate ? 'Confidencial' : 'Público'}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  * Pedidos confidenciais são visíveis apenas para você e a equipe pastoral.
                </p>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <Send size={20} />
                  Enviar Pedido
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Answer Modal */}
      <AnimatePresence>
        {showAnswerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Glória a Deus!</h3>
                <p className="text-slate-500 mb-6">Compartilhe o seu testemunho para edificar a igreja.</p>
                
                <form onSubmit={handleMarkAsAnswered} className="space-y-4">
                  <textarea
                    required
                    value={testimony}
                    onChange={(e) => setTestimony(e.target.value)}
                    placeholder="Conte como Deus respondeu sua oração..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all min-h-[120px] resize-none"
                  />
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAnswerModal(null)}
                      className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                    >
                      Depois
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-100"
                    >
                      Publicar Vitória
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}
