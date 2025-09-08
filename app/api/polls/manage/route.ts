import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's polls with vote counts
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

    // Calculate statistics
    const pollsWithStats = polls?.map((poll: { options: string; votes: { option_index: number }[] }) => {
      const voteCounts = poll.options.map((_: string, index: number) => 
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

    return NextResponse.json(pollsWithStats);
  } catch (error) {
    console.error('Get user polls stats error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
