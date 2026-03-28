import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar as CalendarIcon, MapPin, Clock, MoreVertical, Users } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useOutletContext } from 'react-router-dom';
import { AddEventModal } from '../../components/AdminModals';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
}

export default function Events() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (!churchId) return;

    const q = query(collection(db, 'events'), where('churchId', '==', churchId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Event));
      setEvents(eventsList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Eventos</h2>
          <p className="text-slate-500 mt-1">Organize cultos, conferências e atividades da igreja.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto flex items-center justify-center px-4 py-2 primary-gradient text-white rounded-lg hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Evento
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por título, local ou categoria..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-900">{filteredEvents.length}</span> eventos encontrados
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-slate-500 text-sm">Carregando eventos...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredEvents.map((event) => (
                <div key={event.id} className="flex flex-col sm:flex-row bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all group">
                  <div className="sm:w-48 h-48 sm:h-auto bg-slate-100 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                      <CalendarIcon size={48} />
                    </div>
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-primary uppercase tracking-wider shadow-sm">
                      {event.category}
                    </div>
                  </div>
                  
                  <div className="flex-1 p-5 relative">
                    <button className="absolute top-4 right-4 text-slate-400 hover:text-primary transition-colors p-1 rounded-lg hover:bg-slate-50">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors mb-2 pr-8">{event.title}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <CalendarIcon size={16} className="text-slate-400" />
                        {new Date(event.date).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock size={16} className="text-slate-400" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin size={16} className="text-slate-400" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Users size={14} />
                        <span>Inscrições abertas</span>
                      </div>
                      <button className="text-sm font-semibold text-primary hover:text-primary-700 transition-colors">
                        Gerenciar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <CalendarIcon size={32} />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Nenhum evento encontrado</h3>
              <p className="text-slate-500 mt-1">Crie seu primeiro evento para começar a organizar sua igreja.</p>
            </div>
          )}
        </div>
      </div>

      <AddEventModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        churchId={churchId} 
      />
    </div>
  );
}
