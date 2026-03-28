import React from 'react';
import { Music, Search, Play, Plus } from 'lucide-react';

interface MusicPickerProps {
  onSelect: (song: any) => void;
  onClose: () => void;
}

export const MusicPicker: React.FC<MusicPickerProps> = ({ onSelect, onClose }) => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Escolher Música</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          Fechar
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar hinos, louvores..."
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 cursor-pointer group">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Music size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800 text-sm">Louvor {i}</h4>
              <p className="text-xs text-slate-500">Artista Exemplo</p>
            </div>
            <button className="p-2 opacity-0 group-hover:opacity-100 text-primary">
              <Plus size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MusicPicker;
