import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  History, 
  Plus, 
  ChevronRight, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Info
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: Timestamp;
  description: string;
  type: 'income' | 'expense';
}

export default function Giving() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'finances'),
      where('userId', '==', auth.currentUser.uid),
      where('type', '==', 'income'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];
      setTransactions(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching giving history:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'finances');
      } catch (e) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const totalGiving = transactions.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Contribuições</h1>
        <p className="text-slate-500 text-sm">Gerencie seus dízimos e ofertas</p>
      </header>

      {/* Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary rounded-3xl p-6 text-white shadow-lg shadow-primary/20 mb-8 relative overflow-hidden"
      >
        <div className="relative z-10">
          <p className="text-primary-100 text-sm font-medium mb-1">Total Contribuído</p>
          <h2 className="text-4xl font-bold mb-4">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGiving)}
          </h2>
          <div className="flex items-center gap-2 text-primary-100 text-xs bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm">
            <TrendingUp size={14} />
            <span>Sua fidelidade abençoa o Reino</span>
          </div>
        </div>
        
        {/* Decorative Circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl"></div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button className="bg-white p-4 rounded-3xl border border-slate-200 flex flex-col items-center gap-3 hover:bg-slate-50 transition-colors group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700">Nova Oferta</span>
        </button>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="bg-white p-4 rounded-3xl border border-slate-200 flex flex-col items-center gap-3 hover:bg-slate-50 transition-colors group"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <History size={24} />
          </div>
          <span className="text-sm font-bold text-slate-700">Ver Histórico</span>
        </button>
      </div>

      {/* Info Section */}
      <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 mb-8">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Info size={20} />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 mb-1">Por que contribuir?</h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria." 
              <span className="block mt-2 font-bold italic">— 2 Coríntios 9:7</span>
            </p>
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-slate-900">Histórico Recente</h3>
          <button 
            onClick={() => setShowHistory(true)}
            className="text-xs font-bold text-primary uppercase tracking-wider"
          >
            Ver Tudo
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-3xl animate-pulse"></div>
            ))
          ) : transactions.length > 0 ? (
            transactions.slice(0, 5).map((t) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{t.category}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {format(t.date.toDate(), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600">
                    + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                  </span>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Confirmado</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Heart size={32} />
              </div>
              <p className="text-slate-500 font-medium">Nenhuma contribuição registrada ainda.</p>
              <p className="text-xs text-slate-400 mt-1">Sua generosidade faz a diferença!</p>
            </div>
          )}
        </div>
      </div>

      {/* History Modal/Sheet */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowHistory(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-2xl rounded-t-[40px] p-6 pb-12 max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900">Histórico Completo</h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {transactions.map((t) => (
                  <div 
                    key={t.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <DollarSign size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{t.category}</h4>
                        <p className="text-xs text-slate-500">
                          {format(t.date.toDate(), "dd/MM/yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 text-sm">
                        + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
