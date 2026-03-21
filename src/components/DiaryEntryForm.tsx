import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Book, Info, Star, Zap, Shield, Mountain, Target, HandHeart, CheckCircle2, Lightbulb, Heart, MessageCircle, Trash2, Image as ImageIcon, Megaphone } from 'lucide-react';
import { Category, Impact, SpiritualEntry, PostMedia } from '../types';
import { compressImage } from '../utils/media';

interface DiaryEntryFormProps {
  onSave: (entry: Omit<SpiritualEntry, 'id' | 'date'>, id?: number) => void;
  onClose: () => void;
  initialCategory?: Category;
  initialEntry?: SpiritualEntry;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const categoryOptions = [
  { id: 'Milagres', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'Livramentos', icon: Shield, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'Desafios', icon: Mountain, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
  { id: 'Propósitos', icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { id: 'Pedidos de oração', icon: HandHeart, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' },
  { id: 'Orações respondidas', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'Lições espirituais', icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  { id: 'Gratidão', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-200' },
  { id: 'O que Deus falou comigo', icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' }
];

const categories: Category[] = categoryOptions.map(c => c.id as Category);

const guidedQuestions = [
  "O que aconteceu nessa situação?",
  "Onde você percebeu Deus agindo?",
  "O que essa experiência ensinou sobre Deus?",
  "O que mudou em sua fé depois disso?"
];

export default function DiaryEntryForm({ onSave, onClose, initialCategory, initialEntry, showToast }: DiaryEntryFormProps) {
  const parseDescription = (desc: string) => {
    if (!desc) return ['', '', '', ''];
    
    let parts = ['', '', '', ''];
    
    if (desc.includes('**O que aconteceu nessa situação?**')) {
      const splitDesc = desc.split(/\*\*(.*?)\*\*\n?/);
      for (let i = 1; i < splitDesc.length; i += 2) {
        const q = splitDesc[i].trim();
        const a = splitDesc[i+1]?.trim() || '';
        const idx = guidedQuestions.indexOf(q);
        if (idx !== -1) {
          parts[idx] = a;
        }
      }
      return parts;
    }
    
    return [desc, '', '', ''];
  };

  const [mode, setMode] = useState<'quick' | 'full'>(initialEntry?.lessonsLearned || initialEntry?.bibleVerse ? 'full' : 'quick');
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [category, setCategory] = useState<Category>(initialEntry?.category || initialCategory || 'Gratidão');
  const [descriptions, setDescriptions] = useState<string[]>(() => parseDescription(initialEntry?.description || ''));
  const [lessons, setLessons] = useState(initialEntry?.lessonsLearned || '');
  const [verse, setVerse] = useState(initialEntry?.bibleVerse || '');
  const [impact, setImpact] = useState<Impact>(initialEntry?.impact || 'Médio');
  const [isMemorial, setIsMemorial] = useState(initialEntry?.isMemorial || false);
  const [shareWithCommunity, setShareWithCommunity] = useState(initialEntry?.shareWithCommunity || false);
  const [selectedMedia, setSelectedMedia] = useState<PostMedia[]>(initialEntry?.media || []);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '16:9' | '9:16'>(initialEntry?.aspectRatio || '16:9');
  const [mediaError, setMediaError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setMediaError(null);

    const MAX_TOTAL_SIZE = 800 * 1024; // 800KB total limit for base64 safety
    let currentTotalSize = selectedMedia.reduce((acc, m) => acc + m.url.length, 0);

    for (const file of Array.from(files) as File[]) {
      if (file.size > 2 * 1024 * 1024 && file.type.startsWith('video')) {
        setMediaError(`O vídeo "${file.name}" é muito grande. O limite para vídeos é de 2MB.`);
        continue;
      }

      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      let processedUrl = fileData;
      const type = file.type.startsWith('video') ? 'video' : 'image';

      if (type === 'image') {
        processedUrl = await compressImage(fileData);
      }

      if (currentTotalSize + processedUrl.length > MAX_TOTAL_SIZE) {
        setMediaError('Limite de tamanho atingido para este registro. Tente remover algumas mídias ou usar arquivos menores.');
        break;
      }

      currentTotalSize += processedUrl.length;
      setSelectedMedia(prev => [...prev, { url: processedUrl, type: type as any }]);
    }
    
    // Reset input
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      let finalDescription = '';
      if (descriptions[1] || descriptions[2] || descriptions[3]) {
        const parts = [];
        if (descriptions[0]) parts.push(`**${guidedQuestions[0]}**\n${descriptions[0]}`);
        if (descriptions[1]) parts.push(`**${guidedQuestions[1]}**\n${descriptions[1]}`);
        if (descriptions[2]) parts.push(`**${guidedQuestions[2]}**\n${descriptions[2]}`);
        if (descriptions[3]) parts.push(`**${guidedQuestions[3]}**\n${descriptions[3]}`);
        finalDescription = parts.join('\n\n');
      } else {
        finalDescription = descriptions[0];
      }

      await onSave({
        title,
        category,
        description: finalDescription,
        lessonsLearned: lessons,
        bibleVerse: verse || null,
        impact,
        isMemorial,
        shareWithCommunity,
        media: selectedMedia.length > 0 ? selectedMedia : null,
        aspectRatio: selectedMedia.length > 0 ? aspectRatio : null
      }, initialEntry?.id);
    } catch (error: any) {
      console.error("Error saving entry:", error);
      // Try to parse the JSON error from handleFirestoreError
      let errorMessage = "Erro ao salvar o registro. Por favor, tente novamente.";
      try {
        const parsedError = JSON.parse(error.message);
        if (parsedError.error) {
          errorMessage = `Erro: ${parsedError.error}`;
        }
      } catch (e) {
        // Not a JSON error, use the message if it's a string
        if (error.message && !error.message.startsWith('{')) {
          errorMessage = error.message;
        }
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 md:p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
              {initialEntry ? 'Editar Registro Espiritual' : 'Novo Registro Espiritual'}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">
              {initialEntry ? 'Atualize sua experiência com Deus.' : 'Registre sua caminhada com Deus.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 mb-8 p-1 bg-slate-100 rounded-xl">
          <button 
            type="button"
            onClick={() => setMode('quick')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'quick' ? 'bg-white text-[var(--color-primary-600)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
          >
            Registro Rápido
          </button>
          <button 
            type="button"
            onClick={() => setMode('full')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'full' ? 'bg-white text-[var(--color-primary-600)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
          >
            Registro Completo
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] ml-1">Título do Registro</label>
            <input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: O milagre da provisão"
              className="modern-input w-full"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] ml-1">Categoria Espiritual</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {categoryOptions.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as Category)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                    category === cat.id 
                      ? `${cat.bg} ${cat.border} ring-2 ring-[var(--color-primary-500)] ring-offset-1` 
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${category === cat.id ? 'bg-white/50' : cat.bg} flex items-center justify-center mb-1`}>
                    <cat.icon size={16} className={cat.color} />
                  </div>
                  <span className={`text-[10px] font-medium text-center leading-tight ${
                    category === cat.id ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
                  }`}>
                    {cat.id}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 ml-1 mb-2">
              <Info size={16} className="text-[var(--color-primary-600)]" />
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Relate sua experiência</h3>
            </div>
            
            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {guidedQuestions.map((q, i) => (
                <div key={i} className="space-y-2">
                  <label className="text-sm font-semibold text-[var(--color-primary-700)] ml-1">{q}</label>
                  <textarea 
                    required={i === 0}
                    value={descriptions[i]}
                    onChange={(e) => {
                      const newDesc = [...descriptions];
                      newDesc[i] = e.target.value;
                      setDescriptions(newDesc);
                    }}
                    placeholder={i === 0 ? "Conte o que aconteceu..." : "Opcional..."}
                    className="modern-input w-full min-h-[80px] resize-y bg-white"
                  />
                </div>
              ))}
            </div>

              {/* Media Upload Section */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <label className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border-2 border-dashed ${selectedMedia.length > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                  <ImageIcon size={18} />
                  <span>{selectedMedia.length > 0 ? `${selectedMedia.length} Mídias` : 'Adicionar Mídia'}</span>
                  <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileSelect} />
                </label>

              </div>


              {selectedMedia.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-full text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">Formato do Quadro</div>
                  {(['1:1', '4:5', '16:9', '9:16'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        aspectRatio === ratio 
                          ? 'bg-[var(--color-primary-500)] text-white shadow-sm' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {ratio === '1:1' && '1:1 (Quadrado)'}
                      {ratio === '4:5' && '4:5 (Retrato)'}
                      {ratio === '16:9' && '16:9 (Vídeo)'}
                      {ratio === '9:16' && '9:16 (Reels)'}
                    </button>
                  ))}
                </div>
              )}
              
              {mediaError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium mb-4 flex items-center justify-between border border-red-100"
                >
                  <span>{mediaError}</span>
                  <button type="button" onClick={() => setMediaError(null)} className="p-1 hover:bg-red-100 rounded-full transition-colors">
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {mode === 'full' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)] ml-1">O que aprendi com isso?</label>
                <textarea 
                  value={lessons}
                  onChange={(e) => setLessons(e.target.value)}
                  placeholder="Lições espirituais aprendidas..."
                  className="modern-input w-full min-h-[100px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-text-secondary)] ml-1">Versículo Bíblico Relacionado (Opcional)</label>
                <input 
                  value={verse}
                  onChange={(e) => setVerse(e.target.value)}
                  placeholder="Ex: Filipenses 4:13"
                  className="modern-input w-full"
                />
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] ml-1">Impacto Espiritual</label>
                  <div className="flex gap-2">
                    {(['Baixo', 'Médio', 'Alto'] as Impact[]).map(imp => (
                      <button
                        key={imp}
                        type="button"
                        onClick={() => setImpact(imp)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                          impact === imp 
                            ? 'bg-[var(--color-primary-50)] border-[var(--color-primary-200)] text-[var(--color-primary-700)]' 
                            : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-slate-50'
                        }`}
                      >
                        {imp}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => setIsMemorial(!isMemorial)}
                    className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all border ${
                      isMemorial 
                        ? 'bg-amber-50 border-amber-200 text-amber-700' 
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-slate-50'
                    }`}
                  >
                    <Star size={16} fill={isMemorial ? 'currentColor' : 'none'} className={isMemorial ? 'text-amber-500' : ''} />
                    Memorial Espiritual
                  </button>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-900">Compartilhar com a Comunidade</h4>
                    <p className="text-[10px] text-indigo-600">Torne este registro visível para outros membros da igreja.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShareWithCommunity(!shareWithCommunity)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    shareWithCommunity ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      shareWithCommunity ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </motion.div>
          )}

          <div className="pt-6 flex gap-3 border-t border-[var(--color-border)]">
            <button 
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-[2] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> {initialEntry ? 'Salvar Alterações' : 'Salvar Registro'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
