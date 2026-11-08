import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Church, Key, Search, PlusCircle, CheckCircle2, 
  MapPin, AlertCircle, Loader2, Users, ArrowRight, ShieldCheck, Phone
} from 'lucide-react';
import { 
  collection, query, where, getDocs, doc, 
  updateDoc, addDoc, serverTimestamp, limit 
} from 'firebase/firestore';
import { toast } from 'sonner';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { BaseModal } from './BaseModal';
import { Church as ChurchType } from '../types';

interface JoinChurchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChurchId?: string;
  onSuccess?: (churchId: string, churchName: string) => void;
}

export default function JoinChurchModal({
  isOpen,
  onClose,
  currentChurchId,
  onSuccess,
}: JoinChurchModalProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'search' | 'create'>('code');

  // Code Tab state
  const [inviteCode, setInviteCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [foundChurch, setFoundChurch] = useState<ChurchType | null>(null);

  // Search Tab state
  const [searchTerm, setSearchTerm] = useState('');
  const [churchesList, setChurchesList] = useState<ChurchType[]>([]);
  const [loadingChurches, setLoadingChurches] = useState(false);

  // Create Tab state
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // General state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset state on open/close
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setFoundChurch(null);
      setInviteCode('');
      setSearchTerm('');
      if (activeTab === 'search') {
        fetchAllChurches();
      }
    }
  }, [isOpen, activeTab]);

  const fetchAllChurches = async () => {
    setLoadingChurches(true);
    setErrorMsg(null);
    try {
      const q = query(collection(db, 'churches'), limit(30));
      const snapshot = await getDocs(q);
      const list: ChurchType[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as ChurchType));
      setChurchesList(list);
    } catch (err) {
      console.error('Error fetching churches list:', err);
      handleFirestoreError(err, OperationType.LIST, 'churches');
    } finally {
      setLoadingChurches(false);
    }
  };

  // Verify invite code
  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Digite o código de convite de 6 caracteres.');
      return;
    }

    setIsVerifyingCode(true);
    setErrorMsg(null);
    setFoundChurch(null);

    try {
      const q = query(collection(db, 'churches'), where('inviteCode', '==', cleanCode));
      const snap = await getDocs(q);

      if (snap.empty) {
        setErrorMsg('Nenhuma igreja encontrada com este código de convite.');
        return;
      }

      const docSnap = snap.docs[0];
      setFoundChurch({
        id: docSnap.id,
        ...docSnap.data()
      } as ChurchType);
    } catch (err) {
      console.error('Error verifying code:', err);
      handleFirestoreError(err, OperationType.LIST, 'churches');
      setErrorMsg('Erro ao buscar igreja pelo código.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Link user to selected church
  const handleLinkToChurch = async (church: ChurchType, asRole?: 'admin' | 'user') => {
    if (!auth.currentUser) {
      toast.error('Você precisa estar autenticado para se vincular.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const updateData: Record<string, any> = {
        churchId: church.id,
        updatedAt: serverTimestamp(),
      };

      if (asRole) {
        updateData.role = asRole;
      }

      await updateDoc(userRef, updateData);

      toast.success(`Você agora faz parte da ${church.name}!`);
      if (onSuccess) {
        onSuccess(church.id, church.name);
      }
      onClose();
    } catch (err) {
      console.error('Error updating user churchId:', err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      setErrorMsg('Erro ao vincular-se à igreja. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create brand new church
  const handleCreateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setErrorMsg('Por favor, informe o nome da igreja.');
      return;
    }

    if (!auth.currentUser) {
      toast.error('Usuário não autenticado.');
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);

    try {
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const churchData: Record<string, any> = {
        name: newName.trim(),
        ownerId: auth.currentUser.uid,
        inviteCode: generatedCode,
        createdAt: serverTimestamp(),
      };

      if (newCity.trim()) churchData.address = newCity.trim();
      if (newAddress.trim()) churchData.address = newAddress.trim();
      if (newPhone.trim()) churchData.phone = newPhone.trim();

      const churchRef = await addDoc(collection(db, 'churches'), churchData);

      // Elevate creator to admin of this church
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        churchId: churchRef.id,
        role: 'admin',
        updatedAt: serverTimestamp(),
      });

      toast.success(`Igreja "${newName.trim()}" cadastrada com sucesso! Código: ${generatedCode}`);
      if (onSuccess) {
        onSuccess(churchRef.id, newName.trim());
      }
      onClose();
    } catch (err) {
      console.error('Error creating church:', err);
      handleFirestoreError(err, OperationType.CREATE, 'churches');
      setErrorMsg('Erro ao cadastrar a igreja. Verifique os dados e tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  // Filtered churches in Search Tab
  const filteredChurches = churchesList.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(term) ||
      c.address?.toLowerCase().includes(term) ||
      c.inviteCode?.toLowerCase().includes(term)
    );
  });

  return (
    <BaseModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Conectar a uma Igreja"
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => { setActiveTab('code'); setErrorMsg(null); }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'code'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Key size={14} />
            <span>Código</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('search'); setErrorMsg(null); fetchAllChurches(); }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'search'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Search size={14} />
            <span>Buscar</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('create'); setErrorMsg(null); }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'create'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <PlusCircle size={14} />
            <span>Nova Igreja</span>
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100"
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {/* TAB 1: INVITE CODE */}
        {activeTab === 'code' && (
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900">Código de Convite</h4>
              <p className="text-xs text-slate-500">
                Insira o código de 6 caracteres fornecido pela liderança da sua igreja.
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="EX: A1B2C3"
                  className="w-full text-center text-2xl font-mono uppercase tracking-widest py-3.5 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-primary focus:bg-white focus:outline-none transition-all placeholder:text-slate-300 font-bold"
                  disabled={isVerifyingCode || isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingCode || !inviteCode.trim() || inviteCode.length < 4}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isVerifyingCode ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Buscando Igreja...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Localizar Igreja
                  </>
                )}
              </button>
            </form>

            {/* Found Church Card */}
            <AnimatePresence>
              {foundChurch && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-5 bg-primary-50/50 border border-primary-200/60 rounded-2xl space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
                      <Church size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-white px-2 py-0.5 rounded-full border border-primary-100">
                          Código Válido
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-1">{foundChurch.name}</h4>
                      {foundChurch.address && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} />
                          {foundChurch.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleLinkToChurch(foundChurch, 'user')}
                    disabled={isSubmitting}
                    className="w-full py-3 bg-primary hover:bg-primary-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-primary/25 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        Confirmar Vínculo a Esta Igreja
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* TAB 2: SEARCH CHURCHES DIRECTORY */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, cidade ou código..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-colors"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2.5 pr-1">
              {loadingChurches ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <span className="text-xs">Carregando igrejas cadastradas...</span>
                </div>
              ) : filteredChurches.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-1">
                  <Church size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Nenhuma igreja encontrada</p>
                  <p className="text-xs text-slate-400">
                    Tente outro termo ou cadastre sua congregação na aba "Nova Igreja".
                  </p>
                </div>
              ) : (
                filteredChurches.map((church) => {
                  const isCurrent = church.id === currentChurchId;
                  return (
                    <div
                      key={church.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'border-emerald-300 bg-emerald-50/60'
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isCurrent ? 'bg-emerald-600 text-white' : 'bg-primary-50 text-primary'
                        }`}>
                          <Church size={18} />
                        </div>
                        <div className="truncate">
                          <h5 className="font-bold text-sm text-slate-800 truncate">{church.name}</h5>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {church.address ? (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin size={10} />
                                {church.address}
                              </span>
                            ) : (
                              <span>Comunidade REINO</span>
                            )}
                            {church.inviteCode && (
                              <span className="font-mono text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                                {church.inviteCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="shrink-0 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={12} />
                          Atual
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleLinkToChurch(church, 'user')}
                          disabled={isSubmitting}
                          className="shrink-0 py-1.5 px-3 bg-white hover:bg-primary hover:text-white text-slate-700 border border-slate-200 hover:border-primary text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                        >
                          {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : 'Vincular'}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CREATE NEW CHURCH (FOR PASTORS / LEADERS) */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateChurch} className="space-y-4">
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900">Cadastrar Nova Igreja</h4>
              <p className="text-xs text-slate-500">
                Você será definido como Administrador e poderá gerenciar membros e ministérios.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome da Igreja *
                </label>
                <div className="relative">
                  <Church className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Igreja Batista Renovada"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cidade / UF
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder="Ex: Curitiba - PR"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    WhatsApp / Telefone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="Ex: (41) 99999-9999"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Endereço / Bairro (Opcional)
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Ex: Av. Principal, 1000 - Centro"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-primary focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="p-3 bg-primary-50/60 rounded-xl border border-primary-100 flex items-start gap-2.5">
                <ShieldCheck className="text-primary mt-0.5 shrink-0" size={18} />
                <p className="text-xs text-primary-900 leading-relaxed">
                  Um código de convite exclusivo será gerado automaticamente para você compartilhar com membros e líderes.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating || !newName.trim()}
              className="w-full py-3 bg-primary hover:bg-primary-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-primary/25 transition-all disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Cadastrando Igreja...
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  Criar Igreja e Tornar-se Administrador
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </BaseModal>
  );
}
