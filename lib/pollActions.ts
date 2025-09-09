'use server';

import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';

export async function getPolls({ page = 1, limit = 10 }: { page: number; limit: number }) {
    const session = await getSession();
    if (!session) {
        throw new Error('You must be logged in to view polls.');
    }

    const { data: polls, error } = await supabase
        .from('polls')
        .select(`
      *,
      profiles!polls_created_by_fkey(username),
      votes(count)
    `)
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching polls:', error);
        throw new Error('Could not fetch polls.');
    }

    const { count } = await supabase
        .from('polls')
        .select('*', { count: 'exact', head: true });

    return {
        polls: polls.map(poll => ({
            ...poll,
            options: JSON.parse(poll.options),
            votes: poll.votes?.[0]?.count || 0,
            createdBy: poll.profiles?.username || 'Anonymous',
        })),
        total: count || 0,
    };
}
