import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { EBDTrack, EBDCourse, EBDClass, EBDLesson, EBDEnrollment } from '../types';

// --- Tracks ---
export const getTracks = async (churchId: string): Promise<EBDTrack[]> => {
  try {
    const q = query(collection(db, 'ebd_tracks'), where('churchId', '==', churchId), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EBDTrack));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'ebd_tracks');
    return [];
  }
};

// --- Courses ---
export const getCourses = async (trackId: string): Promise<EBDCourse[]> => {
  try {
    const q = query(collection(db, 'ebd_tracks', trackId, 'courses'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EBDCourse));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `ebd_tracks/${trackId}/courses`);
    return [];
  }
};

// --- Classes ---
export const getClasses = async (courseId: string): Promise<EBDClass[]> => {
  try {
    const q = query(collection(db, 'ebd_courses', courseId, 'classes'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EBDClass));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `ebd_courses/${courseId}/classes`);
    return [];
  }
};

// --- Lessons ---
export const getLessons = async (classId: string): Promise<EBDLesson[]> => {
  try {
    const q = query(collection(db, 'ebd_classes', classId, 'lessons'), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EBDLesson));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `ebd_classes/${classId}/lessons`);
    return [];
  }
};

// --- Enrollments ---
export const enrollUser = async (enrollment: Omit<EBDEnrollment, 'id' | 'progress' | 'completedLessons' | 'enrolledAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'ebd_enrollments'), {
      ...enrollment,
      progress: 0,
      completedLessons: [],
      enrolledAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'ebd_enrollments');
    throw error;
  }
};

export const updateProgress = async (enrollmentId: string, lessonId: string, totalLessons: number): Promise<void> => {
  try {
    const enrollmentRef = doc(db, 'ebd_enrollments', enrollmentId);
    const enrollmentSnap = await getDoc(enrollmentRef);
    
    if (!enrollmentSnap.exists()) throw new Error('Enrollment not found');
    
    const enrollment = enrollmentSnap.data() as EBDEnrollment;
    const completedLessons = enrollment.completedLessons || [];
    
    if (!completedLessons.includes(lessonId)) {
      const newCompleted = [...completedLessons, lessonId];
      const progress = Math.round((newCompleted.length / totalLessons) * 100);
      
      await updateDoc(enrollmentRef, {
        completedLessons: newCompleted,
        progress,
        status: progress === 100 ? 'completed' : 'active',
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `ebd_enrollments/${enrollmentId}`);
    throw error;
  }
};
