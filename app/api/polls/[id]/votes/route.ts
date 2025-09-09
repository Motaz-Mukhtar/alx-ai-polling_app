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
 * @swagger
 * /api/polls/{id}/votes:
 *   get:
 *     summary: Retrieve vote statistics for a poll
 *     description: Fetches real-time vote counts for each option of a specific poll. Requires authentication.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The UUID of the poll.
 *     responses:
 *       200:
 *         description: Successful response with vote statistics.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 voteCounts:
 *                   type: array
 *                   items:
 *                     type: integer
 *                 totalVotes:
 *                   type: integer
 *       400:
 *         description: Invalid poll ID format.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Poll not found.
 *       500:
 *         description: Internal server error.
 */
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
      votes?.filter((vote: { option_index: number }) => vote.option_index === index).length || 0
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
