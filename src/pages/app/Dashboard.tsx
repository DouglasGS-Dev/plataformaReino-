import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, TrendingUp, Calendar, Star, 
  CheckCircle2, Clock, Flame, Target, 
  BarChart3, PieChart, Activity
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { SpiritualEntry, UserProfile } from '../../types';
import { User } from 'firebase/auth';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie
} from 'recharts';

export default function DashboardPage() {
  const { user } = useOutletContext<{ user: User | null }>();
  const [entries, setEntries] = useState<SpiritualEntry[]>([]);
  const [devotionalStats, setDevotionalStats] = useState({ completed: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const entriesRef = collection(db, `users/${user.uid}/entries`);
    const q = query(entriesRef, orderBy('id', 'desc'));
    
    const unsubscribeEntries = onSnapshot(q, (snapshot) => {
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

    const statsRef = doc(db, `users/${user.uid}/stats/devotional`);
    const unsubscribeStats = onSnapshot(statsRef, (docSnap) => {
      if (docSnap.exists()) {
        setDevotionalStats(docSnap.data() as any);
      }
    });

    return () => {
      unsubscribeEntries();
      unsubscribeStats();
    };
  }, [user]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const data = months.map(name => ({ name, count: 0 }));
    
    entries.forEach(e => {
      const date = new Date(e.date);
      const monthIdx = date.getMonth();
      data[monthIdx].count++;
    });
    
    return data;
  }, [entries]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#64748b'];

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
          <LayoutDashboard size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Seu Painel de Progresso</h2>
        <p className="text-slate-500 max-w-sm">
          Faça login para acompanhar seu crescimento espiritual e estatísticas.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Meu Progresso</h2>
        <p className="text-slate-500">Acompanhe seu crescimento e constância espiritual.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Calendar size={24} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{entries.length}</h3>
          <p className="text-sm text-slate-500 font-medium">Registros no diário</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-2xl">
              <Flame size={24} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sequência</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{devotionalStats.streak} dias</h3>
          <p className="text-sm text-slate-500 font-medium">Devocional diário</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
              <Star size={24} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memoriais</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{entries.filter(e => e.isMemorial).length}</h3>
          <p className="text-sm text-slate-500 font-medium">Momentos marcantes</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
              <Target size={24} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meta</span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900">{Math.min(100, Math.round((devotionalStats.completed / 30) * 100))}%</h3>
          <p className="text-sm text-slate-500 font-medium">Objetivo mensal</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart3 size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Atividade Mensal</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <PieChart size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Distribuição por Categoria</h3>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 font-medium">Sem dados para exibir.</p>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {categoryData.slice(0, 4).map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-slate-500 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Activity size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Últimas Atividades</h3>
        </div>
        <div className="space-y-4">
          {entries.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-600 transition-all">
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 text-sm">{entry.title}</h4>
                <p className="text-xs text-slate-400 font-medium">
                  {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-full border border-indigo-100">
                {entry.category}
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-medium">
              Nenhuma atividade registrada ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
