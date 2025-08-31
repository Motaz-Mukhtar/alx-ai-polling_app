import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

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
          <form action={async (formData) => {
            'use server';
            const question = formData.get('question') as string;
            const optionsString = formData.get('options') as string;
            const options = optionsString.split(',').map(option => option.trim()).filter(option => option.length > 0);
            
            if (options.length < 2) {
              throw new Error('Please provide at least 2 options');
            }
            
            await supabase.from('polls').insert({
              question,
              options,
              created_by: session.user.id,
            });
            redirect('/polls');
          }}>
            <div className="space-y-6">
              <div>
                <label htmlFor="question" className="block text-sm font-semibold text-gray-700 mb-2">
                  Poll Question *
                </label>
                <input
                  type="text"
                  id="question"
                  name="question"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="What would you like to ask your community?"
                />
                <p className="text-sm text-gray-500 mt-1">Make your question clear and engaging</p>
              </div>
              
              <div>
                <label htmlFor="options" className="block text-sm font-semibold text-gray-700 mb-2">
                  Poll Options *
                </label>
                <textarea
                  id="options"
                  name="options"
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Option 1, Option 2, Option 3, Option 4"
                />
                <p className="text-sm text-gray-500 mt-1">Separate options with commas. You need at least 2 options.</p>
              </div>
              
              <div className="flex items-center justify-between pt-6">
                <Link 
                  href="/polls" 
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Poll
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
