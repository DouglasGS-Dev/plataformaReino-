import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  User as UserIcon, Mail, Camera, Save, 
  LogOut, Shield, Bell, CheckCircle2,
  ChevronRight, AlertCircle, Trash2, Upload,
  Church as ChurchIcon
} from 'lucide-react';
import { updateProfile, User } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, handleFirestoreError, OperationType } from '../../firebase';
import { UserProfile, Church } from '../../types';
import JoinChurchModal from '../../components/JoinChurchModal';

export default function ProfilePage() {
  const { user, userProfile, handleLogout } = useOutletContext<{ 
    user: User | null; 
    userProfile: UserProfile | null;
    handleLogout: () => void;
  }>();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [churchInfo, setChurchInfo] = useState<Church | null>(null);
  const [loadingChurch, setLoadingChurch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  useEffect(() => {
    if (!userProfile?.churchId) {
      setChurchInfo(null);
      return;
    }

    const fetchChurch = async () => {
      setLoadingChurch(true);
      try {
        const churchDoc = await getDoc(doc(db, 'churches', userProfile.churchId!));
        if (churchDoc.exists()) {
          setChurchInfo({
            id: churchDoc.id,
            ...churchDoc.data()
          } as Church);
        } else {
          setChurchInfo(null);
        }
      } catch (err) {
        console.error('Error fetching church in profile:', err);
      } finally {
        setLoadingChurch(false);
      }
    };

    fetchChurch();
  }, [userProfile?.churchId]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione uma imagem válida.', 'error');
      return;
    }

    setIsUploading(true);
    
    try {
      // Create a FileReader to read the image
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          // Resize image using canvas
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Get compressed base64 string
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setPhotoURL(dataUrl);
          setIsUploading(false);
          showToast('Imagem carregada com sucesso! Clique em Salvar Alterações.');
          
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        };
        
        img.onerror = () => {
          setIsUploading(false);
          showToast('Erro ao processar a imagem.', 'error');
        };
      };
      
      reader.onerror = () => {
        setIsUploading(false);
        showToast('Erro ao ler o arquivo.', 'error');
      };
    } catch (error) {
      console.error('Error processing image:', error);
      setIsUploading(false);
      showToast('Erro ao processar a imagem.', 'error');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    let finalPhotoURL = photoURL;

    try {
      // 1. Upload photo if it's a base64 string
      if (photoURL && photoURL.startsWith('data:image/')) {
        console.log('Uploading photo...');
        const storageRef = ref(storage, `users/${user.uid}/profile.jpg`);
        await uploadString(storageRef, photoURL, 'data_url');
        finalPhotoURL = await getDownloadURL(storageRef);
        console.log('Photo uploaded. URL:', finalPhotoURL);
      }

      // Update Auth Profile
      try {
        console.log('Updating auth profile with photoURL:', finalPhotoURL);
        // Firebase Auth photoURL limit is 2000 characters
        if (finalPhotoURL && finalPhotoURL.length > 2000) {
          console.warn('Photo URL too long for Auth profile, skipping Auth update.');
        } else {
          await updateProfile(user, {
            displayName,
            photoURL: finalPhotoURL
          });
          console.log('Auth profile updated.');
        }
      } catch (authError: any) {
        console.warn('Auth profile update failed, but continuing to Firestore:', authError);
        // If it fails due to URL length, we might still want to update Firestore
      }

      // Update Firestore Profile
      console.log('Updating firestore profile...');
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        photoURL: finalPhotoURL,
        updatedAt: serverTimestamp()
      });
      console.log('Firestore profile updated.');

      showToast('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error in handleSave:', error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      showToast('Erro ao atualizar perfil', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="w-20 h-20 bg-primary-50 text-primary rounded-full flex items-center justify-center mb-6">
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
                <div className="w-24 h-24 rounded-3xl bg-primary-50 border-2 border-primary-100 overflow-hidden flex items-center justify-center relative">
                  {isUploading ? (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : null}
                  {photoURL ? (
                    <img src={photoURL} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UserIcon size={40} className="text-primary-300" />
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl border border-slate-200 shadow-sm text-slate-500 hover:text-primary transition-colors disabled:opacity-50"
                  title="Alterar foto"
                >
                  <Camera size={16} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
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
                    className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
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

            <div className="pt-6 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
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
                  <div className="p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-white group-hover:text-primary transition-all">
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
                  <div className="p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-white group-hover:text-primary transition-all">
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Sua Igreja</h3>
              <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary flex items-center justify-center">
                <ChurchIcon size={18} />
              </div>
            </div>

            {userProfile?.churchId ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary-50/70 rounded-2xl border border-primary-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Igreja Conectada</p>
                    {churchInfo?.inviteCode && (
                      <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded text-primary border border-primary-200">
                        Código: {churchInfo.inviteCode}
                      </span>
                    )}
                  </div>
                  <p className="text-base font-bold text-primary-950">
                    {loadingChurch ? 'Carregando congregação...' : (churchInfo?.name || 'Igreja Vinculada')}
                  </p>
                  {churchInfo?.address && (
                    <p className="text-xs text-slate-500">{churchInfo.address}</p>
                  )}
                </div>

                <button 
                  onClick={() => setIsJoinModalOpen(true)}
                  className="w-full py-3 text-sm font-bold text-slate-600 hover:text-primary bg-slate-50 hover:bg-primary-50/50 rounded-2xl border border-slate-200 hover:border-primary-200 transition-all"
                >
                  Trocar de Igreja
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 py-2">
                <p className="text-sm text-slate-500">
                  Você ainda não está vinculado a uma igreja no REINO.
                </p>
                <button 
                  onClick={() => setIsJoinModalOpen(true)}
                  className="w-full py-3.5 bg-primary text-white rounded-2xl font-bold hover:bg-primary-600 transition-all shadow-md shadow-primary/25"
                >
                  Conectar a uma Igreja
                </button>
              </div>
            )}
          </div>

          <JoinChurchModal
            isOpen={isJoinModalOpen}
            onClose={() => setIsJoinModalOpen(false)}
            currentChurchId={userProfile?.churchId}
            onSuccess={(churchId, name) => {
              setChurchInfo(prev => ({
                id: churchId,
                name,
                inviteCode: '',
                ownerId: '',
                createdAt: null
              }));
            }}
          />

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
