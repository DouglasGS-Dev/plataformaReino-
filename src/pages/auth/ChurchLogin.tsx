import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Church as ChurchIcon, Mail, Lock, ArrowRight, 
  ShieldCheck, Sparkles, AlertCircle, CheckCircle2,
  Building2, Globe, Users
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Logo } from '../../components/Logo';

const MASTER_ADMIN_EMAIL = "douglassousa95475@gmail.com";

export default function ChurchLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const checkAdminAccess = async (user: any) => {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    let userData = userDoc.data();
    
    // Auto-provision Master Admin if it's the first time
    if (!userData && user.email === MASTER_ADMIN_EMAIL) {
      const newProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Master Admin',
        photoURL: user.photoURL || '',
        role: 'admin',
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', user.uid), newProfile);
      userData = newProfile;
    }

    const isAdmin = userData && (userData.role === 'admin' || userData.role === 'pastor' || userData.role === 'leader');
    const isMaster = user.email === MASTER_ADMIN_EMAIL;

    if (isAdmin || isMaster) {
      // If it's master but role isn't admin, update it
      if (isMaster && userData?.role !== 'admin') {
        await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
      }
      setSuccess(true);
      setTimeout(() => navigate('/church-admin'), 1500);
      return true;
    } else {
      setError('Acesso restrito. Esta conta não possui permissões administrativas.');
      await auth.signOut();
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetSent(false);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await checkAdminAccess(userCredential.user);
    } catch (err: any) {
      console.error(err);
      setError('E-mail ou senha incorretos. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor, insira seu e-mail para redefinir a senha.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      setError('Erro ao enviar e-mail de redefinição. Verifique o endereço digitado.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await checkAdminAccess(result.user);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setError('O pop-up de login foi bloqueado pelo navegador. Por favor, permita pop-ups para este site.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('O login foi cancelado.');
      } else {
        setError(`Falha na autenticação: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Side: Branding & Info */}
      <div className="lg:w-1/2 primary-gradient p-12 lg:p-24 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-100 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="inline-block mb-12">
            <Logo className="w-20 h-20" showText={true} stacked={true} />
          </Link>

          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              Gestão Ministerial <br />
              <span className="text-white/80 italic serif font-normal">em um só lugar.</span>
            </h1>
            <p className="text-white/90 text-lg leading-relaxed">
              Acesse o painel administrativo da sua igreja para gerenciar membros, ministérios, finanças e muito mais.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-8 mt-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-widest">
              <Building2 size={16} /> Multi-Tenant
            </div>
            <p className="text-white/60 text-xs">Ambiente isolado e seguro para sua congregação.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-widest">
              <Users size={16} /> Discipulado
            </div>
            <p className="text-white/60 text-xs">Acompanhe o crescimento espiritual de cada membro.</p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-white">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-8"
        >
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">Login Administrativo</h2>
            <p className="text-slate-500">Entre com suas credenciais de líder ou pastor.</p>
          </div>

          <div className="space-y-4">
            {error && (
              <div 
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm"
                translate="no"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div 
                className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-600 text-sm"
                translate="no"
              >
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <span>Login realizado com sucesso! Redirecionando...</span>
              </div>
            )}

            {resetSent && (
              <div 
                className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-start gap-3 text-primary text-sm"
                translate="no"
              >
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <span>E-mail de redefinição enviado! Verifique sua caixa de entrada.</span>
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">E-mail Institucional</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pastor@igreja.com"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Senha</label>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-primary hover:text-primary/80"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || success}
              className="w-full py-4 primary-gradient text-white rounded-2xl font-bold hover:brightness-110 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Acessar Painel <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-bold">Ou entre com</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading || success}
            className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Google Workspace
          </button>

          <p className="text-center text-sm text-slate-500">
            Ainda não tem uma conta para sua igreja? <br />
            <Link to="/register" className="text-primary font-bold hover:underline">Cadastre sua igreja aqui</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
