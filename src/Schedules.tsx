import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import { useOutletContext } from 'react-router-dom';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Users, 
  Clock, 
  ChevronRight,
  X,
  Check,
  UserPlus
} from 'lucide-react';

interface Schedule {
  id: string;
  churchId: string;
  ministryId: string;
  eventId: string;
  eventTitle: string;
  date: string;
  roles: {
    roleName: string;
    userId: string;
    userName: string;
  }[];
  createdAt: any;
}

interface Ministry {
  id: string;
  name: string;
  members: string[];
}

interface Event {
  id: string;
  title: string;
  date: any;
}

interface User {
  uid: string;
  displayName: string;
}

export default function AdminSchedules() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [churchUsers, setChurchUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newSchedule, setNewSchedule] = useState({
    ministryId: '',
    eventId: '',
    date: '',
    roles: [] as { roleName: string; userId: string; userName: string; }[]
  });

  useEffect(() => {
    if (!churchId) return;

    const q = query(
      collection(db, 'schedules'),
      where('churchId', '==', churchId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const schedulesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Schedule[];
      setSchedules(schedulesData);
      setLoading(false);
    });

    // Fetch ministries
    const qMinistries = query(collection(db, 'ministries'), where('churchId', '==', churchId));
    onSnapshot(qMinistries, (snap) => {
      setMinistries(snap.docs.map(d => ({ id: d.id, ...d.data() } as Ministry)));
    });

    // Fetch events
    const qEvents = query(collection(db, 'events'), where('churchId', '==', churchId));
    onSnapshot(qEvents, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Event)));
    });

    // Fetch users
    const qUsers = query(collection(db, 'users'), where('churchId', '==', churchId));
    onSnapshot(qUsers, (snap) => {
      setChurchUsers(snap.docs.map(d => ({ uid: d.id, displayName: d.data().displayName } as User)));
    });

    return () => unsubscribe();
  }, [churchId]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId || !newSchedule.ministryId || !newSchedule.eventId) return;

    const event = events.find(e => e.id === newSchedule.eventId);
    
    try {
      await addDoc(collection(db, 'schedules'), {
        churchId,
        ministryId: newSchedule.ministryId,
        eventId: newSchedule.eventId,
        eventTitle: event?.title || 'Evento',
        date: newSchedule.date,
        roles: newSchedule.roles,
        createdAt: new Date().toISOString() // Using string as per rules
      });

      setIsModalOpen(false);
      setNewSchedule({ ministryId: '', eventId: '', date: '', roles: [] });
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('Excluir esta escala?')) return;
    try {
      await deleteDoc(doc(db, 'schedules', id));
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const addRole = () => {
    setNewSchedule({
      ...newSchedule,
      roles: [...newSchedule.roles, { roleName: '', userId: '', userName: '' }]
    });
  };

  const updateRole = (index: number, field: string, value: string) => {
    const updatedRoles = [...newSchedule.roles];
    if (field === 'userId') {
      const user = churchUsers.find(u => u.uid === value);
      updatedRoles[index] = { ...updatedRoles[index], userId: value, userName: user?.displayName || '' };
    } else {
      updatedRoles[index] = { ...updatedRoles[index], [field]: value };
    }
    setNewSchedule({ ...newSchedule, roles: updatedRoles });
  };

  const removeRole = (index: number) => {
    setNewSchedule({
      ...newSchedule,
      roles: newSchedule.roles.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="p-0 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Escalas</h1>
          <p className="text-slate-500">Organize as equipes para os eventos</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto primary-gradient text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Nova Escala
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900">{schedule.eventTitle}</h3>
                  <button
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(schedule.date).toLocaleDateString('pt-BR')}
                  <Clock className="w-3.5 h-3.5 ml-2" />
                  {new Date(schedule.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="p-4 flex-1">
                <div className="space-y-3">
                  {schedule.roles.map((role, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{role.roleName}</span>
                      <span className="font-medium text-slate-900">{role.userName}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Ministério: {ministries.find(m => m.id === schedule.ministryId)?.name || 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-900">Nova Escala</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ministério</label>
                  <select
                    required
                    value={newSchedule.ministryId}
                    onChange={(e) => setNewSchedule({ ...newSchedule, ministryId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="">Selecione um ministério</option>
                    {ministries.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Evento</label>
                  <select
                    required
                    value={newSchedule.eventId}
                    onChange={(e) => setNewSchedule({ ...newSchedule, eventId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="">Selecione um evento</option>
                    {events.map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data e Hora</label>
                <input
                  required
                  type="datetime-local"
                  value={newSchedule.date}
                  onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">Funções e Voluntários</h3>
                  <button
                    type="button"
                    onClick={addRole}
                    className="text-primary text-sm font-bold flex items-center gap-1 hover:text-primary/80 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Função
                  </button>
                </div>

                <div className="space-y-3">
                  {newSchedule.roles.map((role, idx) => (
                    <div key={idx} className="flex gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Função</label>
                        <input
                          type="text"
                          value={role.roleName}
                          onChange={(e) => updateRole(idx, 'roleName', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                          placeholder="Ex: Recepcionista"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Voluntário</label>
                        <select
                          value={role.userId}
                          onChange={(e) => updateRole(idx, 'userId', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                        >
                          <option value="">Selecione...</option>
                          {churchUsers.map(u => (
                            <option key={u.uid} value={u.uid}>{u.displayName}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRole(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 sticky bottom-0 bg-white">
                <button
                  type="submit"
                  className="w-full primary-gradient text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  Salvar Escala
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
