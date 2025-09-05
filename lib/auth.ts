'use server';
import { cookies } from 'next/headers';
import { supabase } from './supabaseClient';

/**
 * Creates a new user account with Supabase Auth and stores additional profile information.
 * 
 * This function handles the complete user registration process by:
 * 1. Creating a new user account in Supabase Auth with email and password
 * 2. Storing additional profile data (username, phone) in the user metadata
 * 3. Triggering the creation of a corresponding profile record in the profiles table
 * 
 * The profile creation is handled by a database trigger that automatically creates
 * a profile record when a new user is created in auth.users.
 * 
 * @param {Object} params - User registration parameters
 * @param {string} params.email - User's email address (must be unique)
 * @param {string} params.password - User's password (minimum 6 characters)
 * @param {string} params.username - User's chosen username (must be unique)
 * @param {string} params.phone - User's phone number
 * @returns {Promise<AuthResponse>} Supabase auth response containing user and session data
 * @throws {Error} Throws error if registration fails (email already exists, weak password, etc.)
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await signUp({
 *     email: 'user@example.com',
 *     password: 'securepassword123',
 *     username: 'johndoe',
 *     phone: '+1234567890'
 *   });
 *   console.log('User created:', result.user);
 * } catch (error) {
 *   console.error('Registration failed:', error.message);
 * }
 * ```
 */
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

/**
 * Authenticates a user with email and password, establishing a secure session.
 * 
 * This function handles the complete login process by:
 * 1. Validating user credentials against Supabase Auth
 * 2. Creating a secure session with JWT tokens
 * 3. Setting an HTTP-only cookie with the access token for session persistence
 * 4. Configuring cookie security settings based on environment (production vs development)
 * 
 * The cookie is set as HTTP-only to prevent XSS attacks and includes security flags
 * like SameSite and Secure (in production) to prevent CSRF attacks.
 * 
 * @param {Object} params - Login credentials
 * @param {string} params.email - User's email address
 * @param {string} params.password - User's password
 * @returns {Promise<AuthResponse>} Supabase auth response containing user and session data
 * @throws {Error} Throws error if login fails (invalid credentials, user not found, etc.)
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await login({
 *     email: 'user@example.com',
 *     password: 'userpassword'
 *   });
 *   console.log('Login successful:', result.user);
 * } catch (error) {
 *   console.error('Login failed:', error.message);
 * }
 * ```
 */
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

/**
 * Retrieves the current user session from HTTP-only cookies and validates the session.
 * 
 * This function is the core of the authentication system and is used throughout the app
 * to verify user authentication status. It:
 * 1. Extracts the JWT access token from HTTP-only cookies
 * 2. Validates the token with Supabase Auth to ensure it's still valid
 * 3. Returns the user object if the session is valid, null otherwise
 * 
 * This function is called by middleware, server components, and API routes to check
 * if a user is authenticated before allowing access to protected resources.
 * 
 * @returns {Promise<User | null>} User object if session is valid, null if not authenticated
 * 
 * @example
 * ```typescript
 * const user = await getSession();
 * if (user) {
 *   console.log('User is authenticated:', user.id);
 * } else {
 *   console.log('User is not authenticated');
 * }
 * ```
 */
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

/**
 * Signs out the current user by invalidating their session with Supabase Auth.
 * 
 * This function handles the logout process by calling Supabase's signOut method,
 * which invalidates the current session and clears any server-side session data.
 * Note: This function only handles server-side logout. Client-side cookie clearing
 * should be handled by the client component that calls this function.
 * 
 * @returns {Promise<void>} Resolves when logout is complete
 * @throws {Error} Throws error if logout fails
 * 
 * @example
 * ```typescript
 * try {
 *   await signOut();
 *   console.log('User signed out successfully');
 * } catch (error) {
 *   console.error('Logout failed:', error.message);
 * }
 * ```
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
