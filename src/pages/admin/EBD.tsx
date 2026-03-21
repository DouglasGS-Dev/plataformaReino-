import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Plus, Search, Calendar, ChevronRight, GraduationCap, Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { AddEBDClassModal } from '../../components/AdminModals';

interface EBDClass {
  id: string;
  name: string;
  teacherName: string;
  studentCount: number;
  category: string;
  description?: string;
}

export default function EBD() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [classes, setClasses] = useState<EBDClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<EBDClass | undefined>();

  useEffect(() => {
    if (!churchId) return;

    const q = query(
      collection(db, 'ebd_classes'),
      where('churchId', '==', churchId),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EBDClass)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching EBD classes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta classe?')) {
      try {
        await deleteDoc(doc(db, 'ebd_classes', id));
      } catch (error) {
        console.error("Error deleting class:", error);
      }
    }
  };

  const handleEdit = (c: EBDClass) => {
    setSelectedClass(c);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedClass(undefined);
    setIsModalOpen(true);
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Escola Bíblica Dominical</h2>
          <p className="text-slate-500 mt-1">Gerencie as classes, lições e frequência dos alunos.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Nova Classe
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <BookOpen className="text-indigo-600" size={20} />
            </div>
            <h3 className="text-slate-500 font-medium">Total de Classes</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{classes.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="text-emerald-600" size={20} />
            </div>
            <h3 className="text-slate-500 font-medium">Total de Alunos</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {classes.reduce((acc, curr) => acc + (curr.studentCount || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <GraduationCap className="text-orange-600" size={20} />
            </div>
            <h3 className="text-slate-500 font-medium">Professores Ativos</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {new Set(classes.map(c => c.teacherName)).size}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar classe ou professor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Classe</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Professor</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700">Categoria</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-center">Alunos</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Carregando classes...
                  </td>
                </tr>
              ) : filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma classe encontrada.
                  </td>
                </tr>
              ) : (
                filteredClasses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{c.name}</div>
                      {c.description && <div className="text-xs text-slate-500 truncate max-w-xs">{c.description}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{c.teacherName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {c.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">
                      {c.studentCount}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(c)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <ChevronRight size={20} />
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

      <AddEBDClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        churchId={churchId}
        item={selectedClass}
      />
    </div>
  );
}
