import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, Network, Calendar, 
  Settings, LogOut, Church as ChurchIcon, 
  ChevronLeft, Bell, Search, Menu, X,
  ShieldCheck, Sparkles, Building2, CreditCard,
  Book, ShoppingBag, Clock, UserPlus
} from 'lucide-react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';
import EnvironmentSwitcher from '../components/EnvironmentSwitcher';

export default function AdminLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        navigate('/church-login');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    
    const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        // Check if user has admin/pastor/leader role
        if (profile.role === 'admin' || profile.role === 'pastor' || profile.role === 'leader') {
          setUserProfile(profile);
        } else {
          // Redirect if not authorized
          navigate('/app');
        }
      } else {
        // If profile doesn't exist, they shouldn't be here
        navigate('/app');
      }
      setLoading(false);
    }, (error) => {
      console.error("Admin profile snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribeProfile();
  }, [user, navigate]);

  useEffect(() => {
    // Retract sidebar after navigation
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false); // Close on mobile
    } else {
      // Retract to mini-bar on desktop after selection to maximize space
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/church-admin' },
    { icon: Users, label: 'Membros', path: '/church-admin/members' },
    { icon: UserPlus, label: 'Visitantes', path: '/church-admin/visitors' },
    { icon: Network, label: 'Ministérios', path: '/church-admin/ministries' },
    { icon: Building2, label: 'Células', path: '/church-admin/cells' },
    { icon: Calendar, label: 'Eventos', path: '/church-admin/events' },
    { icon: Clock, label: 'Escalas', path: '/church-admin/schedules' },
    { icon: Book, label: 'EBD', path: '/church-admin/ebd' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/church-admin/marketplace' },
    { icon: CreditCard, label: 'Financeiro', path: '/church-admin/finance' },
    { icon: Settings, label: 'Configurações', path: '/church-admin/settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Carregando Painel Administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900 text-white transition-all duration-300 ${
          isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
        } lg:relative`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between">
            <Link to="/church-admin" className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <ChurchIcon size={20} />
              </div>
              <span className="font-black tracking-tighter text-xl">ECCLESIA<span className="text-indigo-400">OS</span></span>
            </Link>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* User Info */}
          {isSidebarOpen && (
            <div className="px-6 py-4 border-y border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center overflow-hidden">
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt={userProfile.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <ShieldCheck size={20} className="text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{userProfile?.displayName || 'Administrador'}</p>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{userProfile?.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/church-admin'}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                  ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <item.icon size={20} className={!isSidebarOpen ? 'mx-auto' : ''} />
                {isSidebarOpen && <span className="font-bold text-sm">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800">
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all`}
            >
              <LogOut size={20} className={!isSidebarOpen ? 'mx-auto' : ''} />
              {isSidebarOpen && <span className="font-bold text-sm">Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-400"
            >
              <Menu size={20} />
            </button>
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Buscar membros, ministérios..."
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <EnvironmentSwitcher userProfile={userProfile} />
            <button className="p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">Igreja Batista Central</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">SaaS Plan: Premium</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Building2 size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Outlet context={{ user, userProfile }} />
        </main>
      </div>
    </div>
  );
}
