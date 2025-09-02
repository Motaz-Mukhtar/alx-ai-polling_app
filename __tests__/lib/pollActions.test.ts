import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deletePoll, getUserPollsStats } from '@/lib/pollActions';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('deletePoll', () => {
  const mockSession = { id: 'user-123' };
  const mockPollId = 'poll-123';
  
  beforeEach(() => {
    vi.resetAllMocks();
    (getSession as any).mockResolvedValue(mockSession);
  });

  it('should throw an error if user is not authenticated', async () => {
    // Setup
    (getSession as any).mockResolvedValue(null);
    
    // Test & Assert
    await expect(deletePoll(mockPollId)).rejects.toThrow('Unauthorized');
  });

  it('should delete votes and poll successfully', async () => {
    // Setup
    const mockDeleteVotesResponse = { error: null };
    const mockDeletePollResponse = { error: null };
    
    (supabase.from as any).mockImplementation((table) => {
      return {
        delete: () => ({
          eq: () => table === 'votes' 
            ? mockDeleteVotesResponse 
            : {
                eq: () => mockDeletePollResponse
              }
        })
      };
    });
    
    // Test
    const result = await deletePoll(mockPollId);
    
    // Assert
    expect(supabase.from).toHaveBeenCalledWith('votes');
    expect(supabase.from).toHaveBeenCalledWith('polls');
    expect(revalidatePath).toHaveBeenCalledWith('/polls/manage');
    expect(revalidatePath).toHaveBeenCalledWith('/polls');
    expect(result).toEqual({ success: true });
  });

  it('should throw an error if deleting votes fails', async () => {
    // Setup
    const mockDeleteVotesResponse = { error: new Error('Failed to delete votes') };
    
    (supabase.from as any).mockImplementation((table) => {
      return {
        delete: () => ({
          eq: () => mockDeleteVotesResponse
        })
      };
    });
    
    // Test & Assert
    await expect(deletePoll(mockPollId)).rejects.toThrow('Failed to delete poll votes');
  });

  it('should throw an error if deleting poll fails', async () => {
    // Setup
    const mockDeleteVotesResponse = { error: null };
    const mockDeletePollResponse = { error: new Error('Failed to delete poll') };
    
    (supabase.from as any).mockImplementation((table) => {
      return {
        delete: () => ({
          eq: () => table === 'votes' 
            ? mockDeleteVotesResponse 
            : {
                eq: () => mockDeletePollResponse
              }
        })
      };
    });
    
    // Test & Assert
    await expect(deletePoll(mockPollId)).rejects.toThrow('Failed to delete poll');
  });
});

describe('getUserPollsStats', () => {
  const mockSession = { id: 'user-123' };
  
  beforeEach(() => {
    vi.resetAllMocks();
    (getSession as any).mockResolvedValue(mockSession);
  });

  it('should throw an error if user is not authenticated', async () => {
    // Setup
    (getSession as any).mockResolvedValue(null);
    
    // Test & Assert
    await expect(getUserPollsStats()).rejects.toThrow('Unauthorized');
  });

  it('should return polls with calculated statistics', async () => {
    // Setup
    const mockPolls = [
      {
        id: 'poll-1',
        question: 'Test question 1',
        options: ['Option A', 'Option B', 'Option C'],
        created_by: 'user-123',
        created_at: '2023-01-01',
        votes: [
          { option_index: 0 },
          { option_index: 0 },
          { option_index: 1 },
          { option_index: 2 },
        ]
      },
      {
        id: 'poll-2',
        question: 'Test question 2',
        options: ['Yes', 'No'],
        created_by: 'user-123',
        created_at: '2023-01-02',
        votes: [
          { option_index: 0 },
          { option_index: 1 },
          { option_index: 1 },
        ]
      }
    ];
    
    const mockResponse = { data: mockPolls, error: null };
    
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(mockResponse)
    });
    
    // Test
    const result = await getUserPollsStats();
    
    // Assert
    expect(supabase.from).toHaveBeenCalledWith('polls');
    expect(result).toHaveLength(2);
    
    // Check first poll stats
    expect(result[0].id).toBe('poll-1');
    expect(result[0].voteCounts).toEqual([2, 1, 1]);
    expect(result[0].totalVotes).toBe(4);
    expect(result[0].mostVotedOption).toBe(0);
    expect(result[0].mostVotedCount).toBe(2);
    expect(result[0].mostVotedOptionText).toBe('Option A');
    
    // Check second poll stats
    expect(result[1].id).toBe('poll-2');
    expect(result[1].voteCounts).toEqual([1, 2]);
    expect(result[1].totalVotes).toBe(3);
    expect(result[1].mostVotedOption).toBe(1);
    expect(result[1].mostVotedCount).toBe(2);
    expect(result[1].mostVotedOptionText).toBe('No');
  });

  it('should throw an error if fetching polls fails', async () => {
    // Setup
    const mockResponse = { data: null, error: new Error('Failed to fetch polls') };
    
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(mockResponse)
    });
    
    // Test & Assert
    await expect(getUserPollsStats()).rejects.toThrow('Failed to fetch polls');
  });

  it('should handle empty polls array', async () => {
    // Setup
    const mockResponse = { data: [], error: null };
    
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue(mockResponse)
    });
    
    // Test
    const result = await getUserPollsStats();
    
    // Assert
    expect(result).toEqual([]);
  });
});