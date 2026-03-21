import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  User as UserIcon, Mail, Camera, Save, 
  LogOut, Shield, Bell, Globe, CheckCircle2,
  ChevronRight, AlertCircle, Trash2
} from 'lucide-react';
import { updateProfile, User } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { UserProfile } from '../../types';

export default function ProfilePage() {
  const { user, userProfile, handleLogout } = useOutletContext<{ 
    user: User | null; 
    userProfile: UserProfile | null;
    handleLogout: () => void;
  }>();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      // Update Auth Profile
      await updateProfile(user, {
        displayName,
        photoURL
      });

      // Update Firestore Profile
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        photoURL,
        updatedAt: serverTimestamp()
      });

      showToast('Perfil atualizado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      showToast('Erro ao atualizar perfil', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
          <UserIcon size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Seu Perfil</h2>
        <p className="text-slate-500 max-w-sm">
          Faça login para gerenciar sua conta e configurações.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-24 left-1/2 z-50"
        >
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border ${
            toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-red-500 border-red-400 text-white'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </motion.div>
      )}

      <header>
        <h2 className="text-2xl font-bold text-slate-900">Meu Perfil</h2>
        <p className="text-slate-500">Gerencie suas informações e preferências.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl bg-indigo-50 border-2 border-indigo-100 overflow-hidden flex items-center justify-center">
                  {photoURL ? (
                    <img src={photoURL} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon size={40} className="text-indigo-300" />
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600 transition-colors">
                  <Camera size={16} />
                </button>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900">{displayName || 'Usuário'}</h3>
                <p className="text-sm text-slate-500">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                  <Shield size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Membro Verificado</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="email"
                    value={user.email || ''}
                    disabled
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 outline-none cursor-not-allowed text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">URL da Foto</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save size={18} /> Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Configurações da Conta</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-white group-hover:text-indigo-600 transition-all">
                    <Bell size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 text-sm">Notificações</h4>
                    <p className="text-xs text-slate-400">Gerencie alertas e lembretes</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </button>
              <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-white group-hover:text-indigo-600 transition-all">
                    <Shield size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 text-sm">Privacidade</h4>
                    <p className="text-xs text-slate-400">Controle quem vê seus posts</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Sua Igreja</h3>
            {userProfile?.churchId ? (
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Igreja Atual</p>
                  <p className="text-sm font-bold text-indigo-900">Igreja Batista Central</p>
                </div>
                <button className="w-full py-3 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                  Trocar de Igreja
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-sm text-slate-500">Você ainda não está vinculado a uma igreja.</p>
                <button className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all">
                  Vincular Igreja
                </button>
              </div>
            )}
          </div>

          <div className="bg-red-50 p-8 rounded-3xl border border-red-100 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-red-900">Zona de Perigo</h3>
              <p className="text-xs text-red-600">Ações irreversíveis para sua conta.</p>
            </div>
            <div className="space-y-3">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white text-red-600 border border-red-200 rounded-2xl font-bold hover:bg-red-100 transition-all"
              >
                <LogOut size={18} /> Sair da Conta
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-3 text-red-400 hover:text-red-600 text-xs font-bold uppercase tracking-widest transition-colors">
                <Trash2 size={14} /> Excluir Minha Conta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
