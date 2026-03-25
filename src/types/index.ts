// src/types/index.ts

// =====================
// API TYPES (optional fields allowed)
// =====================

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'jobseeker' | 'employer';
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  skills?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  twitter?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  experience?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: number;
}

export interface Application {
  id: number;
  job_id: number;
  user_id: number;
  title: string;
  company: string;
  status: 'pending' | 'reviewed' | 'interview' | 'rejected';
  applied_at: string;
  resume_url?: string;
}

export interface Conversation {
  friend_id: number;
  friend_name: string;
  last_message: string;
  unread_count: number;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
  read: boolean;
}

export interface Friend {
  id: number;
  friend_id: number;
  friend_name: string;
  friend_email: string;
  friend_role?: string;
  friend_bio?: string;
  created_at: string;
}

export interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  friend_name: string;
  friend_email: string;
  friend_role?: string;
  friend_bio?: string;
  created_at: string;
}

// =====================
// API RESPONSE
// =====================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  token?: string;
  user?: User;
}

// =====================
// AUTH TYPES
// =====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'jobseeker' | 'employer';
}

// =====================
// FORM TYPES (FIXED ❗ NO OPTIONALS)
// =====================

export interface JobFormData {
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  experience: string;
  description: string;
  requirements: string;
  benefits: string;
}

export interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  bio: string;
  skills: string;
  linkedin: string;
  github: string;
  website: string;
  twitter: string;
  current_password: string;
  new_password: string;
}