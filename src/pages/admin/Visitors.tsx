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
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
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
  MessageSquare
} from 'lucide-react';

interface Visitor {
  id: string;
  churchId: string;
  name: string;
  phone?: string;
  email?: string;
  visitDate: any;
  invitedBy?: string;
  status: 'new' | 'followed_up' | 'member' | 'inactive';
  notes?: string;
  createdAt: any;
}

export default function AdminVisitors() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    name: '',
    phone: '',
    email: '',
    visitDate: new Date().toISOString().split('T')[0],
    invitedBy: '',
    notes: ''
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
    });

    return () => unsubscribe();
  }, [churchId]);

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
    } catch (error) {
      console.error('Error creating visitor:', error);
    }
  };

  const handleUpdateStatus = async (visitorId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'visitors', visitorId), { status });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteVisitor = async (visitorId: string) => {
    if (!window.confirm('Excluir este registro de visitante?')) return;
    try {
      await deleteDoc(doc(db, 'visitors', visitorId));
    } catch (error) {
      console.error('Error deleting visitor:', error);
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone?.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Novo</span>;
      case 'followed_up': return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Acompanhado</span>;
      case 'member': return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Membro</span>;
      case 'inactive': return <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Inativo</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Visitantes</h1>
          <p className="text-slate-500">Acompanhe e integre novos visitantes</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Novo Visitante
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold">
                <th className="px-6 py-4">Visitante</th>
                <th className="px-6 py-4">Data da Visita</th>
                <th className="px-6 py-4">Convidado por</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredVisitors.length > 0 ? (
                filteredVisitors.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-slate-50/50 transition-colors">
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
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">{visitor.invitedBy || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(visitor.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleUpdateStatus(visitor.id, 'followed_up')}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                          title="Marcar como acompanhado"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(visitor.id, 'member')}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                          title="Marcar como membro"
                        >
                          <UserCheck className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteVisitor(visitor.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhum visitante registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={newVisitor.phone}
                    onChange={(e) => setNewVisitor({ ...newVisitor, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data da Visita</label>
                  <input
                    required
                    type="date"
                    value={newVisitor.visitDate}
                    onChange={(e) => setNewVisitor({ ...newVisitor, visitDate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newVisitor.email}
                  onChange={(e) => setNewVisitor({ ...newVisitor, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Convidado por</label>
                <input
                  type="text"
                  value={newVisitor.invitedBy}
                  onChange={(e) => setNewVisitor({ ...newVisitor, invitedBy: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                <textarea
                  value={newVisitor.notes}
                  onChange={(e) => setNewVisitor({ ...newVisitor, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none h-24 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
              >
                Registrar Visitante
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
