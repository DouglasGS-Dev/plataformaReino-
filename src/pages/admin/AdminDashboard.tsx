import React, { useState, useEffect } from 'react';
import { Users, Network, Wallet, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useOutletContext } from 'react-router-dom';
import { Church } from '../../types';

export default function AdminDashboard() {
  const { church } = useOutletContext<{ church: Church }>();
  const [stats, setStats] = useState([
    { name: 'Total de Membros', value: '0', change: '...', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Células Ativas', value: '0', change: '...', icon: Network, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { name: 'Entradas (Mês)', value: 'R$ 0', change: '...', icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Eventos Próximos', value: '0', change: '...', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' },
  ]);

  useEffect(() => {
    if (!church?.id) return;

    // Members count
    const membersQuery = query(collection(db, 'users'), where('churchId', '==', church.id));
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      setStats(prev => prev.map(s => s.name === 'Total de Membros' ? { ...s, value: snapshot.size.toString() } : s));
    });

    // Cells count
    const cellsQuery = query(collection(db, 'cells'), where('churchId', '==', church.id));
    const unsubscribeCells = onSnapshot(cellsQuery, (snapshot) => {
      setStats(prev => prev.map(s => s.name === 'Células Ativas' ? { ...s, value: snapshot.size.toString() } : s));
    });

    // Events count (upcoming)
    const today = new Date().toISOString().split('T')[0];
    const eventsQuery = query(
      collection(db, 'events'), 
      where('churchId', '==', church.id),
      where('date', '>=', today)
    );
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      setStats(prev => prev.map(s => s.name === 'Eventos Próximos' ? { ...s, value: snapshot.size.toString() } : s));
    });

    // Finances (Income this month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const financesQuery = query(
      collection(db, 'finances'),
      where('churchId', '==', church.id),
      where('date', '>=', firstDayOfMonth),
      where('type', '==', 'income')
    );
    const unsubscribeFinances = onSnapshot(financesQuery, (snapshot) => {
      const totalIncome = snapshot.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
      setStats(prev => prev.map(s => s.name === 'Entradas (Mês)' ? { 
        ...s, 
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome) 
      } : s));
    });

    return () => {
      unsubscribeMembers();
      unsubscribeCells();
      unsubscribeEvents();
      unsubscribeFinances();
    };
  }, [church?.id]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Visão Geral</h2>
        <p className="text-slate-500 mt-1">Acompanhe os principais indicadores da sua igreja.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              {stat.change !== '...' && (
                <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {stat.change}
                </span>
              )}
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.name}</h3>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-96">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Crescimento de Membros</h3>
          <div className="flex items-center justify-center h-full text-slate-400">
            [Gráfico de Linha Aqui]
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-96">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Receitas vs Despesas</h3>
          <div className="flex items-center justify-center h-full text-slate-400">
            [Gráfico de Barras Aqui]
          </div>
        </div>
      </div>
    </div>
  );
}
