import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, Clock, ChevronRight, CheckCircle2, PlayCircle, Lock, Search, Filter, ArrowLeft, CheckCircle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, doc, getDoc, updateDoc, setDoc, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { useOutletContext } from 'react-router-dom';

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
}

interface EBDLesson {
  id: string;
  classId: string;
  title: string;
  content: string;
  videoUrl?: string;
  duration?: string;
  order: number;
}

interface Enrollment {
  id: string;
  userId: string;
  churchId: string;
  trackId?: string;
  courseId?: string;
  classId?: string;
  status: 'active' | 'completed';
  progress: number;
  completedLessons?: string[];
  enrolledAt: any;
  updatedAt: any;
}

export default function EBD() {
  const { churchId } = useOutletContext<{ churchId: string }>();
  const [tracks, setTracks] = useState<EBDTrack[]>([]);
  const [courses, setCourses] = useState<EBDCourse[]>([]);
  const [classes, setClasses] = useState<EBDClass[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'tracks' | 'courses' | 'classes' | 'lessons' | 'attendance'>('tracks');
  const [selectedTrack, setSelectedTrack] = useState<EBDTrack | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<EBDCourse | null>(null);
  const [selectedClass, setSelectedClass] = useState<EBDClass | null>(null);
  const [lessons, setLessons] = useState<EBDLesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<EBDLesson | null>(null);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [myClassesAsTeacher, setMyClassesAsTeacher] = useState<EBDClass[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecord, setAttendanceRecord] = useState<any | null>(null);
  const [classEnrollments, setClassEnrollments] = useState<any[]>([]);
  const [savingAttendance, setSavingAttendance] = useState(false);

  useEffect(() => {
    if (!churchId || !auth.currentUser) return;

    const tracksQuery = query(collection(db, 'ebd_tracks'), where('churchId', '==', churchId), orderBy('order', 'asc'));
    const coursesQuery = query(collection(db, 'ebd_courses'), where('churchId', '==', churchId), orderBy('order', 'asc'));
    const classesQuery = query(collection(db, 'ebd_classes'), where('churchId', '==', churchId), orderBy('order', 'asc'));

    const unsubscribeTracks = onSnapshot(tracksQuery, 
      (snapshot) => setTracks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EBDTrack))),
      (error) => handleFirestoreError(error, OperationType.GET, 'ebd_tracks')
    );
    const unsubscribeCourses = onSnapshot(coursesQuery, 
      (snapshot) => setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EBDCourse))),
      (error) => handleFirestoreError(error, OperationType.GET, 'ebd_courses')
    );
    const unsubscribeClasses = onSnapshot(classesQuery, 
      (snapshot) => {
        const fetchedClasses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EBDClass));
        setClasses(fetchedClasses);
        setMyClassesAsTeacher(fetchedClasses.filter(c => c.teacherId === auth.currentUser?.uid));
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'ebd_classes')
    );

    // Fetch user enrollments
    const enrollmentsQuery = query(collection(db, 'ebd_enrollments'), where('userId', '==', auth.currentUser.uid));
    const unsubscribeEnrollments = onSnapshot(enrollmentsQuery, 
      (snapshot) => {
        setMyEnrollments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Enrollment)));
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'ebd_enrollments')
    );

    return () => {
      unsubscribeTracks();
      unsubscribeCourses();
      unsubscribeClasses();
      unsubscribeEnrollments();
    };
  }, [churchId]);

  useEffect(() => {
    if (view === 'attendance' && selectedClass && attendanceDate) {
      const q = query(
        collection(db, 'ebd_attendance'),
        where('classId', '==', selectedClass.id),
        where('date', '==', attendanceDate)
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          if (!snapshot.empty) {
            setAttendanceRecord({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
          } else {
            setAttendanceRecord(null);
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'ebd_attendance')
      );

      // Fetch enrollments for this class to show students
      const enrollmentsQuery = query(
        collection(db, 'ebd_enrollments'),
        where('classId', '==', selectedClass.id)
      );

      const unsubscribeEnrollments = onSnapshot(enrollmentsQuery, 
        async (snapshot) => {
          try {
            const enrollmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const withUsers = await Promise.all(enrollmentsData.map(async (e: any) => {
              const userDoc = await getDoc(doc(db, 'users', e.userId));
              return { ...e, user: userDoc.exists() ? userDoc.data() : { displayName: 'Usuário Desconhecido' } };
            }));
            setClassEnrollments(withUsers);
          } catch (error) {
            handleFirestoreError(error, OperationType.GET, 'ebd_enrollments_with_users');
          }
        },
        (error) => handleFirestoreError(error, OperationType.GET, 'ebd_enrollments')
      );

      return () => {
        unsubscribe();
        unsubscribeEnrollments();
      };
    }
  }, [view, selectedClass, attendanceDate]);

  const handleToggleAttendance = async (userId: string) => {
    if (!selectedClass || !churchId) return;
    setSavingAttendance(true);
    try {
      const currentPresent = attendanceRecord?.presentStudents || [];
      const isPresent = currentPresent.includes(userId);
      const newPresent = isPresent 
        ? currentPresent.filter((id: string) => id !== userId)
        : [...currentPresent, userId];

      if (attendanceRecord) {
        await updateDoc(doc(db, 'ebd_attendance', attendanceRecord.id), {
          presentStudents: newPresent,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'ebd_attendance'), {
          classId: selectedClass.id,
          date: attendanceDate,
          presentStudents: newPresent,
          churchId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, attendanceRecord ? OperationType.UPDATE : OperationType.CREATE, 'ebd_attendance');
    } finally {
      setSavingAttendance(false);
    }
  };

  const fetchLessons = async (classId: string) => {
    try {
      const q = query(
        collection(db, `ebd_classes/${classId}/lessons`),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      const lessonsData = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as EBDLesson));
      setLessons(lessonsData);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `ebd_classes/${classId}/lessons`);
    }
  };

  const handleEnroll = async (type: 'track' | 'course' | 'class', id: string) => {
    if (!auth.currentUser) return;
    setEnrolling(id);
    try {
      const enrollmentData: any = {
        userId: auth.currentUser.uid,
        churchId,
        status: 'active',
        progress: 0,
        completedLessons: [],
        enrolledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      if (type === 'track') enrollmentData.trackId = id;
      else if (type === 'course') enrollmentData.courseId = id;
      else enrollmentData.classId = id;
      
      await addDoc(collection(db, 'ebd_enrollments'), enrollmentData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ebd_enrollments');
    } finally {
      setEnrolling(null);
    }
  };

  const handleMarkAsComplete = async (lessonId: string) => {
    if (!selectedClass || !auth.currentUser) return;
    const enrollment = getEnrollment('class', selectedClass.id);
    if (!enrollment) return;

    setCompleting(true);
    try {
      const completedLessons = enrollment.completedLessons || [];
      if (!completedLessons.includes(lessonId)) {
        const newCompleted = [...completedLessons, lessonId];
        const progress = Math.round((newCompleted.length / lessons.length) * 100);
        
        await updateDoc(doc(db, 'ebd_enrollments', enrollment.id), {
          completedLessons: newCompleted,
          progress,
          status: progress === 100 ? 'completed' : 'active',
          updatedAt: serverTimestamp()
        });
      }
      setActiveLesson(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'ebd_enrollments');
    } finally {
      setCompleting(false);
    }
  };

  const isEnrolled = (type: 'track' | 'course' | 'class', id: string) => {
    if (type === 'track') return myEnrollments.some(e => e.trackId === id);
    if (type === 'course') return myEnrollments.some(e => e.courseId === id);
    return myEnrollments.some(e => e.classId === id);
  };

  const getEnrollment = (type: 'track' | 'course' | 'class', id: string) => {
    if (type === 'track') return myEnrollments.find(e => e.trackId === id);
    if (type === 'course') return myEnrollments.find(e => e.courseId === id);
    return myEnrollments.find(e => e.classId === id);
  };

  const isLessonCompleted = (lessonId: string) => {
    if (!selectedClass) return false;
    const enrollment = getEnrollment('class', selectedClass.id);
    return enrollment?.completedLessons?.includes(lessonId) || false;
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatVideoUrl = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  };

  if (activeLesson) {
    const videoEmbedUrl = formatVideoUrl(activeLesson.videoUrl || '');
    return (
      <div className="space-y-6 pb-20">
        <button 
          onClick={() => setActiveLesson(null)}
          className="flex items-center text-primary font-medium hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="mr-1" size={20} />
          Voltar para Lições
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {videoEmbedUrl && (
            <div className="aspect-video bg-black relative">
              <iframe
                src={videoEmbedUrl}
                className="w-full h-full"
                allowFullScreen
                title={activeLesson.title}
              />
            </div>
          )}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{activeLesson.title}</h2>
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
              <span className="flex items-center gap-1"><Clock size={16} /> {activeLesson.duration || "15 min"}</span>
              <span className="flex items-center gap-1"><BookOpen size={16} /> Lição {activeLesson.order}</span>
            </div>
            
            <div className="prose prose-slate max-w-none">
              <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">
                {activeLesson.content}
              </p>
            </div>
          </div>
        </div>

        <div className="fixed bottom-24 left-6 right-6 md:left-auto md:right-10 md:w-96">
          <button 
            onClick={() => handleMarkAsComplete(activeLesson.id)}
            disabled={completing || isLessonCompleted(activeLesson.id)}
            className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
              isLessonCompleted(activeLesson.id) 
                ? 'bg-emerald-100 text-emerald-700 cursor-default' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            {completing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLessonCompleted(activeLesson.id) ? (
              <><CheckCircle size={20} /> Lição Concluída</>
            ) : (
              <><CheckCircle2 size={20} /> Marcar como Concluída</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Hierarchical Views
  return (
    <div className="space-y-8 pb-20">
      <header>
        <h2 className="text-3xl font-bold text-slate-900">Escola Bíblica</h2>
        <p className="text-slate-500 mt-1">Cresça no conhecimento da Palavra de Deus.</p>
      </header>

      {/* Breadcrumbs/Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <button onClick={() => { setView('tracks'); setSelectedTrack(null); setSelectedCourse(null); setSelectedClass(null); }} className="hover:text-primary">Trilhas</button>
        {selectedTrack && (
          <>
            <ChevronRight size={16} />
            <button onClick={() => { setView('courses'); setSelectedCourse(null); setSelectedClass(null); }} className="hover:text-primary">{selectedTrack.name}</button>
          </>
        )}
        {selectedCourse && (
          <>
            <ChevronRight size={16} />
            <button onClick={() => { setView('classes'); setSelectedClass(null); }} className="hover:text-primary">{selectedCourse.name}</button>
          </>
        )}
        {selectedClass && (
          <>
            <ChevronRight size={16} />
            <button onClick={() => setView('lessons')} className="hover:text-primary">{selectedClass.name}</button>
          </>
        )}
      </div>

      {view === 'tracks' && myClassesAsTeacher.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-primary" size={24} />
            <h3 className="text-xl font-bold text-slate-900">Minhas Classes (Professor)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClassesAsTeacher.map(c => (
              <motion.div 
                key={c.id} 
                whileTap={{ scale: 0.98 }} 
                className="bg-primary/5 p-6 rounded-3xl border border-primary/20 shadow-sm transition-all"
              >
                <h4 className="font-bold text-slate-900">{c.name}</h4>
                <p className="text-sm text-slate-500 mt-1">{c.category}</p>
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => { setSelectedClass(c); setView('attendance'); }} 
                    className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Fazer Chamada
                  </button>
                  <button 
                    onClick={() => { setSelectedClass(c); fetchLessons(c.id); setView('lessons'); }} 
                    className="flex-1 py-2 bg-white text-primary border border-primary/20 rounded-xl font-bold text-sm hover:bg-primary/5"
                  >
                    Ver Lições
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {view === 'tracks' && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Trilhas de Crescimento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tracks.map(track => {
              const enrolled = isEnrolled('track', track.id);
              const enrollment = getEnrollment('track', track.id);
              return (
                <motion.div key={track.id} whileTap={{ scale: 0.98 }} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all">
                  <h4 className="font-bold text-slate-900">{track.name}</h4>
                  <p className="text-sm text-slate-500 mt-1">{track.description}</p>
                  {enrolled ? (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1"><span>Progresso</span><span>{enrollment?.progress || 0}%</span></div>
                      <div className="h-2 bg-slate-100 rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: `${enrollment?.progress || 0}%` }} /></div>
                      <button onClick={() => { setSelectedTrack(track); setView('courses'); }} className="mt-3 text-primary text-sm font-bold hover:underline">Continuar</button>
                    </div>
                  ) : (
                    <button onClick={() => handleEnroll('track', track.id)} disabled={enrolling === track.id} className="mt-4 w-full py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90">
                      {enrolling === track.id ? 'Matriculando...' : 'Matricular-se'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {view === 'attendance' && selectedClass && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('tracks')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-slate-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Chamada: {selectedClass.name}</h2>
              <p className="text-sm text-slate-500">Marque a presença dos alunos para o dia selecionado.</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="text-primary" size={20} />
                <input 
                  type="date" 
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div className="text-sm font-medium text-slate-500 bg-slate-50 px-4 py-2 rounded-xl">
                {attendanceRecord?.presentStudents?.length || 0} presentes de {classEnrollments.length} alunos
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {classEnrollments.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  Nenhum aluno matriculado nesta classe.
                </div>
              ) : (
                classEnrollments.map((e) => {
                  const isPresent = attendanceRecord?.presentStudents?.includes(e.userId);
                  return (
                    <div key={e.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                          {e.user?.displayName?.charAt(0) || e.user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{e.user?.displayName || e.user?.name}</div>
                          <div className="text-xs text-slate-500">{e.user?.email}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleToggleAttendance(e.userId)}
                        disabled={savingAttendance}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                          isPresent 
                            ? 'bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-100' 
                            : 'bg-slate-50 text-slate-300 hover:bg-slate-100 border border-slate-100'
                        }`}
                      >
                        {isPresent ? <CheckCircle size={28} /> : <div className="w-6 h-6 rounded-full border-2 border-slate-200" />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {view === 'courses' && selectedTrack && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Cursos em {selectedTrack.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.filter(c => c.trackId === selectedTrack.id).map(course => {
              const enrolled = isEnrolled('course', course.id);
              const enrollment = getEnrollment('course', course.id);
              return (
                <motion.div key={course.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all">
                  <h4 className="font-bold text-slate-900">{course.name}</h4>
                  <p className="text-sm text-slate-500 mt-1">{course.description}</p>
                  {enrolled ? (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1"><span>Progresso</span><span>{enrollment?.progress || 0}%</span></div>
                      <div className="h-2 bg-slate-100 rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: `${enrollment?.progress || 0}%` }} /></div>
                      <button onClick={() => { setSelectedCourse(course); setView('classes'); }} className="mt-3 text-primary text-sm font-bold hover:underline">Continuar</button>
                    </div>
                  ) : (
                    <button onClick={() => handleEnroll('course', course.id)} disabled={enrolling === course.id} className="mt-4 w-full py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90">
                      {enrolling === course.id ? 'Matriculando...' : 'Matricular-se'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {view === 'classes' && selectedCourse && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Classes em {selectedCourse.name}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.filter(c => c.courseId === selectedCourse.id).map(c => {
              const enrolled = isEnrolled('class', c.id);
              const enrollment = getEnrollment('class', c.id);
              return (
                <motion.div key={c.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                  <div className="p-5">
                    <h4 className="font-bold text-slate-900">{c.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">Prof. {c.teacherName}</p>
                    {enrolled ? (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1"><span>Progresso</span><span>{enrollment?.progress || 0}%</span></div>
                        <div className="h-2 bg-slate-100 rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: `${enrollment?.progress || 0}%` }} /></div>
                        <button onClick={() => { setSelectedClass(c); fetchLessons(c.id); setView('lessons'); }} className="mt-3 text-primary text-sm font-bold hover:underline">Continuar</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEnroll('class', c.id)} disabled={enrolling === c.id} className="mt-4 w-full py-2 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90">
                        {enrolling === c.id ? 'Matriculando...' : 'Matricular-se'}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
      
      {view === 'lessons' && selectedClass && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Lições de {selectedClass.name}</h3>
            <span className="text-sm text-slate-500">{lessons.length} lições</span>
          </div>
          {lessons.map((lesson, index) => (
            <motion.div key={lesson.id} onClick={() => setActiveLesson(lesson)} className="bg-white p-4 rounded-2xl border border-slate-200 cursor-pointer hover:border-primary/30">
              <h4 className="font-bold text-slate-900">{lesson.title}</h4>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
