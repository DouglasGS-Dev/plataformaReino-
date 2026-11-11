import React from 'react';
import { LogIn, Mail, Shield, Sparkles, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';
import { BaseModal } from './BaseModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  loading?: boolean;
  error?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, loading, error }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
    >
      <div className="space-y-6">
        <div className="relative bg-slate-950 p-6 flex items-center justify-center overflow-hidden -mx-6 -mt-6 border-b border-white/10">
          <img 
            src="/splash-banner.jpg" 
            alt="REINO ONFIRE" 
            className="h-28 w-auto object-contain rounded-xl shadow-lg"
          />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h2>
          <p className="text-slate-500">Entre para continuar sua jornada espiritual</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm disabled:opacity-50"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400">Ou continue com</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              placeholder="E-mail"
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
            Continuar
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 px-4">
          Ao continuar, você concorda com nossos Termos de Serviço e Política de Privacidade.
        </p>
      </div>
    </BaseModal>
  );
};

export default LoginModal;
