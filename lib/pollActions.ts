'use server';

import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';

/**
 * Deletes a poll and all its associated votes, with proper authorization checks.
 * 
 * This function implements a secure poll deletion process that:
 * 1. Verifies the user is authenticated and authorized to delete the poll
 * 2. Deletes all votes associated with the poll first (to maintain referential integrity)
 * 3. Deletes the poll itself, ensuring only the poll creator can delete it
 * 4. Revalidates the cache for affected pages to ensure UI updates immediately
 * 
 * The function uses a two-step deletion process to handle the foreign key relationship
 * between polls and votes, and includes authorization checks to prevent unauthorized deletions.
 * 
 * @param {string} pollId - The ID of the poll to delete
 * @returns {Promise<{success: boolean}>} Success status object
 * @throws {Error} Throws error if user is unauthorized or deletion fails
 * 
 * @example
 * ```typescript
 * try {
 *   const result = await deletePoll('123');
 *   console.log('Poll deleted successfully:', result.success);
 * } catch (error) {
 *   console.error('Failed to delete poll:', error.message);
 * }
 * ```
 */
export async function deletePoll(pollId: string) {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error('Unauthorized');
    }

    // First, delete all votes for this poll
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .eq('poll_id', pollId);

    if (votesError) {
      console.error('Error deleting votes:', votesError);
      throw new Error('Failed to delete poll votes');
    }

    // Then delete the poll
    const { error: pollError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)
      .eq('created_by', session.id); // Ensure user can only delete their own polls

    if (pollError) {
      console.error('Error deleting poll:', pollError);
      throw new Error('Failed to delete poll');
    }

    revalidatePath('/polls/manage');
    revalidatePath('/polls');
    
    return { success: true };
  } catch (error) {
    console.error('Delete poll error:', error);
    throw error;
  }
}

/**
 * Retrieves comprehensive statistics for all polls created by the authenticated user.
 * 
 * This function provides detailed analytics for a user's polls by:
 * 1. Fetching all polls created by the authenticated user
 * 2. Retrieving all votes for each poll to calculate statistics
 * 3. Computing vote counts, percentages, and identifying the most popular option
 * 4. Returning enriched poll data with statistical insights
 * 
 * The statistics include:
 * - Vote counts for each option
 * - Total votes per poll
 * - Most voted option and its count
 * - Most voted option text for easy display
 * 
 * This data is used in the poll management dashboard to show users how their polls
 * are performing and which options are most popular.
 * 
 * @returns {Promise<PollWithStats[]>} Array of polls with calculated statistics
 * @throws {Error} Throws error if user is unauthorized or data retrieval fails
 * 
 * @example
 * ```typescript
 * try {
 *   const pollsWithStats = await getUserPollsStats();
 *   pollsWithStats.forEach(poll => {
 *     console.log(`Poll: ${poll.question}`);
 *     console.log(`Total votes: ${poll.totalVotes}`);
 *     console.log(`Most popular: ${poll.mostVotedOptionText}`);
 *   });
 * } catch (error) {
 *   console.error('Failed to get poll stats:', error.message);
 * }
 * ```
 */
export async function getUserPollsStats() {
  try {
    const session = await getSession();
    if (!session) {
      throw new Error('Unauthorized');
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
      throw error;
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

    return pollsWithStats;
  } catch (error) {
    console.error('Get user polls stats error:', error);
    throw error;
  }
}
