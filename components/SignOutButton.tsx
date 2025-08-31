'use client';

import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <button 
      onClick={handleSignOut}
      className="text-gray-600 hover:text-gray-900 transition-colors"
    >
      Sign Out
    </button>
  );
}

