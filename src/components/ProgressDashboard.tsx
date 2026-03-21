import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, TrendingUp, Calendar, Star, CheckCircle2, Clock } from 'lucide-react';

import { SpiritualEntry } from '../types';

interface ProgressDashboardProps {
  entries: SpiritualEntry[];
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ entries }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Calendar size={20} />
            </div>
            <span className="text-xs font-medium text-slate-400">Total</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{entries.length}</h3>
          <p className="text-sm text-slate-500">Registros no diário</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-medium text-slate-400">Sequência</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">5 dias</h3>
          <p className="text-sm text-slate-500">Frequência atual</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Star size={20} />
            </div>
            <span className="text-xs font-medium text-slate-400">Favoritos</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">3</h3>
          <p className="text-sm text-slate-500">Momentos marcantes</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-medium text-slate-400">Devocional</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">85%</h3>
          <p className="text-sm text-slate-500">Conclusão semanal</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Atividade Recente</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800">Novo registro no diário</h4>
                <p className="text-sm text-slate-500">Há {i * 2} horas atrás</p>
              </div>
              <div className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md">
                Espiritual
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
