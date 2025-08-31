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
    // First try to get the session directly from Supabase
    // Wrap in try/catch to handle AuthSessionMissingError specifically
    try {
      const cookieStore = await cookies();

      const token = cookieStore.get('auth_token');

      console.log(token);

      const { data: sessionData } = await supabase.auth.getUser(token?.value);
      console.log("session data");
      console.log(sessionData);
      // If we have a valid session with a user, return the user
      if (sessionData?.user) {
        console.log('Valid session found via Supabase');
        return sessionData.user;
      }
    } catch (sessionError) {
      // Log but continue to cookie fallback
      console.log('Error getting Supabase session:', sessionError);
      // Continue to cookie fallback
    }
    
    // Fallback to checking cookies
    const myCookies = cookies();
    const token = (await myCookies).get('auth_token');
    
    // If no token in cookies, return null immediately
    if (!token) {
      console.log('No auth token in cookies');
      return null;
    }
    
    // Try to get user with the token
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Session error:', error);
        return null;
      }
      
      if (!data?.user) {
        console.log('No user found with token');
        return null;
      }
      
      console.log('Valid user found via token');
      return data.user;
    } catch (userError) {
      console.error('Error getting user:', userError);
      return null;
    }
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
