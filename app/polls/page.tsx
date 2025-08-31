import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';

export default async function PollsDashboard() {
  const session = await getSession();
  console.log("The session")
  console.log(session)
  if (!session) {
    redirect('/auth/login');
    return null; // This ensures the function stops execution after redirect
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', session.id)
    .single();

  // Get all polls with vote counts
  const { data: polls } = await supabase
    .from('polls')
    .select(`
      *,
      profiles!polls_created_by_fkey(username),
      votes(count)
    `)
    .order('created_at', { ascending: false });

  // Get user's created polls count
  const { count: userPollsCount } = await supabase
    .from('polls')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', session.id);

  // Get total polls count
  const { count: totalPollsCount } = await supabase
    .from('polls')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Polling Dashboard</h1>
              <p className="text-gray-600">Welcome back, {profile?.username || 'User'}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/polls/create" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create New Poll
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Polls</p>
                <p className="text-2xl font-bold text-gray-900">{totalPollsCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Your Polls</p>
                <p className="text-2xl font-bold text-gray-900">{userPollsCount || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{totalPollsCount || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Polls Grid */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Polls</h2>
          </div>
          
          <div className="p-6">
            {polls && polls.length > 0 ? (
              <div className="grid gap-6">
                {polls.map((poll: any) => (
                  <div key={poll.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{poll.question}</h3>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <span>By {poll.profiles?.username || 'Anonymous'}</span>
                          <span>•</span>
                          <span>{new Date(poll.created_at).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{poll.options.length} options</span>
                          <span>•</span>
                          <span>{poll.votes?.[0]?.count || 0} votes</span>
                        </div>
                      </div>
                      <Link 
                        href={`/polls/${poll.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View & Vote
                      </Link>
                    </div>
                    
                    {/* Poll Options Preview */}
                    <div className="space-y-2">
                      {poll.options.slice(0, 3).map((option: string, index: number) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                          <span className="truncate">{option}</span>
                        </div>
                      ))}
                      {poll.options.length > 3 && (
                        <div className="text-sm text-gray-500">
                          +{poll.options.length - 3} more options
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No polls yet</h3>
                <p className="text-gray-600 mb-6">Be the first to create a poll and start engaging with your community!</p>
                <Link 
                  href="/polls/create" 
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Your First Poll
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
