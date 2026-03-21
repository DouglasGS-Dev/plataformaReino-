import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Network, 
  Calendar, 
  Book, 
  ShoppingBag, 
  Clock, 
  LayoutDashboard, 
  Heart, 
  PenTool, 
  BookOpen, 
  Sparkles,
  ChevronRight,
  LogOut,
  User,
  Settings,
  ShieldCheck,
  HelpCircle,
  Share2
} from 'lucide-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { motion } from 'motion/react';

export default function AppMore() {
  const navigate = useNavigate();

  const menuSections = [
    {
      title: 'Comunidade',
      items: [
        { path: '/app/social', icon: Users, label: 'Rede Social', color: 'bg-blue-100 text-blue-600' },
        { path: '/app/ministries', icon: Users, label: 'Ministérios', color: 'bg-indigo-100 text-indigo-600' },
        { path: '/app/cells', icon: Network, label: 'Células', color: 'bg-emerald-100 text-emerald-600' },
        { path: '/app/events', icon: Calendar, label: 'Eventos', color: 'bg-rose-100 text-rose-600' },
        { path: '/app/marketplace', icon: ShoppingBag, label: 'Marketplace', color: 'bg-amber-100 text-amber-600' },
      ]
    },
    {
      title: 'Vida Espiritual',
      items: [
        { path: '/app/ebd', icon: Book, label: 'Escola Bíblica (EBD)', color: 'bg-violet-100 text-violet-600' },
        { path: '/app/prayers', icon: Heart, label: 'Pedidos de Oração', color: 'bg-rose-100 text-rose-600' },
        { path: '/app/diary', icon: PenTool, label: 'Diário Espiritual', color: 'bg-sky-100 text-sky-600' },
        { path: '/app/devotional', icon: BookOpen, label: 'Devocional Diário', color: 'bg-orange-100 text-orange-600' },
        { path: '/app/mentor', icon: Sparkles, label: 'Mentor IA', color: 'bg-purple-100 text-purple-600' },
      ]
    },
    {
      title: 'Minha Atividade',
      items: [
        { path: '/app/timeline', icon: Clock, label: 'Meu Histórico', color: 'bg-slate-100 text-slate-600' },
        { path: '/app/dashboard', icon: LayoutDashboard, label: 'Meu Progresso', color: 'bg-teal-100 text-teal-600' },
        { path: '/app/profile', icon: User, label: 'Meu Perfil', color: 'bg-slate-100 text-slate-600' },
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/app');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Mais Opções</h1>
        <p className="text-slate-500 text-sm">Explore todos os recursos da ChurchOS</p>
      </header>

      <div className="space-y-8">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider ml-2">
              {section.title}
            </h3>
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              {section.items.map((item, itemIdx) => (
                <NavLink
                  key={itemIdx}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center justify-between p-4 transition-colors border-b border-slate-50 last:border-0
                    ${isActive ? 'bg-slate-50' : 'hover:bg-slate-50'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.color}`}>
                      <item.icon size={20} />
                    </div>
                    <span className="font-medium text-slate-700">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-3">
          <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider ml-2">
            Configurações e Suporte
          </h3>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-600">
                  <Settings size={20} />
                </div>
                <span className="font-medium text-slate-700">Configurações</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-600">
                  <HelpCircle size={20} />
                </div>
                <span className="font-medium text-slate-700">Ajuda e Suporte</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-600">
                  <Share2 size={20} />
                </div>
                <span className="font-medium text-slate-700">Convidar Amigos</span>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-rose-50 transition-colors text-rose-600"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-rose-100 text-rose-600">
                  <LogOut size={20} />
                </div>
                <span className="font-bold">Sair da Conta</span>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            ChurchOS v1.0.0 • Feito com ❤️ para o Reino
          </p>
        </div>
      </div>
    </div>
  );
}
