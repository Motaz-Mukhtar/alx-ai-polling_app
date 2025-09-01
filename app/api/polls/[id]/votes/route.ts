import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const pollId = params.id;
    
    // Check if poll exists
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('options')
      .eq('id', pollId)
      .single();

    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Poll not found' },
        { status: 404 }
      );
    }

    // Get vote counts for each option
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('option_index')
      .eq('poll_id', pollId);

    if (votesError) {
      return NextResponse.json(
        { error: 'Failed to fetch votes' },
        { status: 500 }
      );
    }

    // Calculate vote counts for each option
    const options = JSON.parse(poll.options);
    const voteCounts = options.map((_: string, index: number) => 
      votes?.filter(vote => vote.option_index === index).length || 0
    );

    const totalVotes = voteCounts.reduce((sum: number, count: number) => sum + count, 0);

    return NextResponse.json({ 
      success: true, 
      voteCounts, 
      totalVotes 
    });
  } catch (error) {
    console.error('Error in GET /api/polls/[id]/votes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}