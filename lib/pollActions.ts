'use server';

import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';

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
    const pollsWithStats = polls?.map(poll => {
      const voteCounts = poll.options.map((_: string, index: number) => 
        poll.votes?.filter((vote: any) => vote.option_index === index).length || 0
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
