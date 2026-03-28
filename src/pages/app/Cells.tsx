import React, { useState, useEffect } from 'react';
import { Users, MapPin, Calendar, Clock, Search, ChevronRight, User as UserIcon, MessageCircle, Navigation, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useOutletContext } from 'react-router-dom';
import CellChat from '../../components/CellChat';

interface Cell {
  id: string;
  name: string;
  leaderName: string;
  leaderId: string;
  address: string;
  dayOfWeek: string;
  time: string;
  membersCount: number;
  members?: string[];
  description?: string;
  neighborhood?: string;
}

export default function Cells() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!churchId) return;

    const q = query(collection(db, 'cells'), where('churchId', '==', churchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCells(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Cell)));
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
    cell.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cell.neighborhood && cell.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isMember = selectedCell && auth.currentUser && (
    selectedCell.leaderId === auth.currentUser.uid || 
    (selectedCell.members && selectedCell.members.includes(auth.currentUser.uid))
  );

  if (selectedCell) {
    return (
      <div className="space-y-6 pb-20">
        <button 
          onClick={() => {
            setSelectedCell(null);
            setShowChat(false);
          }}
          className="flex items-center text-primary font-medium"
        >
          <ChevronRight className="rotate-180 mr-1" size={20} />
          Voltar para Células
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-40 primary-gradient relative">
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-primary border-4 border-white">
                <Users size={40} />
              </div>
            </div>
          </div>
          <div className="pt-12 p-6">
            <h2 className="text-2xl font-bold text-slate-900">{selectedCell.name}</h2>
            <p className="text-slate-500 mt-1">Liderado por {selectedCell.leaderName}</p>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Calendar size={16} />
                  Dia
                </div>
                <p className="font-bold text-slate-900">{selectedCell.dayOfWeek}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Clock size={16} />
                  Horário
                </div>
                <p className="font-bold text-slate-900">{selectedCell.time}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Localização</h4>
                  <p className="text-slate-600 text-sm">{selectedCell.address}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Líder</h4>
                  <p className="text-slate-600 text-sm">{selectedCell.leaderName}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              {isMember ? (
                <button 
                  onClick={() => setShowChat(true)}
                  className="flex-1 py-4 primary-gradient text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20} />
                  Chat da Célula
                </button>
              ) : (
                <button className="flex-1 py-4 primary-gradient text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                  <Users size={20} />
                  Quero Participar
                </button>
              )}
              <button className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all">
                <Navigation size={24} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showChat && (
            <CellChat 
              cellId={selectedCell.id} 
              cellName={selectedCell.name} 
              onClose={() => setShowChat(false)} 
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Células</h2>
        <p className="text-slate-500 mt-1">Encontre um grupo pequeno perto de você.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar por bairro, líder ou nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm transition-all"
        />
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Carregando células...</div>
        ) : filteredCells.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Nenhuma célula encontrada.</div>
        ) : (
          filteredCells.map((cell, index) => (
            <motion.div
              key={cell.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCell(cell)}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Users size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 truncate">{cell.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {cell.dayOfWeek}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} />
                    {cell.time}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate flex items-center gap-1">
                  <MapPin size={12} />
                  {cell.address}
                </p>
              </div>
              <ChevronRight size={20} className="text-slate-300" />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
