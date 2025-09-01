import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';

// Helper function to validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const pollId = formData.get('pollId') as string;
    const option = formData.get('option') as string;
    
    // Validate inputs
    if (!pollId || option === undefined) {
      return NextResponse.json(
        { error: 'Poll ID and option are required' },
        { status: 400 }
      );
    }
    
    // Validate poll ID format
    if (!isValidUUID(pollId)) {
      return NextResponse.json(
        { error: 'Invalid poll ID format' },
        { status: 400 }
      );
    }

    // Convert option to number for option_index
    const optionIndex = parseInt(option, 10);
    
    if (isNaN(optionIndex) || optionIndex < 0) {
      return NextResponse.json(
        { error: 'Option must be a valid non-negative number' },
        { status: 400 }
      );
    }

    // Check if poll exists
    const { data: poll, error: pollError } = await supabaseAdmin
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

    // Parse options and validate that the option index exists
    const options = JSON.parse(poll.options);
    if (optionIndex < 0 || optionIndex >= options.length) {
      return NextResponse.json(
        { error: 'Invalid option index' },
        { status: 400 }
      );
    }

    // Check if user has already voted on this poll
    const { data: existingVote, error: voteError } = await supabaseAdmin
      .from('votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('voted_by', session.id)
      .single();

    if (existingVote) {
      // Update existing vote
      const { data, error } = await supabaseAdmin
        .from('votes')
        .update({ option_index: optionIndex })
        .eq('id', existingVote.id)
        .select();

      if (error) {
        console.error('Error updating vote:', error);
        return NextResponse.json(
          { error: 'Failed to update vote' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, vote: data[0], updated: true });
    } else {
      // Create new vote
      const { data, error } = await supabaseAdmin
        .from('votes')
        .insert({
          poll_id: pollId,
          voted_by: session.id,
          option_index: optionIndex,
        })
        .select();

      if (error) {
        console.error('Error creating vote:', error);
        return NextResponse.json(
          { error: 'Failed to create vote' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, vote: data[0], created: true });
    }
  } catch (error) {
    console.error('Error in POST /api/votes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}