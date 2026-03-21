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
  id: number;
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

export interface EBDClass {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  category: string;
  description: string;
  studentCount: number;
  churchId: string;
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user' | 'pastor' | 'leader';
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

export interface Intercession {
  id: string;
  prayerRequestId: string;
  intercessorId: string;
  intercessorName: string;
  createdAt: any;
}
