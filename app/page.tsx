import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();
  
  if (session) {
    redirect('/polls'); // Redirect to polling dashboard
  } else {
    redirect('/auth/login'); // Redirect to login if not authenticated
  }
}
