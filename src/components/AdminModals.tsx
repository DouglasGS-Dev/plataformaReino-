import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Users, CheckCircle2, Copy, Plus, Trash2, AlertCircle } from 'lucide-react';
import { BaseModal } from './BaseModal';
import { collection, addDoc, updateDoc, doc, setDoc, serverTimestamp, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Ministry, Cell, Event, FinancialTransaction, UserProfile, MinistrySchedule } from '../types';
import { toast } from 'sonner';

interface ModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  churchId: string;
  item?: T;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

// BaseModal is now imported from its own file

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
    if (!name || !leaderName) {
      toast.error("Por favor, preencha o nome e o líder.");
      return;
    }

    if (!churchId) {
      toast.error("ID da igreja não encontrado. Por favor, faça login novamente.");
      return;
    }

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
        toast.success("Ministério atualizado com sucesso!");
      } else {
        await addDoc(collection(db, 'ministries'), {
          name,
          leaderName,
          description,
          churchId,
          memberCount: 0,
          createdAt: serverTimestamp(),
        });
        toast.success("Ministério criado com sucesso!");
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving ministry:", error);
      const message = error.code === 'permission-denied' 
        ? "Você não tem permissão para realizar esta ação." 
        : "Erro ao salvar ministério. Tente novamente.";
      toast.error(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Ministério' : 'Novo Ministério'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Ministério</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
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
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            placeholder="Nome do responsável"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all h-24 resize-none"
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
            className="flex-1 primary-gradient text-white py-2 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {item ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export const CellModal: React.FC<ModalProps<Cell>> = ({ isOpen, onClose, churchId, item, onSuccess, onError }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'reports'>('info');
  const [name, setName] = useState(item?.name || '');
  const [leaderName, setLeaderName] = useState(item?.leaderName || '');
  const [host, setHost] = useState(item?.host || '');
  const [meetingDay, setMeetingDay] = useState(item?.meetingDay || 'Quarta-feira');
  const [meetingTime, setMeetingTime] = useState(item?.meetingTime || '20:00');
  const [address, setAddress] = useState(item?.address || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (item) {
      setName(item.name);
      setLeaderName(item.leaderName || '');
      setHost(item.host || '');
      setMeetingDay(item.meetingDay || 'Quarta-feira');
      setMeetingTime(item.meetingTime || '20:00');
      setAddress(item.address || '');
    } else {
      setName('');
      setLeaderName('');
      setHost('');
      setMeetingDay('Quarta-feira');
      setMeetingTime('20:00');
      setAddress('');
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !leaderName) {
      toast.error("Por favor, preencha o nome e o líder.");
      return;
    }

    if (!churchId) {
      toast.error("ID da igreja não encontrado. Por favor, faça login novamente.");
      return;
    }

    setLoading(true);
    try {
      if (item?.id) {
        await updateDoc(doc(db, 'cells', item.id), {
          name,
          leaderName,
          host,
          meetingDay,
          meetingTime,
          address,
          churchId,
          updatedAt: serverTimestamp(),
        });
        toast.success("Célula atualizada com sucesso!");
      } else {
        await addDoc(collection(db, 'cells'), {
          name,
          leaderName,
          host,
          meetingDay,
          meetingTime,
          address,
          churchId,
          memberCount: 0,
          createdAt: serverTimestamp(),
        });
        toast.success("Célula criada com sucesso!");
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving cell:", error);
      const message = error.code === 'permission-denied' 
        ? "Você não tem permissão para realizar esta ação." 
        : "Erro ao salvar célula. Tente novamente.";
      toast.error(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Célula' : 'Nova Célula'}
      maxWidth="max-w-lg"
    >
      <div className="flex border-b border-slate-100">
        <button onClick={() => setActiveTab('info')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'info' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}>Dados</button>
        <button onClick={() => setActiveTab('members')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'members' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}>Membros</button>
        <button onClick={() => setActiveTab('reports')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'reports' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}>Relatórios</button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {activeTab === 'info' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Célula</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
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
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="Nome do líder"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Anfitrião</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Nome do anfitrião"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dia</label>
                <select
                  value={meetingDay}
                  onChange={(e) => setMeetingDay(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
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
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="Local da reunião"
              />
            </div>
          </>
        )}
        {activeTab === 'members' && (
          <div className="text-center py-8 text-slate-500">Funcionalidade de membros em breve.</div>
        )}
        {activeTab === 'reports' && (
          <div className="text-center py-8 text-slate-500">Funcionalidade de relatórios em breve.</div>
        )}

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
            className="flex-1 primary-gradient text-white py-2 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {item ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </BaseModal>
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
    if (!title || !date) {
      toast.error("Por favor, preencha o título e a data.");
      return;
    }

    if (!churchId) {
      toast.error("ID da igreja não encontrado. Por favor, faça login novamente.");
      return;
    }

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
        toast.success("Evento atualizado com sucesso!");
      } else {
        await addDoc(collection(db, 'events'), {
          title,
          date,
          location,
          description,
          churchId,
          createdAt: serverTimestamp(),
        });
        toast.success("Evento criado com sucesso!");
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving event:", error);
      const message = error.code === 'permission-denied' 
        ? "Você não tem permissão para realizar esta ação." 
        : "Erro ao salvar evento. Tente novamente.";
      toast.error(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Evento' : 'Novo Evento'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título do Evento</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
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
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Local</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            placeholder="Ex: Templo Principal"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all h-24 resize-none"
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
            className="flex-1 primary-gradient text-white py-2 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {item ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </BaseModal>
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
    if (!description || !amount) {
      toast.error("Por favor, preencha a descrição e o valor.");
      return;
    }

    if (!churchId) {
      toast.error("ID da igreja não encontrado. Por favor, faça login novamente.");
      return;
    }

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
        toast.success("Transação atualizada com sucesso!");
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
        toast.success("Transação registrada com sucesso!");
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      const message = error.code === 'permission-denied' 
        ? "Você não tem permissão para realizar esta ação." 
        : "Erro ao salvar transação. Tente novamente.";
      toast.error(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Transação' : 'Nova Transação'}
      maxWidth="max-w-md"
    >
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
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
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
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
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
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
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
            className={`flex-1 primary-gradient text-white py-2 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 ${
              type === 'income' ? 'from-emerald-600 to-emerald-500 shadow-emerald-500/20' : 'from-red-600 to-red-500 shadow-red-500/20'
            }`}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {item ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export const MemberModal: React.FC<ModalProps<UserProfile>> = ({ isOpen, onClose, churchId, item, onSuccess, onError }) => {
  const [displayName, setDisplayName] = useState(item?.displayName || '');
  const [email, setEmail] = useState(item?.email || '');
  const [role, setRole] = useState(item?.role || 'user');
  const [status, setStatus] = useState(item?.status || 'active');
  const [tags, setTags] = useState(item?.tags?.join(', ') || '');
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && !item && churchId) {
      // Fetch church invite code for invite mode
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
    } else if (item) {
      setDisplayName(item.displayName || '');
      setEmail(item.email || '');
      setRole(item.role || 'user');
      setStatus(item.status || 'active');
      setTags(item.tags?.join(', ') || '');
    } else {
      setDisplayName('');
      setEmail('');
      setRole('user');
      setStatus('active');
      setTags('');
    }
  }, [item, isOpen, churchId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return; // Invite mode doesn't submit a form
    
    if (!churchId) {
      toast.error("ID da igreja não encontrado. Por favor, faça login novamente.");
      return;
    }

    setLoading(true);
    try {
      if (item?.uid) {
        await updateDoc(doc(db, 'users', item.uid), {
          displayName,
          email,
          role,
          status,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
          updatedAt: serverTimestamp(),
        });
        toast.success("Membro atualizado com sucesso!");
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving member:", error);
      const message = error.code === 'permission-denied' 
        ? "Você não tem permissão para realizar esta ação." 
        : "Erro ao salvar membro. Tente novamente.";
      toast.error(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Membro' : 'Convidar Membros'}
      maxWidth="max-w-md"
    >
      {!item ? (
        <div className="p-6 space-y-6 text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
            <Users size={32} />
          </div>
          
          <div>
            <h4 className="font-bold text-slate-800 text-lg">Código de Convite</h4>
            <p className="text-sm text-slate-500 mt-1">
              Compartilhe este código com os membros da sua igreja para que eles possam se conectar ao seu ambiente.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative">
            <div className="text-4xl font-mono font-bold tracking-widest text-primary">
              {inviteCode || '...'}
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="w-full primary-gradient text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
            {copied ? 'Código Copiado!' : 'Copiar Código'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Função</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="user">Membro</option>
                <option value="leader">Líder</option>
                <option value="pastor">Pastor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="visitor">Visitante</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tags (separadas por vírgula)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="Ex: Batizado, Célula A, Voluntário"
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
              className="flex-1 primary-gradient text-white py-2 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Atualizar
            </button>
          </div>
        </form>
      )}
    </BaseModal>
  );
};

export const AddEBDTrackModal: React.FC<ModalProps<any>> = ({ isOpen, onClose, churchId, item, onSuccess, onError }) => {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [order, setOrder] = useState(item?.order?.toString() || '0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || '');
      setOrder(item.order.toString());
    } else {
      setName('');
      setDescription('');
      setOrder('0');
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Por favor, preencha o nome da trilha.");
      return;
    }

    if (!churchId) {
      toast.error("ID da igreja não encontrado. Por favor, faça login novamente.");
      return;
    }

    setLoading(true);
    try {
      const data = {
        name,
        description,
        order: parseInt(order),
        churchId,
        updatedAt: serverTimestamp(),
      };

      if (item?.id) {
        await updateDoc(doc(db, 'ebd_tracks', item.id), data);
        toast.success("Trilha atualizada com sucesso!");
      } else {
        await addDoc(collection(db, 'ebd_tracks'), {
          ...data,
          createdAt: serverTimestamp(),
        });
        toast.success("Trilha criada com sucesso!");
      }
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error saving EBD track:", error);
      const message = error.code === 'permission-denied' 
        ? "Você não tem permissão para realizar esta ação." 
        : "Erro ao salvar trilha. Tente novamente.";
      toast.error(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Trilha' : 'Nova Trilha'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Trilha</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="Ex: Fundamentos da Fé, Discipulado"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ordem</label>
          <input
            type="number"
            required
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
            placeholder="Breve descrição da trilha..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
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
            className="px-6 py-2.5 primary-gradient text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Salvando...' : 'Salvar Trilha'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export const AddEBDClassModal: React.FC<ModalProps<any>> = ({ isOpen, onClose, churchId, item, onSuccess, onError }) => {
  const [name, setName] = useState(item?.name || '');
  const [teacherId, setTeacherId] = useState(item?.teacherId || '');
  const [teacherName, setTeacherName] = useState(item?.teacherName || '');
  const [category, setCategory] = useState(item?.category || 'Adultos');
  const [description, setDescription] = useState(item?.description || '');
  const [courseId, setCourseId] = useState(item?.courseId || '');
  const [courses, setCourses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && churchId) {
      const qCourses = query(collection(db, 'ebd_courses'), where('churchId', '==', churchId), orderBy('name'));
      getDocs(qCourses).then(snapshot => {
        setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      const qUsers = query(collection(db, 'users'), where('churchId', '==', churchId));
      getDocs(qUsers).then(snapshot => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }
  }, [isOpen, churchId]);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setTeacherId(item.teacherId || '');
      setTeacherName(item.teacherName || '');
      setCategory(item.category);
      setDescription(item.description || '');
      setCourseId(item.courseId || '');
    } else {
      setName('');
      setTeacherId('');
      setTeacherName('');
      setCategory('Adultos');
      setDescription('');
      setCourseId('');
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedTeacher = users.find(u => u.id === teacherId);
      const data = {
        name,
        teacherId,
        teacherName: selectedTeacher ? selectedTeacher.displayName : teacherName,
        category,
        description,
        courseId,
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
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Classe' : 'Nova Classe'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Curso (Opcional)</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">Nenhum curso</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Classe</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="Ex: Casais, Jovens, Discipulado"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Professor Responsável</label>
          <select
            required
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">Selecione um professor</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.displayName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
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
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
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
            className="flex-1 primary-gradient text-white py-2 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {item ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export const AddEBDCourseModal: React.FC<ModalProps<any>> = ({ isOpen, onClose, churchId, item, onSuccess, onError }) => {
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        name,
        description,
        churchId,
        updatedAt: serverTimestamp(),
      };

      if (item?.id) {
        await updateDoc(doc(db, 'ebd_courses', item.id), data);
      } else {
        await addDoc(collection(db, 'ebd_courses'), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving EBD course:", error);
      onError?.("Erro ao salvar curso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Curso' : 'Novo Curso'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Curso</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="Ex: Maturidade Cristã, Liderança"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
            placeholder="Breve descrição do curso..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
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
            className="px-6 py-2.5 primary-gradient text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Salvando...' : 'Salvar Curso'}
          </button>
        </div>
      </form>
    </BaseModal>
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
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={scheduleToEdit ? 'Editar Escala' : 'Nova Escala'}
      maxWidth="max-w-2xl"
    >
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
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
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <select
                      required
                      value={role.userId}
                      onChange={(e) => handleRoleChange(index, 'userId', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
            className="px-6 py-2.5 primary-gradient text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Escala'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export const AddEBDLessonModal: React.FC<ModalProps<any> & { classId: string }> = ({ isOpen, onClose, classId, item, onSuccess, onError }) => {
  const [title, setTitle] = useState(item?.title || '');
  const [content, setContent] = useState(item?.content || '');
  const [videoUrl, setVideoUrl] = useState(item?.videoUrl || '');
  const [order, setOrder] = useState(item?.order?.toString() || '0');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setContent(item.content);
      setVideoUrl(item.videoUrl || '');
      setOrder(item.order.toString());
    } else {
      setTitle('');
      setContent('');
      setVideoUrl('');
      setOrder('0');
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        title,
        content,
        videoUrl,
        order: parseInt(order),
        classId,
        updatedAt: serverTimestamp(),
      };

      if (item?.id) {
        await updateDoc(doc(db, `ebd_classes/${classId}/lessons`, item.id), data);
      } else {
        await addDoc(collection(db, `ebd_classes/${classId}/lessons`), {
          ...data,
          createdAt: serverTimestamp(),
        });
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving EBD lesson:", error);
      onError?.("Erro ao salvar lição.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar Lição' : 'Nova Lição'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título da Lição</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            placeholder="Ex: Introdução ao Pentateuco"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Ordem</label>
          <input
            type="number"
            required
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">URL do Vídeo (Opcional)</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
            placeholder="https://youtube.com/..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Conteúdo (Markdown)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none h-32 resize-none"
            placeholder="Escreva o conteúdo da lição..."
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
            className="flex-1 primary-gradient text-white py-2 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {item ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};
