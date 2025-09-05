import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';
import PollManagementCard from '@/components/PollManagementCard';

/**
 * Poll management dashboard page component for users to manage their created polls.
 * 
 * This server component provides comprehensive poll management functionality by:
 * 1. Verifying user authentication and redirecting unauthenticated users
 * 2. Fetching user profile information for personalized display
 * 3. Retrieving all polls created by the authenticated user
 * 4. Calculating detailed vote statistics for each poll
 * 5. Computing overall analytics (total polls, votes, active polls, averages)
 * 6. Rendering management interface with statistics and poll cards
 * 
 * The management dashboard includes:
 * - User-specific statistics (total polls, total votes, active polls, average votes)
 * - Detailed poll cards showing vote counts, percentages, and most popular options
 * - Navigation back to main dashboard and poll creation
 * - Empty state for users who haven't created any polls yet
 * 
 * The statistics calculation involves:
 * - Parsing poll options from JSON format
 * - Counting votes for each option across all polls
 * - Identifying the most voted option for each poll
 * - Computing percentages and totals for display
 * 
 * @returns {Promise<JSX.Element>} The rendered poll management dashboard page
 * 
 * @example
 * This component is rendered when users visit /polls/manage and provides detailed
 * analytics and management tools for their created polls.
 */
export default async function PollManagement() {
  const session = await getSession();
  
  if (!session) {
    redirect('/auth/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', session.id)
    .single();
  console.log(profile)
  // Get user's created polls with detailed vote counts
  const { data: userPolls } = await supabase
    .from('polls')
    .select(`
      *,
      votes(option_index)
    `)
    .eq('created_by', session.id)
    .order('created_at', { ascending: false });
    console.log(userPolls)
  // Calculate vote statistics for each poll
  const pollsWithStats = userPolls?.map(poll => {
    const voteCounts = JSON.parse(poll.options).map((_: string, index: number) => 
      poll.votes?.filter((vote: { option_index: number }) => vote.option_index === index).length || 0
    );
    
    const totalVotes = voteCounts.reduce((sum: number, count: number) => sum + count, 0);
    const mostVotedOption = voteCounts.indexOf(Math.max(...voteCounts));
    const mostVotedCount = Math.max(...voteCounts);
    
    return {
      ...poll,
      voteCounts,
      totalVotes,
      mostVotedOption,
      mostVotedCount,
      mostVotedOptionText: poll.options[mostVotedOption] || 'No votes'
    };
  }) || [];

  // Calculate overall statistics
  const totalPolls = pollsWithStats.length;
  const totalVotes = pollsWithStats.reduce((sum, poll) => sum + poll.totalVotes, 0);
  const activePolls = pollsWithStats.filter(poll => poll.totalVotes > 0).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Polls</h1>
              <p className="text-gray-600">Manage and track your created polls</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/polls" 
                className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                ← Back to Dashboard
              </Link>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Polls</p>
                <p className="text-2xl font-bold text-gray-900">{totalPolls}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold text-gray-900">{totalVotes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Polls</p>
                <p className="text-2xl font-bold text-gray-900">{activePolls}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Votes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalPolls > 0 ? Math.round(totalVotes / totalPolls) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Polls Management Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Your Polls</h2>
            <p className="text-gray-600 text-sm mt-1">Manage and track performance of your polls</p>
          </div>
          
          <div className="p-6">
            {pollsWithStats.length > 0 ? (
              <div className="space-y-6">
                {pollsWithStats.map((poll) => (
                  <PollManagementCard 
                    key={poll.id}
                    poll={poll}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No polls created yet</h3>
                <p className="text-gray-600 mb-6">Start creating polls to see them here with detailed analytics!</p>
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
