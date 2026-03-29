import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Search, ChevronRight, Users, Share2, Ticket, Filter, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { useOutletContext } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
  imageUrl?: string;
}

export default function Events() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeCategory, setActiveCategory] = useState('Todos');

  const categories = ['Todos', 'Culto', 'Conferência', 'Jovens', 'Infantil', 'Social'];

  useEffect(() => {
    if (!churchId) return;

    const q = query(
      collection(db, 'events'),
      where('churchId', '==', churchId),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'events');
      } catch (e) {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [churchId]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || event.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedEvent) {
    return (
      <div className="space-y-6 pb-20">
        <button 
          onClick={() => setSelectedEvent(null)}
          className="flex items-center text-primary font-medium"
        >
          <ChevronRight className="rotate-180 mr-1" size={20} />
          Voltar para Eventos
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-56 bg-slate-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-violet-500/20" />
            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
              <Calendar size={64} />
            </div>
            <div className="absolute top-6 left-6">
              <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-xs font-bold uppercase tracking-wider text-primary shadow-sm">
                {selectedEvent.category}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">{selectedEvent.title}</h2>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                  <Calendar size={18} className="text-primary" />
                  <span className="text-sm font-medium">{new Date(selectedEvent.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                  <Clock size={18} className="text-primary" />
                  <span className="text-sm font-medium">{selectedEvent.time}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Localização</h4>
                  <p className="text-slate-600 text-sm">{selectedEvent.location}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Detalhes</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{selectedEvent.description || "Nenhum detalhe adicional fornecido para este evento."}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <button className="flex-1 py-4 primary-gradient text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                <Ticket size={20} />
                Garantir Inscrição
              </button>
              <button className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all">
                <Share2 size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Eventos</h2>
          <p className="text-slate-500 mt-1">Fique por dentro do que acontece na igreja.</p>
        </div>
        <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-primary shadow-sm">
          <Calendar size={24} />
        </div>
      </header>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat 
                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                : 'bg-white text-slate-500 border border-slate-200 hover:border-primary/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Carregando eventos...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-500">Nenhum evento encontrado.</div>
        ) : (
          filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedEvent(event)}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row cursor-pointer hover:border-primary/30 transition-all group"
            >
              <div className="sm:w-40 h-40 sm:h-auto bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-violet-500/10" />
                <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                  <Calendar size={40} />
                </div>
                <div className="absolute top-3 left-3">
                  <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-primary uppercase tracking-wider shadow-sm">
                    {event.category}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight mb-2">
                    {event.title}
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar size={14} className="text-primary/60" />
                      {new Date(event.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock size={14} className="text-primary/60" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin size={14} className="text-primary/60" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <Users size={12} />
                    Inscrições Abertas
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
