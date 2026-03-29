export type Category = 
  | 'Milagres' 
  | 'Livramentos' 
  | 'Desafios' 
  | 'Propósitos' 
  | 'Pedidos de oração' 
  | 'Orações respondidas' 
  | 'Lições espirituais' 
  | 'Gratidão' 
  | 'O que Deus falou comigo';

export type Impact = 'Baixo' | 'Médio' | 'Alto';

export interface SpiritualEntry {
  id: string;
  userId?: string;
  date: string;
  title: string;
  category: Category;
  description: string;
  lessonsLearned?: string;
  bibleVerse?: string;
  impact: Impact;
  isMemorial: boolean;
  media?: PostMedia[];
  aspectRatio?: '1:1' | '4:5' | '16:9' | '9:16';
  reminderAt?: string;
  notified?: boolean;
  shareWithCommunity?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Church {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: any;
  ownerId: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface EBDTrack {
  id: string;
  name: string;
  description: string;
  churchId: string;
  createdAt: any;
  order: number;
}

export interface EBDCourse {
  id: string;
  trackId: string;
  name: string;
  description: string;
  churchId: string;
  createdAt: any;
  order: number;
}

export interface EBDClass {
  id: string;
  courseId: string;
  name: string;
  teacherId: string;
  teacherName: string;
  category: string;
  description: string;
  thumbnailUrl?: string;
  churchId: string;
  createdAt: any;
  order: number;
}

export interface EBDLesson {
  id: string;
  classId: string;
  title: string;
  content: string;
  order: number;
  videoUrl?: string;
  duration?: string;
  createdAt: any;
}

export interface EBDEnrollment {
  id: string;
  userId: string;
  churchId: string;
  trackId?: string;
  courseId?: string;
  classId?: string;
  status: 'active' | 'completed';
  progress: number; // 0-100
  completedLessons: string[]; // Array of lesson IDs
  enrolledAt: any;
  updatedAt: any;
}

export interface EBDAttendance {
  id: string;
  classId: string;
  date: string; // ISO date YYYY-MM-DD
  presentStudents: string[]; // Array of user IDs
  churchId: string;
  createdAt: any;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user' | 'pastor' | 'leader';
  status: 'active' | 'inactive' | 'visitor';
  tags: string[];
  churchId?: string;
  bio?: string;
  phone?: string;
  birthDate?: string;
  ministry?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
  createdAt: any;
  updatedAt?: any;
}

export interface PostMedia {
  url: string;
  type: 'image' | 'video';
  objectFit?: 'cover' | 'contain';
  id?: string;
  name?: string;
  size?: number;
}

export interface Post {
  id: string;
  churchId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  type: 'prayer' | 'testimony' | 'announcement';
  likesCount: number;
  commentsCount?: number;
  createdAt: any;
  bibleVerse?: string;
  media?: PostMedia[];
  aspectRatio?: '1:1' | '4:5' | '16:9' | '9:16';
}


export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  authorRole?: string;
  content: string;
  createdAt: any;
}

export interface Ministry {
  id: string;
  name: string;
  leader: string;
  leaderId?: string;
  leaderName?: string;
  membersCount: number;
  members?: string[];
  description: string;
  churchId: string;
  createdAt: any;
}

export interface MinistrySchedule {
  id: string;
  ministryId: string;
  eventId: string;
  eventTitle: string;
  date: string;
  roles: {
    roleName: string;
    userId: string;
    userName: string;
  }[];
  churchId: string;
  createdAt: any;
}

export interface CellReport {
  id: string;
  cellId: string;
  date: any;
  attendance: number;
  visitors: number;
  notes: string;
  leaderId: string;
  churchId: string;
  createdAt: any;
}

export interface Cell {
  id: string;
  name: string;
  leader: string;
  leaderId?: string;
  leaderName?: string;
  host: string;
  address: string;
  membersCount: number;
  members?: string[];
  meetingDay?: string;
  meetingTime?: string;
  churchId: string;
  createdAt: any;
  reports?: CellReport[];
}

export interface Event {
  id: string;
  title: string;
  date: any;
  location: string;
  description: string;
  bannerUrl?: string;
  isPublic?: boolean;
  churchId: string;
  createdAt: any;
}

export interface FinancialTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: any;
  churchId: string;
  createdAt: any;
}

export interface PrayerRequest {
  id: string;
  churchId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  category: "Saúde" | "Família" | "Finanças" | "Espiritual" | "Outros";
  isPrivate: boolean;
  status: "active" | "answered";
  intercessorsCount: number;
  testimony?: string;
  createdAt: any;
  answeredAt?: any;
}

export interface Visitor {
  id: string;
  churchId: string;
  name: string;
  phone?: string;
  email?: string;
  visitDate: any;
  invitedBy?: string;
  status: 'new' | 'followed_up' | 'member' | 'inactive';
  integrationStep: 'first_visit' | 'contacted' | 'visited_cell' | 'enrolled_class' | 'converted';
  notes?: string;
  createdAt: any;
  updatedAt?: any;
}

export interface VisitorFollowUp {
  id: string;
  visitorId: string;
  churchId: string;
  date: any;
  type: 'call' | 'message' | 'visit' | 'other';
  notes: string;
  performedBy: string;
  performedByName: string;
  createdAt: any;
}

export interface PrayerCampaign {
  id: string;
  churchId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'draft';
  createdBy: string;
  createdByName: string;
  createdAt: any;
  participantsCount: number;
}

export interface PrayerCampaignParticipant {
  id: string;
  campaignId: string;
  userId: string;
  userName: string;
  createdAt: any;
}

export interface Intercession {
  id: string;
  prayerRequestId: string;
  intercessorId: string;
  intercessorName: string;
  createdAt: any;
}
