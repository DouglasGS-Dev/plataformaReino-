import React from 'react';
import { motion } from 'motion/react';
import { Book, CheckCircle2, Star, Clock } from 'lucide-react';

interface DevotionalProps {
  stats: any;
  onComplete: () => void;
  onSaveToDiary: (text: string) => Promise<void>;
  isGuest: boolean;
}

const Devotional: React.FC<DevotionalProps> = ({ stats, onComplete, onSaveToDiary, isGuest }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
            <Book size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Devocional Diário</h2>
            <p className="text-slate-500 text-sm">Alimento espiritual para hoje</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none">
          <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-lg text-slate-700">
            "Lâmpada para os meus pés é tua palavra, e luz para o meu caminho." - Salmos 119:105
          </blockquote>
          
          <h3 className="text-lg font-semibold mt-6">Reflexão</h3>
          <p className="text-slate-600 leading-relaxed">
            A Palavra de Deus é o guia seguro para nossa jornada. Em meio às incertezas do mundo, 
            ela nos oferece clareza, esperança e direção. Dedique este momento para ouvir o que 
            o Espírito Santo deseja falar ao seu coração.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          {!isGuest && (
            <button
              onClick={() => onSaveToDiary("Reflexão do devocional de hoje: Salmos 119:105. A Palavra é luz para o meu caminho.")}
              className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-semibold hover:bg-indigo-50 transition-all"
            >
              <Star size={20} />
              Salvar no Diário
            </button>
          )}
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <CheckCircle2 size={20} />
            Concluir Devocional
          </button>
        </div>
      </div>
    </div>
  );
};

export default Devotional;
