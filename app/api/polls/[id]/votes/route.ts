import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';

/**
 * Validates if a string is a properly formatted UUID v4.
 * 
 * This utility function ensures that poll IDs are in the correct UUID format
 * before processing them, preventing potential security issues and database errors.
 * 
 * @param {string} id - The string to validate as UUID
 * @returns {boolean} True if the string is a valid UUID v4, false otherwise
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * API endpoint for retrieving vote statistics for a specific poll.
 * 
 * This endpoint provides real-time vote data by:
 * 1. Verifying user authentication (votes are public but require auth for consistency)
 * 2. Validating poll ID format and existence
 * 3. Fetching all votes for the specified poll
 * 4. Calculating vote counts for each option
 * 5. Returning structured vote statistics for UI display
 * 
 * The returned data includes:
 * - Vote counts for each poll option
 * - Total vote count across all options
 * - Success status for error handling
 * 
 * This endpoint is used by the voting interface to display real-time results
 * and update the UI after a user submits their vote.
 * 
 * @param {NextRequest} request - The incoming request (unused but required by Next.js)
 * @param {Object} params - Route parameters containing the poll ID
 * @param {string} params.id - The UUID of the poll to get vote statistics for
 * @returns {NextResponse} JSON response with vote statistics or error message
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/polls/123e4567-e89b-12d3-a456-426614174000/votes');
 * const result = await response.json();
 * if (result.success) {
 *   console.log('Vote counts:', result.voteCounts);
 *   console.log('Total votes:', result.totalVotes);
 * }
 * ```
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const pollId = (await params).id;
    
    // Validate poll ID format
    if (!pollId || !isValidUUID(pollId)) {
      return NextResponse.json(
        { error: 'Invalid poll ID format' },
        { status: 400 }
      );
    }
    
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