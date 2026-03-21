import React from 'react';
import { Scissors, Play, Check } from 'lucide-react';

interface AudioTrimmerProps {
  file: File;
  url: string;
  onCancel: () => void;
  onTrim: (trimmedFile: any) => Promise<void>;
}

export const AudioTrimmer: React.FC<AudioTrimmerProps> = ({ file, url, onCancel, onTrim }) => {
  return (
    <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Cortar Áudio</h3>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
              Cancelar
            </button>
          </div>

          <div className="h-24 bg-slate-100 rounded-xl relative overflow-hidden flex items-center px-4">
            <div className="w-full h-12 flex items-end gap-0.5">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-indigo-400 rounded-full"
                  style={{ height: `${Math.random() * 100}%` }}
                />
              ))}
            </div>
            <div className="absolute inset-y-0 left-1/4 right-1/4 bg-indigo-500/20 border-x-2 border-indigo-500" />
          </div>

          <div className="flex justify-center gap-4">
            <button className="p-4 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200">
              <Play size={24} />
            </button>
            <button
              onClick={() => onTrim(file)}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
            >
              Confirmar Corte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioTrimmer;
