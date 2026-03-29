import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Users, MapPin, Calendar, Clock, User as UserIcon, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot, deleteDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useOutletContext } from 'react-router-dom';
import { CellModal } from '../../components/AdminModals';
import { toast } from 'sonner';

interface Cell {
  id: string;
  name: string;
  leaderName: string;
  leaderId: string;
  address: string;
  meetingDay: string;
  meetingTime: string;
  memberCount: number;
}

const DAYS_MAP: { [key: string]: number } = {
  'Domingo': 0,
  'Segunda-feira': 1,
  'Terça-feira': 2,
  'Quarta-feira': 3,
  'Quinta-feira': 4,
  'Sexta-feira': 5,
  'Sábado': 6
};

function getNextMeeting(day: string, time: string) {
  const now = new Date();
  const targetDay = DAYS_MAP[day] ?? 0;
  const [hours, minutes] = time.split(':').map(Number);
  
  let nextMeeting = new Date();
  nextMeeting.setHours(hours, minutes, 0, 0);
  
  const currentDay = now.getDay();
  let daysUntil = (targetDay - currentDay + 7) % 7;
  
  if (daysUntil === 0 && nextMeeting < now) {
    daysUntil = 7;
  }
  
  nextMeeting.setDate(now.getDate() + daysUntil);
  
  const diffMs = nextMeeting.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  let status: 'soon' | 'today' | 'upcoming' = 'upcoming';
  if (daysUntil === 0) status = 'today';
  else if (diffHours < 48) status = 'soon';

  return {
    date: nextMeeting,
    status,
    formatted: nextMeeting.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) + ' às ' + time
  };
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
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const cellsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Cell));
        setCells(cellsList);
        setLoading(false);
      }, 
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'cells');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [churchId]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta célula? Todos os relatórios vinculados também serão excluídos.')) {
      try {
        const batch = writeBatch(db);
        
        // 1. Delete the cell itself
        batch.delete(doc(db, 'cells', id));
        
        // 2. Delete all reports for this cell
        const reportsSnapshot = await getDocs(query(collection(db, 'cell_reports'), where('cellId', '==', id)));
        reportsSnapshot.forEach(d => batch.delete(d.ref));
        
        await batch.commit();
        toast.success("Célula excluída com sucesso!");
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `cells/${id}`);
        toast.error("Erro ao excluir célula.");
      }
    }
  };

  const filteredCells = cells.filter(cell => 
    cell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cell.leaderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cell.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Células / Grupos</h2>
          <p className="text-slate-500 mt-1">Gerencie os pequenos grupos e células da sua igreja.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center px-4 py-2 primary-gradient text-white rounded-lg hover:opacity-90 transition-all shadow-sm"
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
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-slate-500 text-sm">Carregando células...</p>
            </div>
          ) : filteredCells.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCells.map((cell) => (
                <div key={cell.id} className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all relative">
                  <button 
                    onClick={() => handleDelete(cell.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-slate-50"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary shrink-0">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{cell.name}</h3>
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
                    
                    {cell.meetingDay && cell.meetingTime && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Próxima Reunião</span>
                          {(() => {
                            const next = getNextMeeting(cell.meetingDay, cell.meetingTime);
                            return (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                next.status === 'today' ? 'bg-emerald-100 text-emerald-600' :
                                next.status === 'soon' ? 'bg-amber-100 text-amber-600' :
                                'bg-slate-200 text-slate-600'
                              }`}>
                                {next.status === 'today' ? 'HOJE' : next.status === 'soon' ? 'EM BREVE' : 'AGENDADO'}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Calendar size={14} className="text-primary" />
                          {getNextMeeting(cell.meetingDay, cell.meetingTime).formatted}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 text-primary rounded-lg text-xs font-bold">
                      <Users size={12} />
                      {cell.memberCount || 0} Membros Ativos
                    </div>
                    <button className="text-sm font-semibold text-primary hover:text-primary-700 transition-colors">
                      Gerenciar
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

      <CellModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        churchId={churchId} 
      />
    </div>
  );
}
