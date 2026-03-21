import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, ShieldCheck, ArrowLeftRight, 
  LayoutDashboard, Sparkles, ChevronRight
} from 'lucide-react';
import { UserProfile } from '../types';

interface EnvironmentSwitcherProps {
  userProfile: UserProfile | null;
}

export default function EnvironmentSwitcher({ userProfile }: EnvironmentSwitcherProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  // Only show for admin, pastor, or leader
  const canSwitch = userProfile && (
    userProfile.role === 'admin' || 
    userProfile.role === 'pastor' || 
    userProfile.role === 'leader'
  );

  if (!canSwitch) return null;

  const isApp = location.pathname.startsWith('/app');
  const isAdmin = location.pathname.startsWith('/church-admin');

  return (
    <div className="relative">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute top-full right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-[110]"
          >
            <div className="p-5 bg-indigo-600 text-white">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-xl">
                  <ArrowLeftRight size={20} />
                </div>
                <h3 className="font-bold">Alternar Ambiente</h3>
              </div>
              <p className="text-xs text-indigo-100">Mude rapidamente entre a visão de membro e o painel de gestão.</p>
            </div>

            <div className="p-4 space-y-2">
              <button
                onClick={() => { navigate('/app'); setIsOpen(false); }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                  isApp ? 'bg-indigo-50 border-2 border-indigo-200' : 'hover:bg-slate-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isApp ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Users size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Modo Interativo</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">App do Membro</p>
                  </div>
                </div>
                {isApp && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
              </button>

              <button
                onClick={() => { navigate('/church-admin'); setIsOpen(false); }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                  isAdmin ? 'bg-indigo-50 border-2 border-indigo-200' : 'hover:bg-slate-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <LayoutDashboard size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">Modo Administrativo</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Gestão da Igreja</p>
                  </div>
                </div>
                {isAdmin && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <ShieldCheck size={12} /> Acesso: {userProfile?.role}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all transform hover:scale-105 active:scale-95 ${
          isOpen ? 'bg-slate-900 text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <ChevronRight size={24} className="rotate-90" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <ArrowLeftRight size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
