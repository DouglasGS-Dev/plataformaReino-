import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Users, CheckCircle2, Copy, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, addDoc, updateDoc, doc, setDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Ministry, Cell, Event, FinancialTransaction, UserProfile, MinistrySchedule } from '../types';

interface ModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
  item?: T;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export const AddMinistryModal: React.FC<ModalProps<Ministry>> = ({ isOpen, onClose, churchId, item, onSuccess, onError }) => {
  const [name, setName] = useState(item?.name || '');
  const [leaderName, setLeaderName] = useState(item?.leaderName || '');
  const [description, setDescription] = useState(item?.description || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (item) {
      setName(item.name);
      setLeaderName(item.leaderName);
      setDescription(item.description || '');
    } else {
      setName('');
      setLeaderName('');
      setDescription('');
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !leaderName) return;

    setLoading(true);
    try {
      if (item?.id) {
        await updateDoc(doc(db, 'ministries', item.id), {
          name,
          leaderName,
          description,
          churchId,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'ministries'), {
          name,
          leaderName,
          description,
          churchId,
          memberCount: 0,
          createdAt: serverTimestamp(),
        });
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving ministry:", error);
      onError?.("Erro ao salvar ministério.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{item ? 'Editar Ministério' : 'Novo Ministério'}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Ministério</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: Louvor, Infantil, Jovens"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Líder</label>
                <input
                  type="text"
                  required
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all h-24 resize-none"
                  placeholder="Breve descrição do propósito do ministério"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {item ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const AddCellModal: React.FC<ModalProps<Cell>> = ({ isOpen, onClose, churchId, item, onSuccess, onError }) => {
  const [name, setName] = useState(item?.name || '');
  const [leaderName, setLeaderName] = useState(item?.leaderName || '');
  const [meetingDay, setMeetingDay] = useState(item?.meetingDay || 'Quarta-feira');
  const [meetingTime, setMeetingTime] = useState(item?.meetingTime || '20:00');
  const [address, setAddress] = useState(item?.address || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (item) {
      setName(item.name);
      setLeaderName(item.leaderName);
      setMeetingDay(item.meetingDay);
      setMeetingTime(item.meetingTime);
      setAddress(item.address);
    } else {
      setName('');
      setLeaderName('');
      setMeetingDay('Quarta-feira');
      setMeetingTime('20:00');
      setAddress('');
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !leaderName) return;

    setLoading(true);
    try {
      if (item?.id) {
        await updateDoc(doc(db, 'cells', item.id), {
          name,
          leaderName,
          meetingDay,
          meetingTime,
          address,
          churchId,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'cells'), {
          name,
          leaderName,
          meetingDay,
          meetingTime,
          address,
          churchId,
          memberCount: 0,
          createdAt: serverTimestamp(),
        });
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving cell:", error);
      onError?.("Erro ao salvar célula.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{item ? 'Editar Célula' : 'Nova Célula'}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Célula</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: Célula Esperança"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Líder</label>
                <input
                  type="text"
                  required
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Nome do responsável"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dia</label>
                  <select
                    value={meetingDay}
                    onChange={(e) => setMeetingDay(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  >
                    <option>Segunda-feira</option>
                    <option>Terça-feira</option>
                    <option>Quarta-feira</option>
                    <option>Quinta-feira</option>
                    <option>Sexta-feira</option>
                    <option>Sábado</option>
                    <option>Domingo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Local da reunião"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {item ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const AddEventModal: React.FC<ModalProps<Event>> = ({ isOpen, onClose, churchId, item, onSuccess, onError }) => {
  const [title, setTitle] = useState(item?.title || '');
  const [date, setDate] = useState(item?.date || '');
  const [location, setLocation] = useState(item?.location || '');
  const [description, setDescription] = useState(item?.description || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDate(item.date);
      setLocation(item.location || '');
      setDescription(item.description || '');
    } else {
      setTitle('');
      setDate('');
      setLocation('');
      setDescription('');
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return;

    setLoading(true);
    try {
      if (item?.id) {
        await updateDoc(doc(db, 'events', item.id), {
          title,
          date,
          location,
          description,
          churchId,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'events'), {
          title,
          date,
          location,
          description,
          churchId,
          createdAt: serverTimestamp(),
        });
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving event:", error);
      onError?.("Erro ao salvar evento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{item ? 'Editar Evento' : 'Novo Evento'}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título do Evento</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: Conferência de Jovens"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: Templo Principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all h-24 resize-none"
                  placeholder="Detalhes do evento"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {item ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const AddFinanceModal: React.FC<ModalProps<FinancialTransaction> & { initialType?: 'income' | 'expense' }> = ({ isOpen, onClose, churchId, item, onSuccess, onError, initialType }) => {
  const [description, setDescription] = useState(item?.description || '');
  const [amount, setAmount] = useState(item?.amount?.toString() || '');
  const [type, setType] = useState<'income' | 'expense'>(item?.type || initialType || 'income');
  const [category, setCategory] = useState(item?.category || (initialType === 'expense' ? 'Outros' : 'Oferta'));
  const [date, setDate] = useState(item?.date || new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (item) {
      setDescription(item.description);
      setAmount(item.amount.toString());
      setType(item.type);
      setCategory(item.category);
      setDate(item.date);
    } else {
      setDescription('');
      setAmount('');
      setType(initialType || 'income');
      setCategory(initialType === 'expense' ? 'Outros' : 'Oferta');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [item, isOpen, initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    setLoading(true);
    try {
      if (item?.id) {
        await updateDoc(doc(db, 'finances', item.id), {
          description,
          amount: parseFloat(amount),
          type,
          category,
          date,
          churchId,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'finances'), {
          description,
          amount: parseFloat(amount),
          type,
          category,
          date,
          churchId,
          createdAt: serverTimestamp(),
        });
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving transaction:", error);
      onError?.("Erro ao salvar transação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{item ? 'Editar Transação' : 'Nova Transação'}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Saída
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: Oferta de Domingo, Aluguel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  >
                    {type === 'income' ? (
                      <>
                        <option>Oferta</option>
                        <option>Dízimo</option>
                        <option>Doação</option>
                        <option>Evento</option>
                        <option>Outros</option>
                      </>
                    ) : (
                      <>
                        <option>Aluguel</option>
                        <option>Energia/Água</option>
                        <option>Ministério</option>
                        <option>Manutenção</option>
                        <option>Outros</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 btn-primary flex items-center justify-center gap-2 ${
                    type === 'income' ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500' : 'bg-red-600 hover:bg-red-700 border-red-500'
                  }`}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {item ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const AddMemberModal: React.FC<ModalProps<UserProfile>> = ({ isOpen, onClose, churchId, onError }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && churchId) {
      // Fetch church invite code
      const fetchChurch = async () => {
        try {
          const { getDoc } = await import('firebase/firestore');
          const churchDoc = await getDoc(doc(db, 'churches', churchId));
          if (churchDoc.exists()) {
            setInviteCode(churchDoc.data().inviteCode || '');
          }
        } catch (error) {
          console.error("Error fetching church:", error);
          onError?.("Erro ao carregar código de convite.");
        }
      };
      fetchChurch();
    }
  }, [isOpen, churchId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Convidar Membros</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <Users size={32} />
              </div>
              
              <div>
                <h4 className="font-bold text-slate-800 text-lg">Código de Convite</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Compartilhe este código com os membros da sua igreja para que eles possam se conectar ao seu ambiente.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative">
                <div className="text-4xl font-mono font-bold tracking-widest text-indigo-600">
                  {inviteCode || '...'}
                </div>
              </div>

              <button
                onClick={handleCopy}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3"
              >
                {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                {copied ? 'Código Copiado!' : 'Copiar Código'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const AddEBDClassModal: React.FC<ModalProps<any>> = ({ isOpen, onClose, churchId, item, onSuccess, onError }) => {
  const [name, setName] = useState(item?.name || '');
  const [teacherName, setTeacherName] = useState(item?.teacherName || '');
  const [category, setCategory] = useState(item?.category || 'Adultos');
  const [description, setDescription] = useState(item?.description || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setTeacherName(item.teacherName);
      setCategory(item.category);
      setDescription(item.description || '');
    } else {
      setName('');
      setTeacherName('');
      setCategory('Adultos');
      setDescription('');
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        name,
        teacherName,
        category,
        description,
        churchId,
        updatedAt: serverTimestamp(),
      };

      if (item?.id) {
        await updateDoc(doc(db, 'ebd_classes', item.id), data);
      } else {
        await addDoc(collection(db, 'ebd_classes'), {
          ...data,
          studentCount: 0,
          createdAt: serverTimestamp(),
        });
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving EBD class:", error);
      onError?.("Erro ao salvar classe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{item ? 'Editar Classe' : 'Nova Classe'}</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Classe</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Casais, Jovens, Discipulado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Professor Responsável</label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Nome do professor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Adultos">Adultos</option>
                  <option value="Jovens">Jovens</option>
                  <option value="Adolescentes">Adolescentes</option>
                  <option value="Crianças">Crianças</option>
                  <option value="Discipulado">Discipulado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                  placeholder="Objetivo da classe..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {item ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const AddScheduleModal = ({
  isOpen,
  onClose,
  churchId,
  ministryId,
  scheduleToEdit,
  onSuccess,
  onError
}: {
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
  ministryId: string;
  scheduleToEdit?: MinistrySchedule;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) => {
  const [eventId, setEventId] = useState(scheduleToEdit?.eventId || '');
  const [date, setDate] = useState(scheduleToEdit?.date || '');
  const [roles, setRoles] = useState<{ roleName: string; userId: string }[]>(
    scheduleToEdit?.roles || [{ roleName: '', userId: '' }]
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchEventsAndMembers = async () => {
        try {
          const eventsQuery = query(collection(db, 'events'), where('churchId', '==', churchId));
          const eventsSnapshot = await getDocs(eventsQuery);
          setEvents(eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));

          const membersQuery = query(collection(db, 'users'), where('churchId', '==', churchId));
          const membersSnapshot = await getDocs(membersQuery);
          setMembers(membersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchEventsAndMembers();
    }
  }, [isOpen, churchId]);

  useEffect(() => {
    if (scheduleToEdit) {
      setEventId(scheduleToEdit.eventId);
      setDate(scheduleToEdit.date);
      setRoles(scheduleToEdit.roles);
    } else {
      setEventId('');
      setDate('');
      setRoles([{ roleName: '', userId: '' }]);
    }
  }, [scheduleToEdit, isOpen]);

  const handleAddRole = () => {
    setRoles([...roles, { roleName: '', userId: '' }]);
  };

  const handleRemoveRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index));
  };

  const handleRoleChange = (index: number, field: 'roleName' | 'userId', value: string) => {
    const newRoles = [...roles];
    newRoles[index][field] = value;
    setRoles(newRoles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedEvent = events.find(ev => ev.id === eventId);
      
      const rolesWithNames = roles.filter(r => r.roleName && r.userId).map(r => {
        const member = members.find(m => m.uid === r.userId);
        return {
          roleName: r.roleName,
          userId: r.userId,
          userName: member?.displayName || 'Desconhecido'
        };
      });

      const scheduleData = {
        churchId,
        ministryId,
        eventId,
        eventTitle: selectedEvent?.title || 'Evento',
        date,
        roles: rolesWithNames,
        updatedAt: serverTimestamp()
      };

      if (scheduleToEdit) {
        await updateDoc(doc(db, 'schedules', scheduleToEdit.id), scheduleData);
      } else {
        await addDoc(collection(db, 'schedules'), {
          ...scheduleData,
          createdAt: serverTimestamp()
        });
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving schedule:', error);
      onError?.('Erro ao salvar escala.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-900">
                {scheduleToEdit ? 'Editar Escala' : 'Nova Escala'}
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Evento
                  </label>
                  <select
                    required
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  >
                    <option value="">Selecione um evento</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Funções e Voluntários
                  </label>
                  <button
                    type="button"
                    onClick={handleAddRole}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                  >
                    <Plus size={16} /> Adicionar Função
                  </button>
                </div>
                
                <div className="space-y-4">
                  {roles.map((role, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex-1 space-y-4">
                        <div>
                          <input
                            type="text"
                            placeholder="Nome da Função (ex: Louvor, Recepção)"
                            required
                            value={role.roleName}
                            onChange={(e) => handleRoleChange(index, 'roleName', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <select
                            required
                            value={role.userId}
                            onChange={(e) => handleRoleChange(index, 'userId', e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                          >
                            <option value="">Selecione um voluntário</option>
                            {members.map(member => (
                              <option key={member.uid} value={member.uid}>{member.displayName}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-1"
                        disabled={roles.length === 1}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar Escala'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
