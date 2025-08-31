'use server';
import { cookies } from 'next/headers';
import { supabase } from './supabaseClient';

export async function signUp({ email, password, username, phone }: { email: string; password: string; username: string; phone: string }) {
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: {
        username: username,
        phone_number: phone,
      }
    }
  });
  
  if (error) throw error;
  return data;
}

export async function login({ email, password }: { email: string; password: string }) {
  try {
    console.log('Login attempt for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      throw error;
    }
    
    if (!data.session) {
      throw new Error('No session returned after login');
    }
    
    // Set auth token in cookies - properly await cookies()
    const cookieStore = await cookies();
    cookieStore.set('auth_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
      sameSite: 'lax',
    });
    
    console.log('Login successful, auth token set in cookies');
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    
    if (!token?.value) {
      console.log('No auth token in cookies');
      return null;
    }
    
    // Use the token to get user info
    const { data, error } = await supabase.auth.getUser(token.value);
    
    if (error) {
      console.error('Error getting user from token:', error);
      return null;
    }
    
    if (!data?.user) {
      console.log('No user found with token');
      return null;
    }
    
    console.log('Valid user found:', data.user.id);
    return data.user;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
