import React from 'react';
import { Palette, Type, Square, Circle, Download, X } from 'lucide-react';

interface ArtEditorProps {
  imageUrl?: string;
  onSave: (editedUrl: string) => void;
  onClose: () => void;
  churchName?: string;
}

export const ArtEditor: React.FC<ArtEditorProps> = ({ imageUrl, onSave, onClose, churchName }) => {
  return (
    <div className="fixed inset-0 z-[110] bg-black/90 flex flex-col">
      <div className="p-4 flex items-center justify-between text-white">
        <h3 className="font-bold">Editor de Arte</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="relative max-w-full max-h-full aspect-square bg-slate-800 rounded-lg overflow-hidden shadow-2xl">
          <img src={imageUrl} alt="Edit" className="w-full h-full object-contain" />
          <div className="absolute inset-0 pointer-events-none border-2 border-primary/50" />
        </div>
      </div>

      <div className="p-6 bg-slate-900 border-t border-white/10 flex items-center justify-between">
        <div className="flex gap-4">
          <button className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20">
            <Type size={20} />
          </button>
          <button className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20">
            <Palette size={20} />
          </button>
          <button className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20">
            <Square size={20} />
          </button>
        </div>
        
        <button
          onClick={() => onSave(imageUrl)}
          className="btn-primary px-8 py-3"
        >
          Salvar Arte
        </button>
      </div>
    </div>
  );
};

export default ArtEditor;
