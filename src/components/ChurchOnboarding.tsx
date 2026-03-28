import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, CheckCircle2, ArrowRight, Loader2, Users, Key, ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';
import { db, auth } from '../firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

interface ChurchOnboardingProps {
  onComplete: (churchId: string) => void;
}

const ChurchOnboarding: React.FC<ChurchOnboardingProps> = ({ onComplete }) => {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [churchName, setChurchName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateChurch = async () => {
    if (!churchName.trim()) {
      setError('Por favor, insira o nome da igreja.');
      return;
    }

    if (!auth.currentUser) {
      setError('Usuário não autenticado.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Create the church document
      const churchData = {
        name: churchName.trim(),
        ownerId: auth.currentUser.uid,
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        createdAt: serverTimestamp(),
      };

      const churchRef = await addDoc(collection(db, 'churches'), churchData);

      // 2. Update the user's profile with the new churchId and admin role
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        churchId: churchRef.id,
        role: 'admin',
      });

      onComplete(churchRef.id);
    } catch (err: any) {
      console.error('Error creating church:', err);
      setError(err.message || 'Erro ao criar a igreja. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChurch = async () => {
    if (!inviteCode.trim()) {
      setError('Por favor, insira o código de convite.');
      return;
    }

    if (!auth.currentUser) {
      setError('Usuário não autenticado.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Find church by invite code
      const churchesRef = collection(db, 'churches');
      const q = query(churchesRef, where('inviteCode', '==', inviteCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Código de convite inválido ou igreja não encontrada.');
        setIsLoading(false);
        return;
      }

      const churchDoc = querySnapshot.docs[0];
      const churchId = churchDoc.id;

      // Update user profile
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        churchId: churchId,
        role: 'member', // Default role for joined users
      });

      onComplete(churchId);
    } catch (err: any) {
      console.error('Error joining church:', err);
      setError(err.message || 'Erro ao entrar na igreja. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'select') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6 overflow-y-auto">
        <div className="max-w-md w-full space-y-8 text-center py-12">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto">
            <Logo className="w-12 h-12" showText={false} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">Bem-vindo ao REINO</h1>
            <p className="text-slate-500">Como você deseja começar?</p>
          </div>

          <div className="space-y-4 mt-8">
            <button
              onClick={() => { setMode('create'); setError(null); }}
              className="w-full p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Sou Pastor / Líder</h3>
                <p className="text-sm text-slate-500 mt-1">Quero cadastrar minha igreja e gerenciar a comunidade.</p>
              </div>
            </button>

            <button
              onClick={() => { setMode('join'); setError(null); }}
              className="w-full p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Sou Membro</h3>
                <p className="text-sm text-slate-500 mt-1">Tenho um código de convite e quero entrar na minha igreja.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-md w-full space-y-8 text-center py-12">
        <button 
          onClick={() => setMode('select')}
          className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto">
          {mode === 'create' ? <Logo className="w-12 h-12" showText={false} /> : <Key size={40} />}
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">
            {mode === 'create' ? 'Criar Nova Igreja' : 'Entrar na Igreja'}
          </h1>
          <p className="text-slate-500">
            {mode === 'create' ? 'Vamos configurar o ambiente para sua comunidade' : 'Insira o código fornecido pela sua liderança'}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm text-left border border-red-100">
            {error}
          </div>
        )}

        {mode === 'create' ? (
          <div className="space-y-4 text-left">
            <div>
              <label htmlFor="churchName" className="block text-sm font-medium text-slate-700 mb-1">
                Nome da Igreja
              </label>
              <input
                type="text"
                id="churchName"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                placeholder="Ex: Igreja Batista Central"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors"
                disabled={isLoading}
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3 mt-6">
              <CheckCircle2 className="text-primary mt-1" size={20} />
              <div>
                <h4 className="font-bold text-slate-800">Ambiente Exclusivo</h4>
                <p className="text-sm text-slate-500">Sua igreja terá um banco de dados isolado e seguro.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
              <Shield className="text-primary mt-1" size={20} />
              <div>
                <h4 className="font-bold text-slate-800">Você será o Administrador</h4>
                <p className="text-sm text-slate-500">Controle total sobre membros, ministérios e configurações.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-slate-700 mb-1">
                Código de Convite
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Ex: A1B2C3"
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors text-center text-2xl tracking-widest font-mono uppercase"
                disabled={isLoading}
                maxLength={6}
              />
            </div>
          </div>
        )}

        <button
          onClick={mode === 'create' ? handleCreateChurch : handleJoinChurch}
          disabled={isLoading || (mode === 'create' ? !churchName.trim() : !inviteCode.trim())}
          className={`w-full py-4 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === 'create' 
              ? 'btn-primary' 
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              {mode === 'create' ? 'Criando Ambiente...' : 'Entrando...'}
            </>
          ) : (
            <>
              {mode === 'create' ? 'Criar Minha Igreja' : 'Entrar na Igreja'}
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChurchOnboarding;
