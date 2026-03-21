import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Users, MapPin, Calendar, Clock, User as UserIcon } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useOutletContext } from 'react-router-dom';
import { AddCellModal } from '../../components/AdminModals';

interface Cell {
  id: string;
  name: string;
  leaderName: string;
  leaderId: string;
  address: string;
  dayOfWeek: string;
  time: string;
  membersCount: number;
}

export default function Cells() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (!churchId) return;

    const q = query(collection(db, 'cells'), where('churchId', '==', churchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cellsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Cell));
      setCells(cellsList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching cells:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  const filteredCells = cells.filter(cell => 
    cell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cell.leaderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cell.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Células / Grupos</h2>
          <p className="text-slate-500 mt-1">Gerencie os pequenos grupos e células da sua igreja.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Célula
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, líder ou endereço..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-900">{filteredCells.length}</span> células encontradas
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-slate-500 text-sm">Carregando células...</p>
            </div>
          ) : filteredCells.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCells.map((cell) => (
                <div key={cell.id} className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all relative">
                  <button className="absolute top-4 right-4 text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-lg hover:bg-slate-50">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{cell.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <UserIcon size={14} />
                        Líder: {cell.leaderName}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={16} className="text-slate-400" />
                      <span className="truncate">{cell.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={16} className="text-slate-400" />
                        {cell.dayOfWeek}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock size={16} className="text-slate-400" />
                        {cell.time}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {cell.membersCount || 0} Membros
                    </div>
                    <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Nenhuma célula encontrada</h3>
              <p className="text-slate-500 mt-1">Comece cadastrando sua primeira célula ou grupo pequeno.</p>
            </div>
          )}
        </div>
      </div>

      <AddCellModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        churchId={churchId} 
      />
    </div>
  );
}
