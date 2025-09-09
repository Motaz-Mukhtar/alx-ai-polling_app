import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/polls/manage:
 *   get:
 *     summary: Retrieve statistics for user's polls
 *     description: Fetches all polls created by the authenticated user, along with detailed vote statistics for each poll.
 *     responses:
 *       200:
 *         description: A list of polls with their statistics.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Failed to retrieve polls.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's polls with their associated votes
    const { data: polls, error } = await supabase
      .from('polls')
      .select(`
        *,
        votes(option_index)
      `)
      .eq('created_by', session.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get user polls stats error:', error);
      return NextResponse.json({ error: 'Failed to retrieve polls' }, { status: 500 });
    }

    // Calculate and append statistics to each poll
    const pollsWithStats = polls?.map((poll: { options: string; votes: { option_index: number }[] }) => {
      const parsedOptions = JSON.parse(poll.options);
      
      const voteCounts = parsedOptions.map((_: string, index: number) => 
        poll.votes?.filter((vote: { option_index: number }) => vote.option_index === index).length || 0
      );
      
      const totalVotes = voteCounts.reduce((sum: number, count: number) => sum + count, 0);
      const mostVotedOptionIndex = voteCounts.indexOf(Math.max(...voteCounts));
      const mostVotedCount = Math.max(...voteCounts);
      
      return {
        ...poll,
        voteCounts,
        totalVotes,
        mostVotedOption: mostVotedOptionIndex,
        mostVotedCount,
        mostVotedOptionText: parsedOptions[mostVotedOptionIndex] || 'No votes'
      };
    }) || [];

    return NextResponse.json(pollsWithStats);
  } catch (error) {
    console.error('Get user polls stats error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}