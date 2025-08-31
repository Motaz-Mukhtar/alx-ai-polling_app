import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

type Props = { params: { id: string } };

export default async function Poll({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/auth/login');

  // Get poll data with vote counts
  const { data: poll } = await supabase
    .from('polls')
    .select(`
      *,
      profiles!polls_created_by_fkey(username)
    `)
    .eq('id', params.id)
    .single();

  if (!poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Poll Not Found</h1>
          <Link 
            href="/polls" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Get vote counts for each option
  const { data: votes } = await supabase
    .from('votes')
    .select('option_index')
    .eq('poll_id', params.id);

  // Calculate vote counts for each option
  const voteCounts = poll.options.map((_: string, index: number) => 
    votes?.filter(vote => vote.option_index === index).length || 0
  );

  const totalVotes = voteCounts.reduce((sum: number, count: number) => sum + count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Poll Details</h1>
              <p className="text-gray-600">Cast your vote and see results</p>
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

      {/* Poll Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* Poll Question */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{poll.question}</h2>
            <div className="flex items-center text-sm text-gray-600 space-x-4">
              <span>By {poll.profiles?.username || 'Anonymous'}</span>
              <span>•</span>
              <span>{new Date(poll.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>{totalVotes} votes</span>
            </div>
          </div>

          {/* Voting Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Vote Options</h3>
            
            {poll.options.map((option: string, index: number) => {
              const voteCount = voteCounts[index];
              const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
              
              return (
                <form key={index} action={async () => {
                  'use server';
                  
                  // Check if user already voted
                  const { data: existingVote } = await supabase
                    .from('votes')
                    .select('id')
                    .eq('poll_id', params.id)
                    .eq('voted_by', session.user.id)
                    .single();

                  if (existingVote) {
                    // Update existing vote
                    await supabase
                      .from('votes')
                      .update({ option_index: index })
                      .eq('poll_id', params.id)
                      .eq('voted_by', session.user.id);
                  } else {
                    // Create new vote
                    await supabase
                      .from('votes')
                      .insert({
                        poll_id: parseInt(params.id),
                        option_index: index,
                        voted_by: session.user.id,
                      });
                  }
                  
                  redirect(`/polls/${params.id}`);
                }}>
                  <button 
                    type="submit"
                    className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{option}</span>
                      <span className="text-sm text-gray-600">{voteCount} votes</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      {percentage.toFixed(1)}%
                    </div>
                  </button>
                </form>
              );
            })}
          </div>

          {/* Results Summary */}
          {totalVotes > 0 && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Results Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalVotes}</div>
                  <div className="text-sm text-gray-600">Total Votes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{poll.options.length}</div>
                  <div className="text-sm text-gray-600">Options</div>
                </div>
              </div>
            </div>
          )}

          {/* Share Poll */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share This Poll</h3>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/polls/${params.id}`}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${typeof window !== 'undefined' ? window.location.origin : ''}/polls/${params.id}`);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
