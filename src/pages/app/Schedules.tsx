import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  doc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useOutletContext } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { motion } from 'motion/react';

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

export default function AppSchedules() {
  const { userProfile } = useOutletContext<{ userProfile: any }>();
  const [mySchedules, setMySchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || !userProfile?.churchId) return;

    // We can't easily query inside an array of objects in Firestore without a specific structure
    // So we'll fetch all schedules for the church and filter client-side for now (MVP)
    // In a real app, we'd have a separate collection for user_schedules or use a map
    
    const q = query(
      collection(db, 'schedules'),
      where('churchId', '==', userProfile.churchId),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allSchedules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Schedule[];
      
      const filtered = allSchedules.filter(s => 
        s.roles.some(r => r.userId === auth.currentUser?.uid) &&
        new Date(s.date) >= new Date() // Only future schedules
      );
      
      setMySchedules(filtered);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile?.churchId]);

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Minhas Escalas</h1>
        <p className="text-slate-500 text-sm">Confira seus compromissos nos ministérios</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : mySchedules.length > 0 ? (
        <div className="space-y-4">
          {mySchedules.map((schedule) => {
            const myRole = schedule.roles.find(r => r.userId === auth.currentUser?.uid);
            const eventDate = new Date(schedule.date);
            
            return (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600" />
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{schedule.eventTitle}</h3>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mt-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {myRole?.roleName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
                      {eventDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      {eventDate.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Clock className="w-4 h-4" />
                    {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <Users className="w-4 h-4" />
                    {schedule.roles.length} pessoas
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-2xl">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Equipe Completa</p>
                  <div className="flex flex-wrap gap-2">
                    {schedule.roles.map((role, idx) => (
                      <div key={idx} className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-medium text-slate-600">
                        <span className="font-bold text-slate-400">{role.roleName}:</span>
                        {role.userName}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-slate-900 font-medium">Nenhuma escala futura</h3>
          <p className="text-slate-500 text-sm max-w-[200px] mx-auto">Você não tem compromissos agendados no momento.</p>
        </div>
      )}

      <div className="mt-8 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-bold text-indigo-900 text-sm">Aviso Importante</h4>
            <p className="text-indigo-700 text-xs mt-1 leading-relaxed">
              Caso não possa comparecer ao seu compromisso, por favor avise seu líder de ministério com pelo menos 48h de antecedência.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
