import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PenTool, BookOpen, Sparkles, Clock, LayoutDashboard, 
  User as UserIcon, Users, LogOut, LogIn, Plus, 
  Network, Calendar, Book, Heart, ShoppingBag, Menu
} from 'lucide-react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import LoginModal from '../components/LoginModal';
import EnvironmentSwitcher from '../components/EnvironmentSwitcher';

export default function AppLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Membro',
            photoURL: user.photoURL || '',
            role: 'user',
            createdAt: serverTimestamp()
          };
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile);
        }
      } catch (error) {
        console.error("Error fetching/creating profile:", error);
      }
    };

    fetchProfile();

    const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      }
    }, (error) => {
      console.error("Profile snapshot error:", error);
    });

    return () => unsubscribeProfile();
  }, [user]);

  useEffect(() => {
    // Retract sidebar after navigation to maximize space
    setIsSidebarCollapsed(true);
  }, [location.pathname]);

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setIsLoginModalOpen(false);
    } catch (error: any) {
      console.error("Login error:", error);
      setAuthError("Erro ao entrar com Google. Tente novamente.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/app');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/app', icon: Users, label: 'Feed' },
    { path: '/app/prayers', icon: Heart, label: 'Orações' },
    { path: '/app/diary', icon: PenTool, label: 'Diário' },
    { path: '/app/devotional', icon: BookOpen, label: 'Devocional' },
    { path: '/app/mentor', icon: Sparkles, label: 'Mentor' },
    { path: '/app/timeline', icon: Clock, label: 'Histórico' },
    { path: '/app/dashboard', icon: LayoutDashboard, label: 'Progresso' },
    { path: '/app/ministries', icon: Users, label: 'Ministérios' },
    { path: '/app/cells', icon: Network, label: 'Células' },
    { path: '/app/events', icon: Calendar, label: 'Eventos' },
    { path: '/app/ebd', icon: Book, label: 'EBD' },
    { path: '/app/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { path: '/app/schedules', icon: Clock, label: 'Escalas' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className={`hidden md:flex flex-col transition-all duration-300 bg-white border-r border-slate-200 h-screen sticky top-0 z-30 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
              ChurchOS
            </h1>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <NavLink 
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                ${isSidebarCollapsed ? 'justify-center' : ''}
              `}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <item.icon size={18} className="shrink-0" />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-4">
          <EnvironmentSwitcher userProfile={userProfile} />
          {user ? (
            <div className={`flex items-center bg-slate-50 p-3 rounded-xl border border-slate-200 ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
              <NavLink to="/app/profile" className={`flex items-center gap-3 overflow-hidden text-left hover:bg-slate-100 p-1 rounded-lg transition-colors flex-1 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                    <UserIcon size={14} className="text-indigo-600" />
                  </div>
                )}
                {!isSidebarCollapsed && (
                  <div className="text-sm font-medium truncate text-slate-900">
                    {user.displayName || 'Usuário'}
                  </div>
                )}
              </NavLink>
              {!isSidebarCollapsed && (
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-600 transition-colors p-1 shrink-0">
                  <LogOut size={16} />
                </button>
              )}
            </div>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)} className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all ${isSidebarCollapsed ? 'p-2' : ''}`}>
              <LogIn size={18} /> {!isSidebarCollapsed && 'Entrar'}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-30">
        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          ChurchOS
        </h1>
        <div className="flex items-center gap-2">
          <EnvironmentSwitcher userProfile={userProfile} />
          {user ? (
            <NavLink to="/app/profile" className="w-8 h-8 rounded-full overflow-hidden border-2 border-indigo-100">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
                  <UserIcon size={14} className="text-indigo-600" />
                </div>
              )}
            </NavLink>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)} className="text-indigo-600 font-medium text-sm px-3 py-1.5 bg-indigo-50 rounded-lg">
              Entrar
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
        <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          <Outlet context={{ user, userProfile, handleLogin }} />
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around z-30">
          {[
            { path: '/app', icon: Users, label: 'Feed' },
            { path: '/app/prayers', icon: Heart, label: 'Orações' },
            { path: '/app/mentor', icon: Sparkles, label: 'Mentor' },
            { path: '/app/devotional', icon: BookOpen, label: 'Devocional' },
            { path: '/app/more', icon: Menu, label: 'Mais' },
          ].map(item => (
            <NavLink 
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) => `
                flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all
                ${isActive ? 'text-indigo-600' : 'text-slate-400'}
              `}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </main>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={handleLogin}
        loading={authLoading}
        error={authError}
      />
    </div>
  );
}
