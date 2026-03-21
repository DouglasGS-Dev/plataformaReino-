import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Clock, ChevronRight, CheckCircle2, PlayCircle, Lock, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useOutletContext } from 'react-router-dom';

interface EBDClass {
  id: string;
  name: string;
  teacherName: string;
  category: string;
  description?: string;
  thumbnailUrl?: string;
  churchId: string;
}

interface EBDLesson {
  id: string;
  title: string;
  content: string;
  order: number;
  videoUrl?: string;
  duration?: string;
}

interface Enrollment {
  id: string;
  classId: string;
  userId: string;
  status: 'active' | 'completed';
  progress: number;
  enrolledAt: any;
}

export default function EBD() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [classes, setClasses] = useState<EBDClass[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<EBDClass | null>(null);
  const [lessons, setLessons] = useState<EBDLesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<EBDLesson | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!churchId || !auth.currentUser) return;

    // Fetch all classes in the church
    const classesQuery = query(
      collection(db, 'ebd_classes'),
      where('churchId', '==', churchId)
    );

    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EBDClass)));
    });

    // Fetch user enrollments
    const enrollmentsQuery = query(
      collection(db, 'ebd_enrollments'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribeEnrollments = onSnapshot(enrollmentsQuery, (snapshot) => {
      setMyEnrollments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment)));
      setLoading(false);
    });

    return () => {
      unsubscribeClasses();
      unsubscribeEnrollments();
    };
  }, [churchId]);

  const fetchLessons = async (classId: string) => {
    const q = query(
      collection(db, `ebd_classes/${classId}/lessons`),
      where('order', '>=', 0)
    );
    const snapshot = await getDocs(q);
    const lessonsData = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as EBDLesson))
      .sort((a, b) => a.order - b.order);
    setLessons(lessonsData);
  };

  const handleEnroll = async (classId: string) => {
    if (!auth.currentUser) return;
    setEnrolling(true);
    try {
      await addDoc(collection(db, 'ebd_enrollments'), {
        classId,
        userId: auth.currentUser.uid,
        churchId,
        status: 'active',
        progress: 0,
        enrolledAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error enrolling:", error);
    } finally {
      setEnrolling(false);
    }
  };

  const isEnrolled = (classId: string) => {
    return myEnrollments.some(e => e.classId === classId);
  };

  const getEnrollment = (classId: string) => {
    return myEnrollments.find(e => e.classId === classId);
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedClass) {
    return (
      <div className="space-y-6 pb-20">
        <button 
          onClick={() => { setSelectedClass(null); setLessons([]); setActiveLesson(null); }}
          className="flex items-center text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
        >
          <ChevronRight className="rotate-180 mr-1" size={20} />
          Voltar para Classes
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-48 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-medium uppercase tracking-wider mb-2 inline-block">
                {selectedClass.category}
              </span>
              <h2 className="text-3xl font-bold">{selectedClass.name}</h2>
              <p className="text-indigo-100 flex items-center gap-2 mt-1">
                <GraduationCap size={18} />
                Prof. {selectedClass.teacherName}
              </p>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Sobre esta classe</h3>
            <p className="text-slate-600 leading-relaxed">
              {selectedClass.description || "Nenhuma descrição disponível para esta classe."}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Lições</h3>
            <span className="text-sm text-slate-500">{lessons.length} lições disponíveis</span>
          </div>

          {lessons.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
              <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500">Nenhuma lição cadastrada para esta classe ainda.</p>
              <button 
                onClick={() => fetchLessons(selectedClass.id)}
                className="mt-4 text-indigo-600 font-medium"
              >
                Tentar carregar novamente
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {lessons.map((lesson, index) => {
                const isLocked = !isEnrolled(selectedClass.id);
                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-4 ${isLocked ? 'opacity-75' : 'hover:border-indigo-300 cursor-pointer shadow-sm transition-all'}`}
                    onClick={() => !isLocked && setActiveLesson(lesson)}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isLocked ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>
                      {isLocked ? <Lock size={20} /> : <PlayCircle size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{lesson.title}</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <Clock size={12} />
                        {lesson.duration || "15 min"}
                      </p>
                    </div>
                    {!isLocked && (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center">
                        <ChevronRight size={16} className="text-slate-400" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {!isEnrolled(selectedClass.id) && (
          <div className="fixed bottom-24 left-6 right-6 md:left-auto md:right-10 md:w-96">
            <div className="bg-white p-6 rounded-3xl shadow-2xl border border-indigo-100 flex flex-col gap-4">
              <div>
                <h4 className="font-bold text-slate-900">Comece agora!</h4>
                <p className="text-sm text-slate-500">Inscreva-se para ter acesso a todas as lições e materiais.</p>
              </div>
              <button 
                onClick={() => handleEnroll(selectedClass.id)}
                disabled={enrolling}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
              >
                {enrolling ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Matricular-se Gratuitamente</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Escola Bíblica</h2>
        <p className="text-slate-500 mt-1">Cresça no conhecimento da Palavra de Deus.</p>
      </header>

      {/* Search and Filters */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text"
          placeholder="Buscar classes ou professores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none shadow-sm transition-all"
        />
      </div>

      {/* My Classes */}
      {myEnrollments.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Minhas Classes</h3>
            <button className="text-sm font-medium text-indigo-600">Ver todas</button>
          </div>
          <div className="grid gap-4">
            {myEnrollments.map(enrollment => {
              const classData = classes.find(c => c.id === enrollment.classId);
              if (!classData) return null;
              return (
                <motion.div 
                  key={enrollment.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedClass(classData); fetchLessons(classData.id); }}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 cursor-pointer hover:border-indigo-300 transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <BookOpen size={28} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{classData.name}</h4>
                    <p className="text-sm text-slate-500 mb-2">Prof. {classData.teacherName}</p>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-600">{enrollment.progress}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Available Classes */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Classes Disponíveis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500">Carregando classes...</div>
          ) : filteredClasses.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">Nenhuma classe encontrada.</div>
          ) : (
            filteredClasses.map(c => (
              <motion.div 
                key={c.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setSelectedClass(c); fetchLessons(c.id); }}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer hover:border-indigo-300 transition-all"
              >
                <div className="h-32 bg-slate-100 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/20" />
                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 bg-white/80 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {c.category}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{c.name}</h4>
                  <p className="text-sm text-slate-500 mt-1">Prof. {c.teacherName}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={14} />
                      12 Lições
                    </div>
                    {isEnrolled(c.id) ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle2 size={14} />
                        Inscrito
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-indigo-600">Ver detalhes</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
