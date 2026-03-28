import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Plus, Search, Calendar, ChevronRight, GraduationCap, Edit2, Trash2, ArrowLeft, Play, FileText, Loader2, Save, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, addDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { AddEBDClassModal, AddEBDLessonModal, AddEBDCourseModal, AddEBDTrackModal } from '../../components/AdminModals';

interface EBDTrack {
  id: string;
  name: string;
  description?: string;
  churchId: string;
  order: number;
}

interface EBDCourse {
  id: string;
  trackId: string;
  name: string;
  description?: string;
  churchId: string;
  order: number;
}

interface EBDClass {
  id: string;
  courseId: string;
  churchId: string;
  name: string;
  teacherId: string;
  teacherName: string;
  category: string;
  description?: string;
  thumbnailUrl?: string;
  order: number;
  createdAt: any;
}

interface EBDLesson {
  id: string;
  classId: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration?: string;
  order: number;
  createdAt: any;
}

interface AttendanceRecord {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  presentStudents: string[]; // userIds
  churchId: string;
}

export default function EBD() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [classes, setClasses] = useState<EBDClass[]>([]);
  const [courses, setCourses] = useState<EBDCourse[]>([]);
  const [tracks, setTracks] = useState<EBDTrack[]>([]);
  const [lessons, setLessons] = useState<EBDLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<EBDClass | undefined>();
  const [selectedCourse, setSelectedCourse] = useState<EBDCourse | undefined>();
  const [selectedTrack, setSelectedTrack] = useState<EBDTrack | undefined>();
  const [selectedLesson, setSelectedLesson] = useState<EBDLesson | undefined>();
  const [view, setView] = useState<'tracks' | 'courses' | 'classes' | 'lessons' | 'students' | 'attendance'>('tracks');
  const [activeClass, setActiveClass] = useState<EBDClass | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecord, setAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    if (!churchId) return;

    const tracksQuery = query(
      collection(db, 'ebd_tracks'),
      where('churchId', '==', churchId),
      orderBy('order', 'asc')
    );

    const unsubscribeTracks = onSnapshot(tracksQuery, (snapshot) => {
      setTracks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EBDTrack)));
      setLoading(false);
    });

    const coursesQuery = query(
      collection(db, 'ebd_courses'),
      where('churchId', '==', churchId),
      orderBy('order', 'asc')
    );

    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EBDCourse)));
    });

    const classesQuery = query(
      collection(db, 'ebd_classes'),
      where('churchId', '==', churchId),
      orderBy('order', 'asc')
    );

    const unsubscribeClasses = onSnapshot(classesQuery, (snapshot) => {
      setClasses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EBDClass)));
    });

    return () => {
      unsubscribeTracks();
      unsubscribeCourses();
      unsubscribeClasses();
    };
  }, [churchId]);

  useEffect(() => {
    if (view === 'attendance' && activeClass && attendanceDate) {
      const q = query(
        collection(db, 'ebd_attendance'),
        where('classId', '==', activeClass.id),
        where('date', '==', attendanceDate)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setAttendanceRecord({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as AttendanceRecord);
        } else {
          setAttendanceRecord(null);
        }
      });

      return () => unsubscribe();
    }
  }, [view, activeClass, attendanceDate]);

  useEffect(() => {
    if (view === 'lessons' && activeClass) {
      const q = query(
        collection(db, `ebd_classes/${activeClass.id}/lessons`),
        orderBy('order', 'asc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setLessons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EBDLesson)));
      });

      return () => unsubscribe();
    }
  }, [view, activeClass]);

  useEffect(() => {
    if (view === 'students' && activeClass) {
      const q = query(
        collection(db, 'ebd_enrollments'),
        where('classId', '==', activeClass.id)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const enrollmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Fetch user details for each enrollment
        const withUsers = await Promise.all(enrollmentsData.map(async (e: any) => {
          const userDoc = await getDoc(doc(db, 'users', e.userId));
          return { ...e, user: userDoc.exists() ? userDoc.data() : { name: 'Usuário Desconhecido' } };
        }));

        setEnrollments(withUsers);
      });

      return () => unsubscribe();
    }
  }, [view, activeClass]);

  const handleToggleAttendance = async (userId: string) => {
    if (!activeClass || !churchId) return;
    setSavingAttendance(true);
    try {
      const currentPresent = attendanceRecord?.presentStudents || [];
      const isPresent = currentPresent.includes(userId);
      const newPresent = isPresent 
        ? currentPresent.filter(id => id !== userId)
        : [...currentPresent, userId];

      if (attendanceRecord) {
        await updateDoc(doc(db, 'ebd_attendance', attendanceRecord.id), {
          presentStudents: newPresent,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'ebd_attendance'), {
          classId: activeClass.id,
          date: attendanceDate,
          presentStudents: newPresent,
          churchId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este curso?')) {
      try {
        await deleteDoc(doc(db, 'ebd_courses', id));
      } catch (error) {
        console.error("Error deleting course:", error);
      }
    }
  };

  const handleEditCourse = (c: EBDCourse) => {
    setSelectedCourse(c);
    setIsCourseModalOpen(true);
  };

  const handleAddCourse = () => {
    setSelectedCourse(undefined);
    setIsCourseModalOpen(true);
  };

  const handleAddClass = () => {
    setSelectedClass(undefined);
    setIsModalOpen(true);
  };

  const handleEditClass = (c: EBDClass) => {
    setSelectedClass(c);
    setIsModalOpen(true);
  };

  const handleDeleteClass = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta classe?')) {
      try {
        await deleteDoc(doc(db, 'ebd_classes', id));
      } catch (error) {
        console.error("Error deleting class:", error);
      }
    }
  };

  const handleManageLessons = (c: EBDClass) => {
    setActiveClass(c);
    setView('lessons');
  };

  const handleAddLesson = () => {
    setSelectedLesson(undefined);
    setIsLessonModalOpen(true);
  };

  const handleEditLesson = (l: EBDLesson) => {
    setSelectedLesson(l);
    setIsLessonModalOpen(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!activeClass) return;
    if (window.confirm('Tem certeza que deseja excluir esta lição?')) {
      try {
        await deleteDoc(doc(db, `ebd_classes/${activeClass.id}/lessons`, lessonId));
      } catch (error) {
        console.error("Error deleting lesson:", error);
      }
    }
  };

  const handleEditTrack = (t: EBDTrack) => {
    setSelectedTrack(t);
    setIsTrackModalOpen(true);
  };

  const handleDeleteTrack = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta trilha?')) {
      try {
        await deleteDoc(doc(db, 'ebd_tracks', id));
      } catch (error) {
        console.error("Error deleting track:", error);
      }
    }
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if ((view === 'lessons' || view === 'students' || view === 'attendance') && activeClass) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('classes')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{activeClass.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <button 
                onClick={() => setView('lessons')}
                className={`text-sm font-medium px-3 py-1 rounded-full transition-all ${view === 'lessons' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Lições
              </button>
              <button 
                onClick={() => setView('students')}
                className={`text-sm font-medium px-3 py-1 rounded-full transition-all ${view === 'students' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Alunos
              </button>
              <button 
                onClick={() => setView('attendance')}
                className={`text-sm font-medium px-3 py-1 rounded-full transition-all ${view === 'attendance' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Presença
              </button>
            </div>
          </div>
          {view === 'lessons' && (
            <button 
              onClick={handleAddLesson}
              className="ml-auto btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Nova Lição
            </button>
          )}
        </div>

        {view === 'lessons' ? (
          <div className="grid grid-cols-1 gap-4">
            {lessons.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
                <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Nenhuma lição cadastrada</h3>
                <p className="text-slate-500 mb-6">Comece adicionando a primeira lição para esta classe.</p>
                <button onClick={handleAddLesson} className="btn-primary inline-flex items-center gap-2">
                  <Plus size={20} />
                  Adicionar Lição
                </button>
              </div>
            ) : (
              lessons.map((lesson) => (
                <div key={lesson.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-primary/30 transition-all group">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                    {lesson.order}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{lesson.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      {lesson.videoUrl && (
                        <span className="flex items-center gap-1 text-xs text-primary bg-primary-50 px-2 py-0.5 rounded-full">
                          <Play size={12} /> Vídeo
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <FileText size={12} /> {lesson.content.length} caracteres
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditLesson(lesson)}
                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : view === 'students' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">Aluno</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">Progresso</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Data Inscrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        Nenhum aluno matriculado nesta classe.
                      </td>
                    </tr>
                  ) : (
                    enrollments.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{e.user?.name}</div>
                          <div className="text-xs text-slate-500">{e.user?.email}</div>
                        </td>
                        <td className="px-6 py-4 min-w-[200px]">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all duration-500" 
                                style={{ width: `${e.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-500">{e.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            e.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-primary-100 text-primary-700'
                          }`}>
                            {e.status === 'completed' ? 'Concluído' : 'Ativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500 text-sm">
                          {e.enrolledAt?.toDate().toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Calendar className="text-slate-400" size={20} />
                <input 
                  type="date" 
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="text-sm text-slate-500">
                {attendanceRecord?.presentStudents?.length || 0} presentes de {enrollments.length} alunos
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-sm font-semibold text-slate-700">Aluno</th>
                      <th className="px-6 py-4 text-sm font-semibold text-slate-700 text-right">Presença</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollments.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-6 py-12 text-center text-slate-500">
                          Nenhum aluno matriculado nesta classe.
                        </td>
                      </tr>
                    ) : (
                      enrollments.map((e) => {
                        const isPresent = attendanceRecord?.presentStudents?.includes(e.userId);
                        return (
                          <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-900">{e.user?.name}</div>
                              <div className="text-xs text-slate-500">{e.user?.email}</div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleToggleAttendance(e.userId)}
                                disabled={savingAttendance}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                  isPresent 
                                    ? 'bg-emerald-100 text-emerald-600' 
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                {isPresent ? <CheckCircle2 size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-slate-300" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <AddEBDLessonModal
          isOpen={isLessonModalOpen}
          onClose={() => setIsLessonModalOpen(false)}
          classId={activeClass.id}
          churchId={churchId}
          item={selectedLesson}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Escola Bíblica Dominical</h2>
          <div className="flex items-center gap-4 mt-2">
            <button 
              onClick={() => setView('tracks')}
              className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${view === 'tracks' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Trilhas
            </button>
            <button 
              onClick={() => setView('courses')}
              className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${view === 'courses' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Cursos
            </button>
            <button 
              onClick={() => setView('classes')}
              className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${view === 'classes' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Classes
            </button>
          </div>
        </div>
        <button 
          onClick={view === 'tracks' ? () => { setSelectedTrack(undefined); setIsTrackModalOpen(true); } : view === 'courses' ? handleAddCourse : handleAddClass}
          className="w-full md:w-auto btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          {view === 'tracks' ? 'Nova Trilha' : view === 'courses' ? 'Novo Curso' : 'Nova Classe'}
        </button>
      </div>

      {view === 'tracks' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => (
            <div key={track.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primary/30 transition-all">
              <h4 className="font-bold text-slate-900 text-lg">{track.name}</h4>
              <p className="text-sm text-slate-500 mt-1">{track.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {courses.filter(c => c.trackId === track.id).length} Cursos
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setSelectedTrack(track); setView('courses'); }} className="text-primary text-sm font-bold hover:underline">Ver Cursos</button>
                  <button onClick={() => handleEditTrack(track)} className="text-slate-400 hover:text-primary"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteTrack(track.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : view === 'courses' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primary/30 transition-all">
              <h4 className="font-bold text-slate-900 text-lg">{course.name}</h4>
              <p className="text-sm text-slate-500 mt-1">{course.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {classes.filter(c => c.courseId === course.id).length} Classes
                </span>
                <button onClick={() => { setSelectedCourse(course); setView('classes'); }} className="text-primary text-sm font-bold hover:underline">Ver Classes</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-primary/30 transition-all">
              <h4 className="font-bold text-slate-900 text-lg">{c.name}</h4>
              <p className="text-sm text-slate-500 mt-1">{c.teacherName}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {c.category}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleManageLessons(c)} className="text-primary text-sm font-bold hover:underline">Lições</button>
                  <button onClick={() => handleEditClass(c)} className="text-slate-400 hover:text-primary"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteClass(c.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddEBDClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        churchId={churchId}
        item={selectedClass}
      />

      <AddEBDCourseModal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        churchId={churchId}
        item={selectedCourse}
      />

      <AddEBDTrackModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        churchId={churchId}
        item={selectedTrack}
      />
    </div>
  );
}
