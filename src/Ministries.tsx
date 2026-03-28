import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, ChevronRight, Edit2, Trash2, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { AddMinistryModal } from './components/AdminModals';
import { Ministry } from './types';
import { toast } from 'sonner';

export default function Ministries() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const navigate = useNavigate();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | undefined>();

  useEffect(() => {
    if (!churchId) return;

    const q = query(
      collection(db, 'ministries'),
      where('churchId', '==', churchId),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMinistries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ministry)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching ministries:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este ministério?')) {
      try {
        await deleteDoc(doc(db, 'ministries', id));
        toast.success("Ministério excluído com sucesso!");
      } catch (error) {
        console.error("Error deleting ministry:", error);
        toast.error("Erro ao excluir ministério.");
      }
    }
  };

  const handleEdit = (m: Ministry) => {
    setSelectedMinistry(m);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedMinistry(undefined);
    setIsModalOpen(true);
  };

  const filteredMinistries = ministries.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.leaderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Ministérios</h2>
          <p className="text-slate-500 mt-1">Gerencie os departamentos e equipes da igreja.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Novo Ministério
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar ministério ou líder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Ministério</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Líder</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">Membros</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Carregando ministérios...
                  </td>
                </tr>
              ) : filteredMinistries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Nenhum ministério encontrado.
                  </td>
                </tr>
              ) : (
                filteredMinistries.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{m.name}</div>
                      {m.description && <div className="text-xs text-slate-500 truncate max-w-xs">{m.description}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{m.leaderName}</td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">
                      {m.membersCount || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(m)}
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(m.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button 
                          className="p-2 text-slate-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-all"
                          title="Ver Escalas"
                        >
                          <Calendar size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddMinistryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        churchId={churchId}
        item={selectedMinistry}
      />
    </div>
  );
}
