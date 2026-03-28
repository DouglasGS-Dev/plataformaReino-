import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, ChevronRight, Star, ShieldCheck, Search, MessageSquare, Briefcase } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useOutletContext } from 'react-router-dom';
import { Ministry } from '../../types';

interface Schedule {
  id: string;
  ministryId: string;
  ministryName: string;
  date: any;
  time: string;
  role: string;
  status: 'confirmed' | 'pending' | 'declined';
}

export default function Ministries() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);

  useEffect(() => {
    if (!churchId || !auth.currentUser) return;

    // Fetch all ministries
    const mQuery = query(
      collection(db, 'ministries'),
      where('churchId', '==', churchId),
      orderBy('name')
    );

    const unsubscribeMinistries = onSnapshot(mQuery, (snapshot) => {
      setMinistries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ministry)));
    });

    // Fetch user schedules (mocking for now as we don't have a schedules collection yet, 
    // but we can prepare the UI)
    // In a real scenario, we'd query a 'schedules' collection where userId == current.uid
    setLoading(false);

    return () => unsubscribeMinistries();
  }, [churchId]);

  const filteredMinistries = ministries.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.leaderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedMinistry) {
    return (
      <div className="space-y-6 pb-20">
        <button 
          onClick={() => setSelectedMinistry(null)}
          className="flex items-center text-primary font-medium"
        >
          <ChevronRight className="rotate-180 mr-1" size={20} />
          Voltar para Ministérios
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-40 primary-gradient relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h2 className="text-2xl font-bold">{selectedMinistry.name}</h2>
              <p className="text-white/80 flex items-center gap-2 mt-1">
                <ShieldCheck size={18} />
                Líder: {selectedMinistry.leaderName}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Sobre o Ministério</h3>
              <p className="text-slate-600 leading-relaxed">
                {selectedMinistry.description || "Este ministério serve à igreja através de diversas atividades e dedicação ao Reino."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Membros</div>
                <div className="text-xl font-bold text-slate-900">{selectedMinistry.membersCount || 0}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Status</div>
                <div className="text-xl font-bold text-emerald-600">Ativo</div>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button className="w-full py-4 primary-gradient text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                <Star size={20} />
                Quero Servir neste Ministério
              </button>
              <button className="w-full py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <MessageSquare size={20} />
                Falar com o Líder
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Ministérios</h2>
        <p className="text-slate-500 mt-1">Descubra onde você pode servir com seus talentos.</p>
      </header>

      {/* My Scales / Schedules */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Minha Escala</h3>
        <div className="primary-gradient rounded-3xl p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-white/60" />
              <span className="text-white/80 font-medium">Próximo Serviço</span>
            </div>
            <h4 className="text-2xl font-bold mb-1">Ministério de Louvor</h4>
            <p className="text-white/90 opacity-90">Domingo, 22 de Março • 18:30</p>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Star size={16} />
                </div>
                <span className="text-sm font-medium">Vocal / Backing</span>
              </div>
              <button className="px-4 py-2 bg-white text-primary rounded-xl text-sm font-bold">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar ministérios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm transition-all"
        />
      </div>

      {/* All Ministries */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Todos os Ministérios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500">Carregando ministérios...</div>
          ) : filteredMinistries.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">Nenhum ministério encontrado.</div>
          ) : (
            filteredMinistries.map((m, index) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMinistry(m)}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all shrink-0">
                  <Briefcase size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{m.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <ShieldCheck size={12} />
                    Líder: {m.leaderName}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                      {m.membersCount || 0} Membros
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-primary/40 transition-colors" />
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
