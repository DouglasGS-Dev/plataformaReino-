import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  LayoutDashboard, 
  Briefcase, 
  Home, 
  Calendar, 
  DollarSign, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  ShieldCheck,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell as RechartsCell,
  Legend
} from 'recharts';
import { UserProfile, Church, Ministry, Cell, Event, FinancialTransaction } from '../types';
import { 
  AddMinistryModal, 
  AddCellModal, 
  AddEventModal, 
  AddFinanceModal,
  AddMemberModal,
  AddScheduleModal
} from './AdminModals';
import { ConfirmModal, Toast } from './UIComponents';

interface ChurchAdminProps {
  churchId: string;
  userRole: string;
}

type AdminView = 'dashboard' | 'members' | 'ministries' | 'ministry_schedules' | 'cells' | 'events' | 'finances';

export default function ChurchAdmin({ churchId, userRole }: ChurchAdminProps) {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [activeMinistry, setActiveMinistry] = useState<Ministry | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [finances, setFinances] = useState<FinancialTransaction[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddingMinistry, setIsAddingMinistry] = useState(false);
  const [isAddingCell, setIsAddingCell] = useState(false);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [isAddingFinance, setIsAddingFinance] = useState(false);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [initialFinanceType, setInitialFinanceType] = useState<'income' | 'expense'>('income');
  const [editingMinistry, setEditingMinistry] = useState<Ministry | undefined>();
  const [editingCell, setEditingCell] = useState<Cell | undefined>();
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [editingFinance, setEditingFinance] = useState<FinancialTransaction | undefined>();
  const [editingSchedule, setEditingSchedule] = useState<any | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<{ path: string, id: string } | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!churchId) return;

    setLoading(true);

    // Listen to church details
    const churchRef = doc(db, 'churches', churchId);
    const unsubscribeChurch = onSnapshot(churchRef, (docSnap) => {
      if (docSnap.exists()) {
        setChurch({ ...docSnap.data(), id: docSnap.id } as Church);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `churches/${churchId}`));

    // Listen to members
    const membersQuery = query(collection(db, 'users'), where('churchId', '==', churchId));
    const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
      const fetchedMembers: UserProfile[] = [];
      snapshot.forEach((doc) => fetchedMembers.push(doc.data() as UserProfile));
      setMembers(fetchedMembers);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    // Listen to ministries
    const ministriesQuery = collection(db, `churches/${churchId}/ministries`);
    const unsubscribeMinistries = onSnapshot(ministriesQuery, (snapshot) => {
      const fetched: Ministry[] = [];
      snapshot.forEach((doc) => fetched.push({ ...doc.data(), id: doc.id } as Ministry));
      setMinistries(fetched);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `churches/${churchId}/ministries`));

    // Listen to cells
    const cellsQuery = collection(db, `churches/${churchId}/cells`);
    const unsubscribeCells = onSnapshot(cellsQuery, (snapshot) => {
      const fetched: Cell[] = [];
      snapshot.forEach((doc) => fetched.push({ ...doc.data(), id: doc.id } as Cell));
      setCells(fetched);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `churches/${churchId}/cells`));

    // Listen to events
    const eventsQuery = collection(db, `churches/${churchId}/events`);
    const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
      const fetched: Event[] = [];
      snapshot.forEach((doc) => fetched.push({ ...doc.data(), id: doc.id } as Event));
      setEvents(fetched);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `churches/${churchId}/events`));

    // Listen to finances
    const financesQuery = collection(db, `churches/${churchId}/finances`);
    const unsubscribeFinances = onSnapshot(financesQuery, (snapshot) => {
      const fetched: FinancialTransaction[] = [];
      snapshot.forEach((doc) => fetched.push({ ...doc.data(), id: doc.id } as FinancialTransaction));
      setFinances(fetched);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `churches/${churchId}/finances`));

    return () => {
      unsubscribeChurch();
      unsubscribeMembers();
      unsubscribeMinistries();
      unsubscribeCells();
      unsubscribeEvents();
      unsubscribeFinances();
    };
  }, [churchId]);

  useEffect(() => {
    if (!churchId || !activeMinistry) return;

    const schedulesQuery = query(
      collection(db, `churches/${churchId}/schedules`),
      where('ministryId', '==', activeMinistry.id)
    );

    const unsubscribeSchedules = onSnapshot(schedulesQuery, (snapshot) => {
      const fetched: any[] = [];
      snapshot.forEach((doc) => fetched.push({ ...doc.data(), id: doc.id }));
      setSchedules(fetched);
    }, (err) => handleFirestoreError(err, OperationType.LIST, `churches/${churchId}/schedules`));

    return () => unsubscribeSchedules();
  }, [churchId, activeMinistry]);

  const stats = {
    totalMembers: members.length,
    totalMinistries: ministries.length,
    totalCells: cells.length,
    upcomingEvents: events.filter(e => new Date(e.date as any) > new Date()).length,
    balance: finances.reduce((acc, curr) => curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0)
  };

  const handleDelete = async (collectionPath: string, id: string) => {
    try {
      await deleteDoc(doc(db, collectionPath, id));
      showToast('Item excluído com sucesso!');
      setConfirmDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, collectionPath);
      showToast('Erro ao excluir item.', 'error');
    }
  };

  const handleRemoveMember = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { churchId: null, role: 'member' });
      showToast('Membro removido com sucesso!');
      setConfirmDelete(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
      showToast('Erro ao remover membro.', 'error');
    }
  };

  const handleUpdateMemberRole = async (uid: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {church && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{church.name}</h2>
            <p className="text-indigo-100 mt-1">Bem-vindo ao painel administrativo da sua igreja.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center min-w-[200px]">
            <div className="text-xs text-indigo-100 uppercase tracking-wider font-bold mb-1">Código de Convite</div>
            <div className="text-3xl font-mono font-bold tracking-widest">{church.inviteCode}</div>
            <div className="text-[10px] text-indigo-200 mt-1">Compartilhe com seus membros</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Membros Ativos', value: stats.totalMembers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Ministérios', value: stats.totalMinistries, icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Células', value: stats.totalCells, icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Saldo (Mês)', value: `R$ ${stats.balance.toLocaleString()}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 glass-card border border-slate-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Geral</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Members */}
        <div className="glass-card border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Novos Membros</h3>
            <button onClick={() => setActiveView('members')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {members.slice(0, 5).map((member) => (
              <div key={member.uid} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                {member.photoURL ? (
                  <img src={member.photoURL} alt={member.displayName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Users size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{member.displayName}</div>
                  <div className="text-xs text-slate-500 truncate">{member.email}</div>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${
                  member.role === 'admin' ? 'bg-red-50 text-red-700 border-red-100' :
                  member.role === 'pastor' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                  'bg-slate-50 text-slate-600 border-slate-100'
                }`}>
                  {member.role}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="glass-card border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Próximos Eventos</h3>
            <button onClick={() => setActiveView('events')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              Ver todos <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex flex-col items-center justify-center text-indigo-600 shrink-0">
                  <span className="text-[10px] font-bold uppercase">{new Date(event.date as any).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                  <span className="text-lg font-bold leading-none">{new Date(event.date as any).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{event.title}</div>
                  <div className="text-xs text-slate-500 truncate flex items-center gap-1">
                    <Calendar size={12} /> {new Date(event.date as any).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button className="text-slate-400 hover:text-indigo-600 p-2">
                  <MoreVertical size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">Gestão de Membros</h2>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar membros..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <button className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600">
            <Filter size={18} />
          </button>
        </div>
      </div>

      <div className="glass-card border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Membro</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Função</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Desde</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.map((member) => (
                <tr key={member.uid} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt={member.displayName} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <Users size={20} />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900">{member.displayName}</div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateMemberRole(member.uid, e.target.value)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border outline-none cursor-pointer transition-all ${
                        member.role === 'admin' ? 'bg-red-50 text-red-700 border-red-100' :
                        member.role === 'pastor' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        member.role === 'leader' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        'bg-slate-50 text-slate-600 border-slate-100'
                      }`}
                    >
                      <option value="member">Membro</option>
                      <option value="leader">Líder</option>
                      <option value="pastor">Pastor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(member.createdAt as any).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ path: 'users', id: member.uid })}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMinistries = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">Ministérios</h2>
        <button 
          onClick={() => setIsAddingMinistry(true)}
          className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Novo Ministério
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ministries.map((ministry) => (
          <div key={ministry.id} className="glass-card border border-slate-200 p-6 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Briefcase size={24} />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEditingMinistry(ministry)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => setConfirmDelete({ path: `churches/${churchId}/ministries`, id: ministry.id })}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{ministry.name}</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">Liderado por: {members.find(m => m.uid === ministry.leaderId)?.displayName || 'Líder não definido'}</p>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="flex -space-x-2">
                {ministry.members.slice(0, 3).map((memberId, i) => {
                  const member = members.find(m => m.uid === memberId);
                  return (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                      {member?.photoURL ? (
                        <img src={member.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Users size={14} className="text-slate-400" />
                      )}
                    </div>
                  );
                })}
                {ministry.members.length > 3 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    +{ministry.members.length - 3}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setActiveMinistry(ministry);
                  setActiveView('ministry_schedules');
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                Escalas <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
        {ministries.length === 0 && (
          <div className="col-span-full py-20 text-center glass-card border border-slate-200 border-dashed">
            <p className="text-slate-500">Nenhum ministério cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderMinistrySchedules = () => {
    if (!activeMinistry) return null;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button 
                onClick={() => {
                  setActiveView('ministries');
                  setActiveMinistry(null);
                }}
                className="text-slate-400 hover:text-indigo-600 transition-colors"
              >
                Ministérios
              </button>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="text-sm font-medium text-slate-600">{activeMinistry.name}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Escalas de Voluntários</h2>
          </div>
          <button 
            onClick={() => setIsAddingSchedule(true)}
            className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Nova Escala
          </button>
        </div>

        <div className="glass-card border border-slate-200 overflow-hidden">
          {schedules.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={24} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhuma escala definida</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                Crie escalas para organizar os voluntários do ministério {activeMinistry.name} nos próximos eventos.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {schedules.map(schedule => (
                <div key={schedule.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-slate-900">{schedule.eventTitle}</h4>
                      <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <Calendar size={14} />
                        {new Date(schedule.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setEditingSchedule(schedule)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ path: `churches/${churchId}/schedules`, id: schedule.id })}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {schedule.roles.map((role: any, idx: number) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                          {role.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase">{role.roleName}</div>
                          <div className="text-sm font-medium text-slate-900">{role.userName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCells = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">Células / Grupos Pequenos</h2>
        <button 
          onClick={() => setIsAddingCell(true)}
          className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Nova Célula
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cells.map((cell) => (
          <div key={cell.id} className="glass-card border border-slate-200 p-6 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Home size={24} />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEditingCell(cell)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => setConfirmDelete({ path: `churches/${churchId}/cells`, id: cell.id })}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{cell.name}</h3>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Users size={14} /> Líder: {members.find(m => m.uid === cell.leaderId)?.displayName || 'Não definido'}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar size={14} /> {cell.meetingDay} às {cell.meetingTime}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Search size={14} /> {cell.address}
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Ativa</span>
              <span className="text-xs font-medium text-slate-400">{cell.members.length} membros</span>
            </div>
          </div>
        ))}
        {cells.length === 0 && (
          <div className="col-span-full py-20 text-center glass-card border border-slate-200 border-dashed">
            <p className="text-slate-500">Nenhuma célula cadastrada.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-900">Eventos da Igreja</h2>
        <button 
          onClick={() => setIsAddingEvent(true)}
          className="btn-primary px-4 py-2 flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Novo Evento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <div key={event.id} className="glass-card border border-slate-200 overflow-hidden flex flex-col sm:flex-row">
            {event.bannerUrl ? (
              <img src={event.bannerUrl} alt={event.title} className="w-full sm:w-48 h-48 object-cover" />
            ) : (
              <div className="w-full sm:w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400">
                <Calendar size={48} />
              </div>
            )}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold uppercase mt-1">
                    <Calendar size={12} />
                    {new Date(event.date as any).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setEditingEvent(event)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => setConfirmDelete({ path: `churches/${churchId}/events`, id: event.id })}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">{event.description}</p>
              <div className="mt-auto flex items-center justify-between">
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <Search size={12} /> {event.location}
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                  event.isPublic ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                }`}>
                  {event.isPublic ? 'Público' : 'Interno'}
                </span>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-span-full py-20 text-center glass-card border border-slate-200 border-dashed">
            <p className="text-slate-500">Nenhum evento cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderFinances = () => {
    const processChartData = () => {
      const monthlyData: Record<string, { name: string; income: number; expense: number }> = {};
      const incomeByCategory: Record<string, number> = {};
      const expenseByCategory: Record<string, number> = {};

      finances.forEach(t => {
        const date = new Date(t.date as any);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = { name: monthName, income: 0, expense: 0 };
        }

        if (t.type === 'income') {
          monthlyData[monthYear].income += t.amount;
          incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
        } else {
          monthlyData[monthYear].expense += t.amount;
          expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
        }
      });

      const sortedMonths = Object.keys(monthlyData).sort().slice(-6).map(k => monthlyData[k]);
      
      const incomePie = Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
      const expensePie = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

      return { sortedMonths, incomePie, expensePie };
    };

    const { sortedMonths, incomePie, expensePie } = processChartData();
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
    const EXPENSE_COLORS = ['#ef4444', '#f97316', '#eab308', '#d946ef', '#6366f1', '#06b6d4'];

    return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Gestão Financeira</h2>
          <p className="text-sm text-slate-500">Acompanhe entradas e saídas da igreja.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setInitialFinanceType('expense');
              setIsAddingFinance(true);
            }}
            className="btn-secondary px-4 py-2 flex items-center gap-2 text-sm border-red-200 text-red-600 hover:bg-red-50"
          >
            <ArrowDownRight size={16} /> Nova Saída
          </button>
          <button 
            onClick={() => {
              setInitialFinanceType('income');
              setIsAddingFinance(true);
            }}
            className="btn-primary px-4 py-2 flex items-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-700 border-emerald-500"
          >
            <ArrowUpRight size={16} /> Nova Entrada
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 glass-card border border-slate-200">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Entradas</div>
          <div className="text-2xl font-bold text-emerald-600">
            R$ {finances.filter(f => f.type === 'income').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
          </div>
        </div>
        <div className="p-6 glass-card border border-slate-200">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Saídas</div>
          <div className="text-2xl font-bold text-red-600">
            R$ {finances.filter(f => f.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
          </div>
        </div>
        <div className="p-6 glass-card border border-slate-200 bg-slate-900 text-white">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">Saldo Atual</div>
          <div className="text-2xl font-bold">
            R$ {stats.balance.toLocaleString()}
          </div>
        </div>
      </div>

      {finances.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-6">Fluxo de Caixa (Últimos 6 meses)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedMonths} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString()}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="income" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expense" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-6">Despesas por Categoria</h3>
            <div className="h-64 flex items-center justify-center">
              {expensePie.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePie}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expensePie.map((entry, index) => (
                        <RechartsCell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `R$ ${value.toLocaleString()}`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-sm">Nenhuma despesa registrada.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="glass-card border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 font-bold text-slate-900">Transações Recentes</div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Data</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Descrição</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Valor</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {finances.sort((a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime()).map((transaction) => (
                <tr key={transaction.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(transaction.date as any).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{transaction.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                      {transaction.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setEditingFinance(transaction)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ path: `churches/${churchId}/finances`, id: transaction.id })}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {finances.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500">Nenhuma transação registrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Admin Header */}
      <header className="bg-white border-b border-slate-200 p-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Painel Administrativo</h1>
            <p className="text-sm text-slate-500">Gerencie sua igreja e acompanhe o crescimento.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary px-4 py-2 flex items-center gap-2 text-sm">
              <ArrowUpRight size={16} /> Exportar Relatório
            </button>
            <button className="btn-primary px-4 py-2 flex items-center gap-2 text-sm">
              <Plus size={16} /> Novo Registro
            </button>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex items-center gap-8 overflow-x-auto no-scrollbar">
            {[
              { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
              { id: 'members', label: 'Membros', icon: Users },
              { id: 'ministries', label: 'Ministérios', icon: Briefcase },
              { id: 'cells', label: 'Células', icon: Home },
              { id: 'events', label: 'Eventos', icon: Calendar },
              { id: 'finances', label: 'Financeiro', icon: DollarSign }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as AdminView)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-all text-sm font-medium whitespace-nowrap ${
                  activeView === item.id 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Admin Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 font-medium animate-pulse">Carregando dados administrativos...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeView === 'dashboard' && renderDashboard()}
                {activeView === 'members' && renderMembers()}
                {activeView === 'ministries' && renderMinistries()}
                {activeView === 'ministry_schedules' && renderMinistrySchedules()}
                {activeView === 'cells' && renderCells()}
                {activeView === 'events' && renderEvents()}
                {activeView === 'finances' && renderFinances()}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>
      {/* Modals */}
      <AddMemberModal
        isOpen={isAddingMember}
        onClose={() => setIsAddingMember(false)}
        churchId={churchId}
        onSuccess={() => showToast('Membro adicionado com sucesso!')}
        onError={(msg) => showToast(msg, 'error')}
      />
      <AddMinistryModal 
        isOpen={isAddingMinistry || !!editingMinistry} 
        onClose={() => {
          setIsAddingMinistry(false);
          setEditingMinistry(undefined);
        }} 
        churchId={churchId} 
        item={editingMinistry}
        onSuccess={() => showToast(editingMinistry ? 'Ministério atualizado com sucesso!' : 'Ministério criado com sucesso!')}
        onError={(msg) => showToast(msg, 'error')}
      />
      <AddCellModal 
        isOpen={isAddingCell || !!editingCell} 
        onClose={() => {
          setIsAddingCell(false);
          setEditingCell(undefined);
        }} 
        churchId={churchId} 
        item={editingCell}
        onSuccess={() => showToast(editingCell ? 'Célula atualizada com sucesso!' : 'Célula criada com sucesso!')}
        onError={(msg) => showToast(msg, 'error')}
      />
      <AddEventModal 
        isOpen={isAddingEvent} 
        onClose={() => setIsAddingEvent(false)} 
        churchId={churchId} 
        onSuccess={() => showToast('Evento criado com sucesso!')}
        onError={(msg) => showToast(msg, 'error')}
      />
      <AddEventModal 
        isOpen={!!editingEvent} 
        onClose={() => setEditingEvent(undefined)} 
        churchId={churchId} 
        item={editingEvent}
        onSuccess={() => showToast('Evento atualizado com sucesso!')}
        onError={(msg) => showToast(msg, 'error')}
      />
      <AddFinanceModal 
        isOpen={isAddingFinance || !!editingFinance} 
        onClose={() => {
          setIsAddingFinance(false);
          setEditingFinance(undefined);
        }} 
        churchId={churchId} 
        item={editingFinance}
        initialType={initialFinanceType}
        onSuccess={() => showToast(editingFinance ? 'Transação atualizada com sucesso!' : 'Transação adicionada com sucesso!')}
        onError={(msg) => showToast(msg, 'error')}
      />
      {activeMinistry && (
        <AddScheduleModal
          isOpen={isAddingSchedule || !!editingSchedule}
          onClose={() => {
            setIsAddingSchedule(false);
            setEditingSchedule(undefined);
          }}
          churchId={churchId}
          ministryId={activeMinistry.id}
          scheduleToEdit={editingSchedule}
          onSuccess={() => showToast(editingSchedule ? 'Escala atualizada com sucesso!' : 'Escala criada com sucesso!')}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            if (confirmDelete.path === 'users') {
              handleRemoveMember(confirmDelete.id);
            } else {
              handleDelete(confirmDelete.path, confirmDelete.id);
            }
          }
        }}
        title={confirmDelete?.path === 'users' ? "Remover Membro" : "Confirmar Exclusão"}
        message={confirmDelete?.path === 'users' ? "Tem certeza que deseja remover este membro da igreja?" : "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."}
        confirmText={confirmDelete?.path === 'users' ? "Remover" : "Excluir"}
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
