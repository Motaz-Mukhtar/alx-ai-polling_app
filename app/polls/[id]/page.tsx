import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import PollView from '@/components/PollView';
import VoteForm from '@/components/VoteForm';
import { Link } from 'lucide-react';

type Props = { params: { id: string } };

/**
 * Individual poll page component that displays a specific poll and its voting interface.
 * 
 * This server component handles the complete poll viewing and voting experience by:
 * 1. Verifying user authentication and redirecting unauthenticated users
 * 2. Extracting the poll ID from the URL parameters
 * 3. Fetching the poll data from the database
 * 4. Retrieving the poll creator's username for display
 * 5. Calculating current vote counts for all poll options
 * 6. Rendering the poll view with voting interface and results
 * 
 * The poll page includes:
 * - Poll question and options display
 * - Current vote counts and percentages
 * - Interactive voting form for authenticated users
 * - Real-time vote statistics
 * - Navigation back to the main dashboard
 * - Error handling for non-existent polls
 * 
 * The vote calculation process:
 * - Fetches all votes for the specific poll
 * - Groups votes by option index
 * - Calculates totals and percentages for display
 * - Provides data to both the poll view and voting form components
 * 
 * @param {Props} props - Component props containing route parameters
 * @param {Object} props.params - Route parameters from Next.js
 * @param {string} props.params.id - The UUID of the poll to display
 * @returns {Promise<JSX.Element>} The rendered poll page with voting interface
 * 
 * @example
 * This component is rendered when users visit /polls/[id] where [id] is a valid poll UUID.
 * It provides the complete voting experience for a specific poll.
 */
export default async function Poll({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/auth/login');

  const pollId = (await params).id;
  console.log(`\n Polld Id: ${pollId} \n`);
  // Get poll data with vote counts
  const { data: poll } = await supabase
    .from('polls')
    .select("*")
    .eq('id', pollId)
    .single();

    const { data } = await supabase
    .from('profiles')
    .select("username")
    .eq('id', poll.created_by)
    .single();

    poll.username = data?.username;
  console.log(poll)
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
    .eq('poll_id', pollId);

  // Calculate vote counts for each option
  const voteCounts = JSON.parse(poll.options).map((_: string, index: number) => 
    votes?.filter(vote => vote.option_index === index).length || 0
  );

  const totalVotes = voteCounts.reduce((sum: number, count: number) => sum + count, 0);

  return (
    <PollView poll={poll} voteCounts={voteCounts} totalVotes={totalVotes}>
      <VoteForm 
        pollId={pollId} 
        question={poll.question} 
        options={poll.options} 
        existingVote={undefined} // We'll implement this later
      />
    </PollView>
  );
}
