import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PollForm from '@/components/PollForm';

export default async function CreatePoll() {
  const session = await getSession();
  if (!session) redirect('/auth/login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Poll</h1>
              <p className="text-gray-600">Engage your community with a new poll</p>
            </div>
            <Link 
              href="/polls" 
              className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <PollForm />
        </div>
      </div>
    </div>
  );
}
