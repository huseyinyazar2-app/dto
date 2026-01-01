export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export enum ViewState {
  HOME = 'HOME',
  MENTOR = 'MENTOR',
  PROFILE = 'PROFILE',
  ADMIN = 'ADMIN'
}

export interface UserProfile {
  id: string;
  username: string;
  password?: string; // For admin view only
  role: 'user' | 'admin';
  name: string;
  age: string;
  gender: string;
  maritalStatus: string;
  job: string;
  notes: string;
}

export interface ChatSession {
  id: string;
  user_id?: string;
  title: string;
  messages: ChatMessage[];
  lastUpdated: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  icon: string;
  promptContext: string;
}