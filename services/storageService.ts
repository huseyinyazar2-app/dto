import { UserProfile, ChatSession } from '../types';
import { supabase } from './supabaseClient';

// --- LOCAL STORAGE & AUTH HELPERS ---

const STORAGE_KEY = 'dto_current_user';

export const getCurrentUser = (): UserProfile | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const loginUser = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Debug için log ekledik
    console.log(`Login attempt for: ${username}`);

    const { data, error } = await supabase
      .from('dto_users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error) {
        console.error('Supabase Login Error:', error);
        // RLS hatası genellikle P0001 veya 406 kodları ile döner
        if (error.code === 'PGRST116') {
             return { success: false, error: 'Kullanıcı adı veya şifre hatalı.' };
        }
        return { success: false, error: 'Bağlantı hatası: ' + error.message };
    }

    if (!data) {
      return { success: false, error: 'Kullanıcı adı veya şifre hatalı.' };
    }

    // Map DB response to UserProfile
    const userProfile: UserProfile = {
      id: data.id,
      username: data.username,
      role: data.role || 'user',
      name: data.full_name || '',
      age: data.age || '',
      gender: data.gender || 'Belirtilmemiş',
      maritalStatus: data.marital_status || 'Belirtilmemiş',
      job: data.job || '',
      notes: data.notes || ''
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile));
    return { success: true };
  } catch (err: any) {
    console.error('Unexpected Login Error:', err);
    return { success: false, error: err.message };
  }
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEY);
};

// --- Profile Management ---

export const getProfile = async (): Promise<UserProfile | null> => {
  // Always read from local storage first for speed/session
  const localUser = getCurrentUser();
  if (!localUser) return null;

  // Optionally sync with DB to get latest updates
  const { data, error } = await supabase
    .from('dto_users')
    .select('*')
    .eq('id', localUser.id)
    .single();

  if (error || !data) return localUser;

  const updatedProfile: UserProfile = {
    id: data.id,
    username: data.username,
    role: data.role,
    name: data.full_name || '',
    age: data.age || '',
    gender: data.gender || 'Belirtilmemiş',
    maritalStatus: data.marital_status || 'Belirtilmemiş',
    job: data.job || '',
    notes: data.notes || ''
  };

  // Update local storage silently
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
  
  return updatedProfile;
};

export const saveProfile = async (profile: UserProfile): Promise<void> => {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const updates = {
    full_name: profile.name,
    age: profile.age,
    gender: profile.gender,
    marital_status: profile.maritalStatus,
    job: profile.job,
    notes: profile.notes,
    updated_at: new Date()
  };

  const { error } = await supabase
    .from('dto_users')
    .update(updates)
    .eq('id', currentUser.id);
    
  if (!error) {
      // Update local storage as well
      const newProfile = { ...currentUser, ...profile };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
  }
};

// --- Session Management ---

export const getSessions = async (): Promise<ChatSession[]> => {
  const user = getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('dto_chat_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('last_updated', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }

  return data.map((s: any) => ({
    id: s.id,
    user_id: s.user_id,
    title: s.title,
    messages: (s.messages || []).map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp)
    })),
    lastUpdated: new Date(s.last_updated)
  }));
};

export const getSession = async (sessionId: string): Promise<ChatSession | null> => {
  const { data, error } = await supabase
    .from('dto_chat_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    messages: (data.messages || []).map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp)
    })),
    lastUpdated: new Date(data.last_updated)
  };
};

export const saveSession = async (session: ChatSession): Promise<string | null> => {
  const user = getCurrentUser();
  if (!user) return null;

  const messagesPayload = session.messages.map(m => ({
    ...m,
    timestamp: m.timestamp.toISOString()
  }));

  const isNewSession = session.id.length < 20; 

  const payload: any = {
    user_id: user.id, // Use the ID from our custom table
    title: session.title,
    messages: messagesPayload,
    last_updated: new Date()
  };

  if (!isNewSession) {
    payload.id = session.id;
  }

  const { data, error } = await supabase
    .from('dto_chat_sessions')
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error saving session:', error);
    return null;
  }

  return data.id;
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  await supabase
    .from('dto_chat_sessions')
    .delete()
    .eq('id', sessionId);
};

export const createNewSession = (): ChatSession => {
  return {
    id: Date.now().toString(),
    title: 'Yeni Sohbet',
    messages: [],
    lastUpdated: new Date()
  };
};

// --- Admin Features (Custom Table) ---

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('dto_users')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  // Map fields to match UserProfile structure for admin view
  return data.map((u: any) => ({
     id: u.id,
     username: u.username,
     password: u.password, // Visible for admin as requested
     role: u.role,
     name: u.full_name,
     created_at: u.created_at
  }));
};

export const deleteUser = async (userId: string) => {
  // First delete sessions
  await supabase.from('dto_chat_sessions').delete().eq('user_id', userId);
  // Then delete user
  const { error } = await supabase
    .from('dto_users')
    .delete()
    .eq('id', userId);
  
  if (error) throw error;
};

export const adminCreateUser = async (username: string, password: string) => {
    // Düzeltme: Burada da toLowerCase varsa kaldırılmalı veya olduğu gibi bırakılmalı
    const { error } = await supabase.from('dto_users').insert({
        username: username,
        password: password,
        role: 'user',
        full_name: username // Default name
    });
    if(error) throw error;
};