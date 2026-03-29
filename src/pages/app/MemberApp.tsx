import React, { Component, useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, X, BookOpen, PenTool, LogIn, LogOut, Star, Calendar, Search, Filter, Clock, Map, Users, Sparkles, Shield, Mountain, Target, HandHeart, CheckCircle2, Lightbulb, Heart, MessageCircle, LayoutDashboard, User as UserIcon } from 'lucide-react';

const Devotional = lazy(() => import('../../components/Devotional'));
const Onboarding = lazy(() => import('../../components/Onboarding'));
const DiaryEntryForm = lazy(() => import('../../components/DiaryEntryForm'));
const ChurchOnboarding = lazy(() => import('../../components/ChurchOnboarding'));
const CommunityFeed = lazy(() => import('../../components/CommunityFeed'));
const ProgressDashboard = lazy(() => import('../../components/ProgressDashboard'));
const LoginModal = lazy(() => import('../../components/LoginModal'));
const SpiritualMentor = lazy(() => import('../../components/SpiritualMentor'));
const UserProfileComponent = lazy(() => import('../../components/UserProfile').then(m => ({ default: m.UserProfile })));

import { BaseModal } from '../../components/BaseModal';
import { SpiritualEntry, Category, UserProfile } from '../../types';
import { auth, db, handleFirestoreError, OperationType } from '../../firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, getDoc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { MediaCarousel } from '../../components/MediaCarousel';

const MOCK_STATS = {
  completed: 0,
  streak: 0,
  lastDate: '',
  favorites: [] as string[]
};

const SkeletonEntry = () => (
  <div className="p-6 glass-card animate-pulse">
    <div className="flex justify-between items-start gap-4 mb-3">
      <div className="flex-1">
        <div className="flex gap-2 mb-2">
          <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
          <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
        </div>
        <div className="h-6 w-3/4 bg-slate-200 rounded-lg mt-2"></div>
      </div>
      <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-4 w-full bg-slate-200 rounded"></div>
      <div className="h-4 w-5/6 bg-slate-200 rounded"></div>
      <div className="h-4 w-4/6 bg-slate-200 rounded"></div>
    </div>
    <div className="h-3 w-32 bg-slate-200 rounded mt-4"></div>
  </div>
);

const SkeletonTimeline = () => (
  <div className="space-y-8 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-px before:bg-slate-200">
    {[1, 2, 3].map((i) => (
      <div key={i} className="relative pl-16 animate-pulse">
        <div className="absolute left-[21px] top-6 w-3 h-3 rounded-full bg-slate-300 ring-4 ring-slate-100 z-10" />
        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-3">
            <div className="w-full">
              <div className="h-3 w-20 bg-slate-200 rounded mb-2"></div>
              <div className="h-5 w-2/3 bg-slate-200 rounded"></div>
            </div>
            <div className="h-5 w-24 bg-slate-200 rounded-md shrink-0"></div>
          </div>
          <div className="space-y-2 mt-3">
            <div className="h-4 w-full bg-slate-200 rounded"></div>
            <div className="h-4 w-4/5 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20
    }
  }
};

// Error Boundary Component
class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error instanceof Error ? error.message : error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <X size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Ops! Algo deu errado.</h2>
          <p className="text-slate-500 mb-8 max-w-sm">O aplicativo encontrou um erro inesperado. Isso pode acontecer com arquivos de áudio muito grandes.</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary px-8 py-3"
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const renderDescription = (desc: string) => {
  if (!desc) return null;
  return desc.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <strong key={i} className="block mt-3 mb-1 text-[var(--color-primary-700)] text-xs uppercase tracking-wider">{line.slice(2, -2)}</strong>;
    }
    return <span key={i} className="block italic font-medium text-slate-700">{line}</span>;
  });
};

export default function App() {
  const [entries, setEntries] = useState<SpiritualEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  
  const location = useLocation();
  const navigate = useNavigate();
  const pathParts = location.pathname.split('/');
  const view = (pathParts[2] as any) || 'diary';
  
  const setView = (newView: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentView', newView);
      sessionStorage.setItem('currentView', newView);
    }
    navigate(`/app/${newView}`);
  };

  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('hasVisited') && !sessionStorage.getItem('hasVisited');
    }
    return true;
  });
  const [isGuest, setIsGuest] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isGuest') === 'true' || sessionStorage.getItem('isGuest') === 'true';
    }
    return true;
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [initialCategory, setInitialCategory] = useState<Category | undefined>(undefined);
  const [editingEntry, setEditingEntry] = useState<SpiritualEntry | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'Todas' | 'Memoriais'>('Todas');
  const [devotionalStats, setDevotionalStats] = useState(MOCK_STATS);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // URL-based view management
  }, [view]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isGuest', String(isGuest));
      sessionStorage.setItem('isGuest', String(isGuest));
    }
  }, [isGuest]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsGuest(!currentUser);
      if (currentUser) {
        setShowOnboarding(false);
        // Fetch user profile to get churchId
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setUserProfile(data);
            // If user has a church, ensure we don't show onboarding
            if (data.churchId) {
              setShowOnboarding(false);
            }
          } else {
            // Create profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Usuário',
              photoURL: currentUser.photoURL || '',
              createdAt: serverTimestamp(),
              role: 'user',
              status: 'active',
              tags: []
            };
            await setDoc(doc(db, 'users', currentUser.uid), newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        const hasVisited = localStorage.getItem('hasVisited');
        if (hasVisited) {
          setShowOnboarding(false);
        }
        setUserProfile(null);
        setLoadingEntries(false);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    
    if (user) {
      setLoadingEntries(true);
      // Listen to user profile changes (like joining a church)
      const userRef = doc(db, 'users', user.uid);
      const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      });

      // Listen to entries
      const entriesRef = collection(db, `users/${user.uid}/entries`);
      const q = query(entriesRef, orderBy('id', 'desc'));
      
      const unsubscribeEntries = onSnapshot(q, (snapshot) => {
        const fetchedEntries: SpiritualEntry[] = [];
        snapshot.forEach((doc) => {
          fetchedEntries.push(doc.data() as SpiritualEntry);
        });
        setEntries(fetchedEntries);
        setLoadingEntries(false);
      }, (error) => {
        setLoadingEntries(false);
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/entries`);
      });

      // Listen to stats
      const statsRef = doc(db, `users/${user.uid}/stats/devotional`);
      const unsubscribeStats = onSnapshot(statsRef, (docSnap) => {
        if (docSnap.exists()) {
          setDevotionalStats(docSnap.data() as typeof MOCK_STATS);
        } else {
          setDevotionalStats(MOCK_STATS);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/stats/devotional`);
      });

      return () => {
        unsubscribeProfile();
        unsubscribeEntries();
        unsubscribeStats();
      };
    } else {
      setEntries([]);
      setDevotionalStats(MOCK_STATS);
    }
  }, [user, isAuthReady]);

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        const userRef = doc(db, 'users', result.user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          const newProfile: UserProfile = {
            uid: result.user.uid,
            email: result.user.email || '',
            displayName: result.user.displayName || 'Membro',
            photoURL: result.user.photoURL || '',
            role: 'user',
            status: 'active',
            tags: [],
            createdAt: new Date() as any
          };
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile);
        } else {
          setUserProfile(userDoc.data() as UserProfile);
        }
        setIsLoginModalOpen(false);
        setIsGuest(false);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/popup-blocked') {
        setAuthError("O popup de login foi bloqueado pelo navegador. Por favor, permita popups para este site.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed the popup, no need for error message
      } else if (error.code === 'auth/unauthorized-domain') {
        setAuthError(`Domínio não autorizado (${window.location.hostname}). Por favor, verifique as configurações do Firebase.`);
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError("O login com Google não está ativado no console do Firebase.");
      } else {
        setAuthError(`Erro ao entrar (${error.code || 'erro desconhecido'}). Tente novamente.`);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsGuest(true);
      setView('diary');
      setIsLogoutModalOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleDevotionalComplete = async () => {
    if (!user) return;
    
    const today = new Date().toDateString();
    const isNewDay = devotionalStats.lastDate !== today;
    const isConsecutive = devotionalStats.lastDate === new Date(Date.now() - 86400000).toDateString();
    
    const newStats = {
      ...devotionalStats,
      userId: user.uid,
      completed: devotionalStats.completed + 1,
      streak: isNewDay ? (isConsecutive ? devotionalStats.streak + 1 : 1) : devotionalStats.streak,
      lastDate: today,
      updatedAt: new Date()
    };

    try {
      await setDoc(doc(db, `users/${user.uid}/stats/devotional`), newStats);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}/stats/devotional`);
    }
  };

  const handleOnboardingComplete = (action: 'register' | 'login' | 'guest') => {
    setShowOnboarding(false);
    const isGuest = action === 'guest';
    setIsGuest(isGuest);
    localStorage.setItem('hasVisited', 'true');
    sessionStorage.setItem('hasVisited', 'true');
    localStorage.setItem('isGuest', String(isGuest));
    sessionStorage.setItem('isGuest', String(isGuest));
    
    if (action === 'register') {
      navigate('/register');
    } else if (action === 'login') {
      setIsLoginModalOpen(true);
    }
  };

  const handleSaveEntry = async (newEntryData: Omit<SpiritualEntry, 'id' | 'date'>, existingId?: string) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    
    const entryId = existingId || Date.now().toString();
    
    // Find the entry being edited to preserve its date and createdAt
    const entryToUpdate = existingId !== undefined ? entries.find(e => e.id === existingId) : undefined;

    const newEntry: SpiritualEntry = {
      ...newEntryData,
      id: entryId,
      userId: user.uid,
      date: entryToUpdate ? entryToUpdate.date : new Date().toISOString(),
      createdAt: entryToUpdate?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      // Ensure no undefined properties reach Firestore
      media: newEntryData.media || null,
      aspectRatio: newEntryData.aspectRatio || null,
      bibleVerse: newEntryData.bibleVerse || null
    };

    try {
      const entryRef = doc(db, `users/${user.uid}/entries/${entryId}`);
      if (existingId !== undefined) {
        await setDoc(entryRef, newEntry, { merge: true });
        showToast('Registro atualizado com sucesso!', 'success');
      } else {
        await setDoc(entryRef, newEntry);
        showToast('Novo registro salvo com sucesso!', 'success');
      }
      
      // Sync to community timeline if user has a church AND chose to share
      if (userProfile?.churchId) {
        const postId = `post_diary_${entryId}`;
        if (newEntry.shareWithCommunity) {
          const postData = {
            churchId: userProfile.churchId,
            authorId: user.uid,
            authorName: user.displayName || 'Membro',
            authorPhoto: user.photoURL || '',
            content: `Compartilhou um novo registro no diário: "${newEntry.title}"\n\n${newEntry.description.length > 200 ? newEntry.description.substring(0, 200) + '...' : newEntry.description}`,
            type: newEntry.category === 'Pedidos de oração' ? 'prayer' : 'testimony',
            bibleVerse: newEntry.bibleVerse || null,
            media: newEntry.media || null,
            aspectRatio: newEntry.aspectRatio || null,
            likesCount: 0, // Ensure required fields for rules
            createdAt: serverTimestamp()
          };

          try {
            // Try updating first to preserve likes and original createdAt
            // But we need to be careful with createdAt on update
            const { createdAt, likesCount, ...updateData } = postData;
            await updateDoc(doc(db, 'posts', postId), updateData);
          } catch (e) {
            // If it doesn't exist (first time sharing or new entry), create it
            await setDoc(doc(db, 'posts', postId), postData);
          }
        } else if (existingId) {
          // If it was an update and now it's NOT shared, delete the post if it existed
          try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'posts', postId));
            
            const commentsSnapshot = await getDocs(collection(db, 'posts', postId, 'comments'));
            commentsSnapshot.forEach(d => batch.delete(d.ref));
            
            await batch.commit();
          } catch (e) {
            // Ignore if post didn't exist or other errors
          }
        }
      }
      setIsFormOpen(false);
      setEditingEntry(undefined);
      
      // Always go to diary view after saving if we're not already in a diary-related view
      if (view !== 'diary' && view !== 'timeline') {
        setView('diary');
      }
    } catch (error) {
      handleFirestoreError(error, existingId !== undefined ? OperationType.UPDATE : OperationType.CREATE, `users/${user.uid}/entries/${entryId}`);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      // 1. Delete the diary entry
      batch.delete(doc(db, `users/${user.uid}/entries/${entryId}`));
      
      // 2. Delete the associated post if it exists
      const postId = `post_diary_${entryId}`;
      batch.delete(doc(db, 'posts', postId));
      
      // 3. Delete all comments for the associated post
      const commentsSnapshot = await getDocs(collection(db, 'posts', postId, 'comments'));
      commentsSnapshot.forEach(d => batch.delete(d.ref));
      
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}/entries/${entryId}`);
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           entry.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'Todas' || entry.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [entries, searchQuery, filterCategory]);

  const timelineEntries = useMemo(() => {
    let result = [...entries];
    if (view === 'timeline' && filterCategory === 'Memoriais') {
      result = result.filter(e => e.isMemorial);
    }
    return result.sort((a, b) => {
      const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
      const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
      return (bId || 0) - (aId || 0);
    });
  }, [entries, view, filterCategory]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Carregando sua experiência...</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin"></div></div>}>
          <Onboarding onComplete={handleOnboardingComplete} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Se o usuário está logado, mas não tem igreja, mostra o onboarding da igreja
  if (user && userProfile && !userProfile.churchId) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin"></div></div>}>
          <ChurchOnboarding onComplete={(churchId) => {
            setUserProfile(prev => prev ? { ...prev, churchId } : null);
          }} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] flex flex-col md:flex-row font-sans">
        {/* Global Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 50, x: '-50%' }}
              className="fixed bottom-24 left-1/2 z-[1000] w-[90%] max-w-md"
            >
              <div className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl border ${
                toast.type === 'success' 
                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                  : 'bg-red-600 border-red-500 text-white'
              }`}>
                {toast.type === 'success' ? <CheckCircle2 size={20} /> : <X size={20} />}
                <p className="font-medium">{toast.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] h-screen sticky top-0 z-20">
        <div className="p-6">
          <h1 className="text-xl font-bold primary-gradient-text tracking-tight">
            Diário Espiritual
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {[
            { id: 'diary', icon: PenTool, label: 'Diário' },
            { id: 'devotional', icon: BookOpen, label: 'Devocional' },
            { id: 'mentor', icon: Sparkles, label: 'Mentor' },
            { id: 'timeline', icon: Clock, label: 'Linha do Tempo' },
            { id: 'dashboard', icon: LayoutDashboard, label: 'Progresso' },
            { id: 'profile', icon: UserIcon, label: 'Perfil' },
            ...(userProfile?.churchId ? [{ id: 'community', icon: Users, label: 'Comunidade' }] : [])
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setView(item.id as any)} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                view === item.id 
                  ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)]' 
                  : 'text-[var(--color-text-secondary)] hover:bg-slate-50 hover:text-[var(--color-text-primary)]'
              }`}
            >
              <item.icon size={18} className={view === item.id ? 'text-[var(--color-primary-600)]' : 'text-[var(--color-text-tertiary)]'} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--color-border)]">
          <button 
            onClick={() => setIsFormOpen(true)}
            className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
          >
            <Plus size={18} /> Novo Registro
          </button>
          {user ? (
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-[var(--color-border)]">
              <button 
                onClick={() => setView('profile')}
                className="flex items-center gap-3 overflow-hidden text-left hover:bg-slate-100 p-1 rounded-lg transition-colors flex-1"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" loading="lazy" />
                ) : (
                  <div className="w-8 h-8 bg-[var(--color-primary-100)] rounded-full flex items-center justify-center shrink-0">
                    <Users size={14} className="text-[var(--color-primary-600)]" />
                  </div>
                )}
                <div className="text-sm font-medium truncate text-[var(--color-text-primary)]">
                  {user.displayName || 'Usuário'}
                </div>
              </button>
              <button onClick={() => setIsLogoutModalOpen(true)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors p-1 shrink-0">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)} className="btn-secondary w-full flex items-center justify-center gap-2">
              <LogIn size={18} /> Entrar com Google
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-20">
          <h1 className="text-lg font-bold primary-gradient-text tracking-tight">
            Diário Espiritual
          </h1>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button 
                  onClick={() => setView('profile')}
                  className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--color-primary-100)]"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-[var(--color-primary-50)] flex items-center justify-center">
                      <Users size={14} className="text-[var(--color-primary-600)]" />
                    </div>
                  )}
                </button>
                <button onClick={() => setIsLogoutModalOpen(true)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] p-2">
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="text-[var(--color-primary-600)] font-medium text-sm px-3 py-1.5 bg-[var(--color-primary-50)] rounded-lg">
                Entrar
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-4xl mx-auto">
            {view === 'diary' && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Novo Registro</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {[
                    { id: 'Milagres', icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { id: 'Livramentos', icon: Shield, color: 'text-primary', bg: 'bg-primary/10' },
                    { id: 'Desafios', icon: Mountain, color: 'text-slate-500', bg: 'bg-slate-50' },
                    { id: 'Propósitos', icon: Target, color: 'text-primary', bg: 'bg-primary/10' },
                    { id: 'Pedidos de oração', icon: HandHeart, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { id: 'Orações respondidas', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { id: 'Lições espirituais', icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-50' },
                    { id: 'Gratidão', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
                    { id: 'O que Deus falou comigo', icon: MessageCircle, color: 'text-purple-500', bg: 'bg-purple-50' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setInitialCategory(cat.id as Category);
                        setIsFormOpen(true);
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-slate-50 transition-all hover:-translate-y-1 hover:shadow-sm group"
                    >
                      <div className={`w-10 h-10 rounded-full ${cat.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                        <cat.icon size={20} className={cat.color} />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-center text-[var(--color-text-secondary)] leading-tight">{cat.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <Suspense fallback={<div className="py-20 flex items-center justify-center"><div className="w-10 h-10 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin"></div></div>}>
                {view === 'dashboard' ? (
                  <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <ProgressDashboard entries={entries} />
                  </motion.div>
                ) : view === 'mentor' ? (
                  <motion.div key="mentor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <SpiritualMentor 
                      entries={entries} 
                      devotionalStats={devotionalStats} 
                      onNavigate={(v) => setView(v)} 
                      onSaveToDiary={(text) => handleSaveEntry({
                        title: 'Reflexão com Mentor',
                        category: 'O que Deus falou comigo',
                        description: text,
                        lessonsLearned: '',
                        impact: 'Médio',
                        isMemorial: false
                      })}
                    />
                  </motion.div>
                ) : view === 'devotional' ? (
                  <motion.div key="devotional" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <Devotional 
                      stats={devotionalStats}
                      onComplete={handleDevotionalComplete}
                      onSaveToDiary={(text) => handleSaveEntry({
                        title: 'Resposta Devocional',
                        category: 'O que Deus falou comigo',
                        description: text,
                        lessonsLearned: '',
                        impact: 'Médio',
                        isMemorial: false
                      })} 
                      isGuest={!user} 
                    />
                  </motion.div>
                ) : view === 'community' && userProfile?.churchId ? (
                  <motion.div key="community" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <CommunityFeed churchId={userProfile.churchId} userRole={userProfile.role} />
                  </motion.div>
                ) : view === 'profile' && userProfile ? (
                  <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <UserProfileComponent 
                      profile={userProfile} 
                      onUpdate={(updated) => setUserProfile(updated)} 
                    />
                  </motion.div>
                ) : view === 'timeline' ? (
                  <motion.div 
                    key="timeline" 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Linha do Tempo</h2>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button 
                          onClick={() => setFilterCategory('Todas')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCategory === 'Todas' ? 'bg-white shadow-sm text-[var(--color-primary-700)]' : 'text-[var(--color-text-tertiary)]'}`}
                        >
                          Tudo
                        </button>
                        <button 
                          onClick={() => setFilterCategory('Memoriais')}
                          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCategory === 'Memoriais' ? 'bg-white shadow-sm text-[var(--color-primary-700)]' : 'text-[var(--color-text-tertiary)]'}`}
                        >
                          Memoriais
                        </button>
                      </div>
                    </div>

                    <div className="relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-px before:bg-[var(--color-border)] space-y-12">
                      {loadingEntries ? (
                        <SkeletonTimeline />
                      ) : timelineEntries.length === 0 ? (
                        <div className="text-center py-20 text-[var(--color-text-tertiary)] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] border-dashed ml-12">
                          {!user ? "Faça login para ver sua linha do tempo." : "Nenhum registro encontrado."}
                        </div>
                      ) : (
                        timelineEntries.map((entry) => (
                          <motion.div 
                            key={entry.id} 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="relative pl-16 group"
                          >
                            <div className={`absolute left-[17px] top-6 w-5 h-5 rounded-full z-10 border-4 border-[var(--color-background)] ${entry.isMemorial ? 'bg-amber-400' : 'bg-[var(--color-primary-500)]'} shadow-sm`} />
                            <motion.div 
                              whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                              className={`glass-card p-8 transition-all duration-300 ${entry.isMemorial ? 'border-amber-200 bg-amber-50/30' : 'border-[var(--color-border)]'}`}
                            >
                              <div className="flex justify-between items-start mb-5">
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 overflow-hidden">
                                  <span className="inline-flex items-center justify-center h-4 text-[8px] font-bold text-[var(--color-primary-700)] uppercase tracking-wider bg-[var(--color-primary-50)] px-1.5 rounded-full whitespace-nowrap border border-transparent">{entry.category}</span>
                                  {entry.isMemorial && (
                                    <span className="inline-flex items-center justify-center h-4 bg-amber-100 text-amber-800 border border-amber-200 text-[8px] uppercase font-bold px-1.5 rounded-full gap-1 whitespace-nowrap">
                                      <Star size={8} fill="currentColor" /> Memorial
                                    </span>
                                  )}
                                  <span className={`inline-flex items-center justify-center h-4 text-[8px] uppercase font-bold px-1.5 rounded-full border whitespace-nowrap ${
                                    entry.impact === 'Alto' ? 'bg-red-50 text-red-700 border-red-200' : 
                                    entry.impact === 'Médio' ? 'bg-primary/10 text-primary border-primary/20' : 
                                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}>
                                    Impacto {entry.impact}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => {
                                      setEditingEntry(entry);
                                      setIsFormOpen(true);
                                    }} 
                                    className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-600)] transition-colors p-2 rounded-lg hover:bg-[var(--color-primary-50)]"
                                  >
                                    <PenTool size={18} />
                                  </button>
                                  <button onClick={() => handleDeleteEntry(entry.id)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors p-2 rounded-lg hover:bg-red-50">
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                              <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 leading-tight">{entry.title}</h3>
                              <div className="text-[var(--color-text-secondary)] text-sm leading-relaxed space-y-3">
                                {renderDescription(entry.description)}
                              </div>
                              
                              {entry.media && entry.media.length > 0 && (
                                <div className="mt-6">
                                  <MediaCarousel 
                                    media={entry.media} 
                                    aspectRatio={entry.aspectRatio || '16:9'} 
                                  />
                                </div>
                              )}

                              {entry.lessonsLearned && (
                                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-[var(--color-border)]">
                                  <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">O que aprendi:</p>
                                  <p className="text-sm text-[var(--color-text-secondary)]">{entry.lessonsLearned}</p>
                                </div>
                              )}
                              {entry.bibleVerse && <p className="mt-6 text-sm font-medium text-[var(--color-primary-600)] bg-[var(--color-primary-50)] inline-block px-3 py-1.5 rounded-lg">📖 {entry.bibleVerse}</p>}
                              <p className="mt-6 text-xs font-semibold text-[var(--color-text-tertiary)] bg-slate-100 px-3 py-1.5 rounded-full inline-block">
                                {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </motion.div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="list" 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="space-y-12"
                  >
                    {loadingEntries ? (
                      <SkeletonTimeline />
                    ) : filteredEntries.length === 0 ? (
                      <div className="text-center py-20 text-[var(--color-text-tertiary)] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] border-dashed">
                        {!user ? "Faça login para ver seus registros." : "Nenhum registro encontrado."}
                      </div>
                    ) : (
                      filteredEntries.map((entry) => (
                        <motion.div 
                          key={entry.id} 
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-100px" }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="group"
                        >
                          <motion.div 
                            whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
                            className="glass-card p-8 transition-all duration-300 border-[var(--color-border)]"
                          >
                            <div className="flex justify-between items-start mb-5">
                              <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 overflow-hidden">
                                <span className="inline-flex items-center justify-center h-4 text-[8px] font-bold text-[var(--color-primary-700)] uppercase tracking-wider bg-[var(--color-primary-50)] px-1.5 rounded-full whitespace-nowrap border border-transparent">{entry.category}</span>
                                {entry.isMemorial && (
                                  <span className="inline-flex items-center justify-center h-4 bg-amber-100 text-amber-800 border border-amber-200 text-[8px] uppercase font-bold px-1.5 rounded-full gap-1 whitespace-nowrap">
                                    <Star size={8} fill="currentColor" /> Memorial
                                  </span>
                                )}
                                <span className={`inline-flex items-center justify-center h-4 text-[8px] uppercase font-bold px-1.5 rounded-full border whitespace-nowrap ${
                                  entry.impact === 'Alto' ? 'bg-red-50 text-red-700 border-red-200' : 
                                  entry.impact === 'Médio' ? 'bg-primary/10 text-primary border-primary/20' : 
                                  'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  Impacto {entry.impact}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingEntry(entry);
                                    setIsFormOpen(true);
                                  }} 
                                  className="text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-600)] transition-colors p-2 rounded-lg hover:bg-[var(--color-primary-50)]"
                                >
                                  <PenTool size={18} />
                                </button>
                                <button onClick={() => handleDeleteEntry(entry.id)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors p-2 rounded-lg hover:bg-red-50">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4 leading-tight">{entry.title}</h3>
                            <div className="text-[var(--color-text-secondary)] text-sm leading-relaxed space-y-3">
                              {renderDescription(entry.description)}
                            </div>
                            
                            {entry.media && entry.media.length > 0 && (
                              <div className="mt-6">
                                <MediaCarousel 
                                  media={entry.media} 
                                  aspectRatio={entry.aspectRatio || '16:9'} 
                                />
                              </div>
                            )}

                            {entry.lessonsLearned && (
                              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-[var(--color-border)]">
                                <p className="text-xs font-semibold text-[var(--color-text-primary)] mb-1">O que aprendi:</p>
                                <p className="text-sm text-[var(--color-text-secondary)]">{entry.lessonsLearned}</p>
                              </div>
                            )}
                            {entry.bibleVerse && <p className="mt-6 text-sm font-medium text-[var(--color-primary-600)] bg-[var(--color-primary-50)] inline-block px-3 py-1.5 rounded-lg">📖 {entry.bibleVerse}</p>}
                            <p className="mt-6 text-xs font-semibold text-[var(--color-text-tertiary)] bg-slate-100 px-3 py-1.5 rounded-full inline-block">
                              {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </motion.div>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </Suspense>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex justify-around p-2 pb-safe z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {[
          ...(userProfile?.churchId ? [{ id: 'community', icon: Users, label: 'Feed' }] : []),
          { id: 'devotional', icon: BookOpen, label: 'Devocional' },
          { id: 'diary', icon: PenTool, label: 'Diário' },
          { id: 'mentor', icon: Sparkles, label: 'Mentor' },
          { id: 'profile', icon: UserIcon, label: 'Perfil' }
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setView(item.id as any)} 
            className={`flex flex-col items-center p-2 text-[10px] font-medium gap-1 transition-colors ${
              view === item.id ? 'text-[var(--color-primary-600)]' : 'text-[var(--color-text-tertiary)]'
            }`}
          >
            <item.icon size={20} className={view === item.id ? 'fill-[var(--color-primary-50)]' : ''} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile FAB */}
      <button 
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] text-white rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center z-30 active:scale-95 transition-transform" 
        onClick={() => setIsFormOpen(true)}
      >
        <Plus size={24} />
      </button>

      <AnimatePresence>
        {isFormOpen && (
          <Suspense fallback={null}>
            <DiaryEntryForm 
              initialCategory={initialCategory}
              initialEntry={editingEntry}
              onSave={handleSaveEntry} 
              onClose={() => {
                setIsFormOpen(false);
                setInitialCategory(undefined);
                setEditingEntry(undefined);
              }} 
              showToast={showToast}
            />
          </Suspense>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        <LoginModal 
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLogin={handleLogin}
          loading={authLoading}
        />
      </Suspense>

      {/* Logout Confirmation Modal */}
      <BaseModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        showCloseButton={false}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogOut size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Sair da conta?</h3>
          <p className="text-slate-500 mb-8">Você precisará entrar novamente para acessar seus registros e a comunidade.</p>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsLogoutModalOpen(false)}
              className="flex-1 px-6 py-3 rounded-2xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleLogout}
              className="flex-1 px-6 py-3 rounded-2xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
            >
              Sair
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Auth Error Toast */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[200]"
          >
            <div className="bg-red-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4">
              <p className="text-sm font-medium">{authError}</p>
              <button onClick={() => setAuthError(null)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}
