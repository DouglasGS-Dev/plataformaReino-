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
  Timestamp,
  setDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { useOutletContext } from 'react-router-dom';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Calendar, 
  MoreVertical, 
  Trash2, 
  CheckCircle,
  X,
  UserCheck,
  MessageSquare,
  ArrowRight,
  History,
  Plus,
  ChevronRight,
  ChevronDown,
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Visitor, VisitorFollowUp } from '../../types';
import { toast } from 'sonner';

const INTEGRATION_STEPS = [
  { id: 'first_visit', label: 'Primeira Visita', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  { id: 'contacted', label: 'Contato Inicial', color: 'bg-amber-100 text-amber-700', icon: Phone },
  { id: 'visited_cell', label: 'Visita à Célula', color: 'bg-indigo-100 text-indigo-700', icon: Users },
  { id: 'enrolled_class', label: 'Curso Integração', color: 'bg-purple-100 text-purple-700', icon: Clock },
  { id: 'converted', label: 'Membro', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
];

export default function AdminVisitors() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [followUps, setFollowUps] = useState<VisitorFollowUp[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'funnel'>('list');
  
  const [newVisitor, setNewVisitor] = useState({
    name: '',
    phone: '',
    email: '',
    visitDate: new Date().toISOString().split('T')[0],
    invitedBy: '',
    notes: ''
  });

  const [newFollowUp, setNewFollowUp] = useState({
    type: 'call' as VisitorFollowUp['type'],
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!churchId) return;

    const q = query(
      collection(db, 'visitors'),
      where('churchId', '==', churchId),
      orderBy('visitDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const visitorsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Visitor[];
      setVisitors(visitorsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'visitors');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  useEffect(() => {
    if (!selectedVisitor) {
      setFollowUps([]);
      return;
    }

    const q = query(
      collection(db, 'visitor_follow_ups'),
      where('visitorId', '==', selectedVisitor.id),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const followUpsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VisitorFollowUp[];
      setFollowUps(followUpsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `visitor_follow_ups for visitor ${selectedVisitor.id}`);
    });

    return () => unsubscribe();
  }, [selectedVisitor]);

  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;

    try {
      await addDoc(collection(db, 'visitors'), {
        churchId,
        name: newVisitor.name,
        phone: newVisitor.phone,
        email: newVisitor.email,
        visitDate: Timestamp.fromDate(new Date(newVisitor.visitDate)),
        invitedBy: newVisitor.invitedBy,
        notes: newVisitor.notes,
        status: 'new',
        integrationStep: 'first_visit',
        createdAt: serverTimestamp()
      });

      setIsModalOpen(false);
      setNewVisitor({
        name: '',
        phone: '',
        email: '',
        visitDate: new Date().toISOString().split('T')[0],
        invitedBy: '',
        notes: ''
      });
      toast.success('Visitante registrado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'visitors');
      toast.error('Erro ao registrar visitante.');
    }
  };

  const handleUpdateStep = async (visitorId: string, step: Visitor['integrationStep']) => {
    try {
      await updateDoc(doc(db, 'visitors', visitorId), { 
        integrationStep: step,
        status: step === 'converted' ? 'member' : 'followed_up',
        updatedAt: serverTimestamp()
      });
      toast.success('Progresso atualizado!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `visitors/${visitorId}`);
      toast.error('Erro ao atualizar progresso.');
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisitor || !churchId || !auth.currentUser) return;

    try {
      await addDoc(collection(db, 'visitor_follow_ups'), {
        visitorId: selectedVisitor.id,
        churchId,
        date: Timestamp.fromDate(new Date(newFollowUp.date)),
        type: newFollowUp.type,
        notes: newFollowUp.notes,
        performedBy: auth.currentUser.uid,
        performedByName: auth.currentUser.displayName || 'Admin',
        createdAt: serverTimestamp()
      });

      // Update visitor status if it was 'new'
      if (selectedVisitor.status === 'new') {
        await updateDoc(doc(db, 'visitors', selectedVisitor.id), {
          status: 'followed_up',
          integrationStep: selectedVisitor.integrationStep === 'first_visit' ? 'contacted' : selectedVisitor.integrationStep
        });
      }

      setNewFollowUp({
        type: 'call',
        notes: '',
        date: new Date().toISOString().split('T')[0]
      });
      toast.success('Acompanhamento registrado!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'visitor_follow_ups');
      toast.error('Erro ao registrar acompanhamento.');
    }
  };

  const handleConvertToMember = async (visitor: Visitor) => {
    if (!churchId) return;
    if (!window.confirm(`Deseja converter ${visitor.name} em membro oficial?`)) return;

    try {
      // 1. Create user profile
      const userRef = doc(collection(db, 'users'));
      await setDoc(userRef, {
        uid: userRef.id,
        email: visitor.email || `${visitor.name.toLowerCase().replace(/\s+/g, '.')}@temp.com`,
        displayName: visitor.name,
        phone: visitor.phone,
        role: 'user',
        status: 'active',
        churchId,
        tags: ['Membro Novo'],
        createdAt: serverTimestamp()
      });

      // 2. Update visitor status
      await updateDoc(doc(db, 'visitors', visitor.id), {
        status: 'member',
        integrationStep: 'converted',
        updatedAt: serverTimestamp()
      });

      toast.success(`${visitor.name} agora é um membro!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users/visitors');
      toast.error('Erro ao converter visitante em membro.');
    }
  };

  const handleDeleteVisitor = async (visitorId: string) => {
    if (!window.confirm('Excluir este registro de visitante? Todos os acompanhamentos vinculados também serão excluídos.')) return;
    try {
      const batch = writeBatch(db);
      
      // 1. Delete the visitor
      batch.delete(doc(db, 'visitors', visitorId));
      
      // 2. Delete all follow-ups for this visitor
      const followUpsSnapshot = await getDocs(query(collection(db, 'visitor_follow_ups'), where('visitorId', '==', visitorId)));
      followUpsSnapshot.forEach(d => batch.delete(d.ref));
      
      await batch.commit();
      toast.success('Registro excluído.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `visitors/${visitorId}`);
      toast.error('Erro ao excluir registro.');
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone?.includes(searchTerm)
  );

  const getStepBadge = (step: string) => {
    const stepInfo = INTEGRATION_STEPS.find(s => s.id === step);
    if (!stepInfo) return null;
    return (
      <span className={`${stepInfo.color} px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 w-fit`}>
        <stepInfo.icon className="w-3 h-3" />
        {stepInfo.label}
      </span>
    );
  };

  const getFunnelStats = () => {
    return INTEGRATION_STEPS.map(step => ({
      ...step,
      count: visitors.filter(v => v.integrationStep === step.id).length
    }));
  };

  return (
    <div className="p-0 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gestão de Visitantes</h1>
          <p className="text-slate-500">Funil de integração e acompanhamento</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Lista
            </button>
            <button 
              onClick={() => setViewMode('funnel')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'funnel' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Funil
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none primary-gradient text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-sm"
          >
            <UserPlus className="w-5 h-5" />
            Novo Visitante
          </button>
        </div>
      </div>

      {/* Funnel Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {getFunnelStats().map((step, index) => (
          <div key={step.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 opacity-5 transition-transform group-hover:scale-110`}>
              <step.icon className="w-full h-full" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{step.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold text-slate-900">{step.count}</h3>
              {index < INTEGRATION_STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 hidden md:block" />
              )}
            </div>
          </div>
        ))}
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold">
                  <th className="px-6 py-4">Visitante</th>
                  <th className="px-6 py-4">Data da Visita</th>
                  <th className="px-6 py-4">Estágio no Funil</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredVisitors.length > 0 ? (
                  filteredVisitors.map((visitor) => (
                    <tr key={visitor.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{visitor.name}</span>
                          <div className="flex items-center gap-3 mt-1">
                            {visitor.phone && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {visitor.phone}
                              </span>
                            )}
                            {visitor.email && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {visitor.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          {visitor.visitDate?.toDate ? visitor.visitDate.toDate().toLocaleDateString('pt-BR') : 'N/A'}
                        </div>
                        {visitor.invitedBy && (
                          <div className="text-[10px] text-slate-400 mt-0.5 uppercase font-medium">Por: {visitor.invitedBy}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {getStepBadge(visitor.integrationStep || 'first_visit')}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {INTEGRATION_STEPS.map((step) => (
                              <button
                                key={step.id}
                                onClick={() => handleUpdateStep(visitor.id, step.id as any)}
                                className={`w-2 h-2 rounded-full ${visitor.integrationStep === step.id ? 'bg-primary' : 'bg-slate-200 hover:bg-slate-300'}`}
                                title={step.label}
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setSelectedVisitor(visitor);
                              setIsFollowUpModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary-50 rounded-xl transition-all"
                            title="Acompanhamento"
                          >
                            <History className="w-5 h-5" />
                          </button>
                          {visitor.integrationStep !== 'converted' && (
                            <button
                              onClick={() => handleConvertToMember(visitor)}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Converter em Membro"
                            >
                              <UserCheck className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteVisitor(visitor.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Nenhum visitante encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {INTEGRATION_STEPS.map((step) => (
            <div key={step.id} className="flex flex-col gap-4">
              <div className={`p-3 rounded-2xl ${step.color} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <step.icon className="w-4 h-4" />
                  <span className="text-sm font-bold uppercase tracking-tight">{step.label}</span>
                </div>
                <span className="text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full">
                  {visitors.filter(v => v.integrationStep === step.id).length}
                </span>
              </div>
              
              <div className="space-y-3">
                {visitors
                  .filter(v => v.integrationStep === step.id)
                  .map(visitor => (
                    <div key={visitor.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => {
                      setSelectedVisitor(visitor);
                      setIsFollowUpModalOpen(true);
                    }}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{visitor.name}</h4>
                        <button className="text-slate-300 group-hover:text-primary transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        {visitor.phone && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {visitor.phone}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {visitor.visitDate?.toDate ? visitor.visitDate.toDate().toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                {visitors.filter(v => v.integrationStep === step.id).length === 0 && (
                  <div className="border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center">
                    <p className="text-xs text-slate-300">Vazio</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Visitor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Novo Visitante</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateVisitor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input
                  required
                  type="text"
                  value={newVisitor.name}
                  onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={newVisitor.phone}
                    onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data da Visita</label>
                  <input
                    required
                    type="date"
                    value={newVisitor.visitDate}
                    onChange={(e) => setNewVisitor({ ...newVisitor, visitDate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newVisitor.email}
                  onChange={(e) => setNewVisitor({ ...newVisitor, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Convidado por</label>
                <input
                  type="text"
                  value={newVisitor.invitedBy}
                  onChange={(e) => setNewVisitor({ ...newVisitor, invitedBy: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                <textarea
                  value={newVisitor.notes}
                  onChange={(e) => setNewVisitor({ ...newVisitor, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none h-24 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full primary-gradient text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                Registrar Visitante
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {isFollowUpModalOpen && selectedVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{selectedVisitor.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {getStepBadge(selectedVisitor.integrationStep || 'first_visit')}
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">{selectedVisitor.phone}</span>
                </div>
              </div>
              <button onClick={() => setIsFollowUpModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white rounded-full transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* New Follow-up Form */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  Novo Acompanhamento
                </h3>
                <form onSubmit={handleAddFollowUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</label>
                      <select
                        value={newFollowUp.type}
                        onChange={(e) => setNewFollowUp({ ...newFollowUp, type: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                      >
                        <option value="call">Ligação</option>
                        <option value="message">Mensagem (WhatsApp)</option>
                        <option value="visit">Visita</option>
                        <option value="other">Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data</label>
                      <input
                        type="date"
                        value={newFollowUp.date}
                        onChange={(e) => setNewFollowUp({ ...newFollowUp, date: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notas do Contato</label>
                    <textarea
                      required
                      placeholder="O que foi conversado?"
                      value={newFollowUp.notes}
                      onChange={(e) => setNewFollowUp({ ...newFollowUp, notes: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm h-20 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-slate-900 text-white py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all"
                  >
                    Salvar Acompanhamento
                  </button>
                </form>
              </div>

              {/* Follow-up History */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Histórico de Contatos
                </h3>
                <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {followUps.length > 0 ? (
                    followUps.map((log) => (
                      <div key={log.id} className="relative pl-10">
                        <div className="absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-primary z-10" />
                        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                {log.type === 'call' ? 'Ligação' : log.type === 'message' ? 'Mensagem' : log.type === 'visit' ? 'Visita' : 'Outro'}
                              </span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">
                                {log.date?.toDate ? log.date.toDate().toLocaleDateString('pt-BR') : 'N/A'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Por: {log.performedByName}</span>
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">{log.notes}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="pl-10 py-4">
                      <p className="text-sm text-slate-400 italic">Nenhum histórico registrado ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => handleConvertToMember(selectedVisitor)}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
              >
                <UserCheck className="w-5 h-5" />
                Converter em Membro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
