import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import PollView from '@/components/PollView';
import VoteForm from '@/components/VoteForm';

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
    <PollView poll={poll} voteCounts={voteCounts} totalVotes={totalVotes}>
      <VoteForm 
        pollId={params.id} 
        question={poll.question} 
        options={poll.options} 
        existingVote={null} // We'll implement this later
      />
    </PollView>
  );
}
