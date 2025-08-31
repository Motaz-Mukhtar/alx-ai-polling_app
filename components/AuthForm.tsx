'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signUp, login } from '@/lib/auth';
import { redirect, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type FormData = {
  username?: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
};

type Props = {
  isSignup: boolean;
};

export default function AuthForm({ isSignup }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    if (isSignup && data.password !== data.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError(null);
      if (isSignup) {
        await signUp({
          email: data.email,
          password: data.password,
          username: data.username!,
          phone: data.phone!,
        });
        
        // Show success message and redirect to login
        console.log('Account created successfully!');
        router.push('/auth/login');
      } else {
        const response = await login({ email: data.email, password: data.password });
        console.log('Login response:', response);
        
        // Force a hard redirect to ensure the session is properly established
        window.location.href = '/polls';
      }
    } catch (err: unknown) {
      console.error('Authentication error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during authentication';
      setError(errorMessage);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header Section */}
      <div className="text-center mb-8">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl mx-auto flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isSignup ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p className="text-gray-600 text-lg">
          {isSignup ? 'Join us and start creating amazing polls' : 'Sign in to continue to your dashboard'}
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {isSignup && (
            <>
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                  Username
                </label>
                <input
                  {...register('username', { required: true })}
                  id="username"
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Username is required
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                <input
                  {...register('phone', { required: true })}
                  id="phone"
                  placeholder="Enter your phone number"
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Phone is required
                  </p>
                )}
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <input
              {...register('email', { required: true })}
              id="email"
              placeholder="Enter your email"
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            {errors.email && (
              <p className="text-red-500 text-sm flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Email is required
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
              Password
            </label>
            <input
              {...register('password', { required: true, minLength: 6 })}
              id="password"
              placeholder="Enter your password"
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            {errors.password && (
              <p className="text-red-500 text-sm flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Password must be at least 6 characters
              </p>
            )}
          </div>
          
          {isSignup && (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword', { required: true })}
                id="confirmPassword"
                placeholder="Confirm your password"
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Confirm Password is required
                </p>
              )}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-600 transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isSignup ? 'Creating Account...' : 'Signing In...'}
              </div>
            ) : (
              <span>{isSignup ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        {/* Navigation Link */}
        <div className="text-center">
          <p className="text-gray-600">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
            <Link 
              href={isSignup ? '/auth/login' : '/auth/signup'}
              className="ml-1 text-blue-500 hover:text-blue-600 font-semibold transition-colors duration-200 hover:underline"
            >
              {isSignup ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm">
          By continuing, you agree to our{' '}
          <a href="#" className="text-blue-500 hover:text-blue-600 transition-colors">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-blue-500 hover:text-blue-600 transition-colors">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
