import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase client with a factory function
vi.mock('@/lib/supabaseClient', () => {
  // Mock data store
  const db = {
    polls: [
      {
        id: 'poll-1',
        question: 'Integration test question 1',
        options: ['Option A', 'Option B', 'Option C'],
        created_by: 'user-123',
        created_at: '2023-01-01',
      },
      {
        id: 'poll-2',
        question: 'Integration test question 2',
        options: ['Yes', 'No'],
        created_by: 'user-123',
        created_at: '2023-01-02',
      },
      {
        id: 'poll-3',
        question: 'Another user poll',
        options: ['Option X', 'Option Y'],
        created_by: 'user-456',
        created_at: '2023-01-03',
      }
    ],
    votes: [
      { id: 'vote-1', poll_id: 'poll-1', voted_by: 'voter-1', option_index: 0 },
      { id: 'vote-2', poll_id: 'poll-1', voted_by: 'voter-2', option_index: 0 },
      { id: 'vote-3', poll_id: 'poll-1', voted_by: 'voter-3', option_index: 1 },
      { id: 'vote-4', poll_id: 'poll-1', voted_by: 'voter-4', option_index: 2 },
      { id: 'vote-5', poll_id: 'poll-2', voted_by: 'voter-1', option_index: 0 },
      { id: 'vote-6', poll_id: 'poll-2', voted_by: 'voter-2', option_index: 1 },
      { id: 'vote-7', poll_id: 'poll-2', voted_by: 'voter-3', option_index: 1 },
      { id: 'vote-8', poll_id: 'poll-3', voted_by: 'voter-1', option_index: 0 },
    ]
  };

  return {
    supabase: {
      from: (table) => ({
        select: () => ({
          eq: (field, value) => ({
            order: (orderField, { ascending }) => {
              if (table === 'polls') {
                const filteredPolls = db.polls
                  .filter(poll => poll[field] === value)
                  .sort((a, b) => {
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return ascending ? dateA - dateB : dateB - dateA;
                  });

                // Add votes to each poll
                const pollsWithVotes = filteredPolls.map(poll => ({
                  ...poll,
                  votes: db.votes.filter(vote => vote.poll_id === poll.id)
                }));

                return { data: pollsWithVotes, error: null };
              }
              return { data: null, error: new Error('Table not implemented') };
            }
          })
        }),
        delete: () => ({
          eq: (field, value) => {
            if (table === 'votes') {
              // Delete votes for poll
              db.votes = db.votes.filter(vote => vote.poll_id !== value);
              return { error: null };
            }
            return { 
              eq: (field2, value2) => {
                if (table === 'polls') {
                  // Check if poll exists and belongs to user
                  const pollExists = db.polls.some(
                    poll => poll.id === value && poll.created_by === value2
                  );
                  
                  if (!pollExists) {
                    return { error: new Error('Poll not found or not owned by user') };
                  }
                  
                  // Delete poll
                  db.polls = db.polls.filter(poll => !(poll.id === value && poll.created_by === value2));
                  return { error: null };
                }
                return { error: new Error('Table not implemented') };
              }
            };
          }
        })
      })
    }
  };
});

// Import after mocking
import { deletePoll, getUserPollsStats } from '@/lib/pollActions';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

describe('Integration Tests: pollActions', () => {
  const mockSession = { id: 'user-123' };
  
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getSession).mockResolvedValue(mockSession);
  });

  describe('deletePoll integration', () => {
    it('should successfully delete a poll and its votes', async () => {
      // Test
      const result = await deletePoll('poll-1');
      
      // Assert
      expect(revalidatePath).toHaveBeenCalledWith('/polls/manage');
      expect(revalidatePath).toHaveBeenCalledWith('/polls');
      expect(result).toEqual({ success: true });
    });

    it('should fail when trying to delete another user\'s poll', async () => {
      // Test & Assert
      await expect(deletePoll('poll-3')).rejects.toThrow('Failed to delete poll');
    });
  });

  describe('getUserPollsStats integration', () => {
    it('should return polls with correct statistics', async () => {
      // Test
      const result = await getUserPollsStats();
      
      // Assert
      // Check that we have at least one poll
      expect(result.length).toBeGreaterThan(0);
      
      // Find polls by ID
      const poll2 = result.find(p => p.id === 'poll-2');
      
      // Verify poll stats for poll-2 (which we know exists in the test)
      expect(poll2).toBeDefined();
      expect(poll2?.voteCounts).toEqual([1, 2]);
      expect(poll2?.totalVotes).toBe(3);
      expect(poll2?.mostVotedOption).toBe(1);
      expect(poll2?.mostVotedOptionText).toBe('No');
    });
  });
});