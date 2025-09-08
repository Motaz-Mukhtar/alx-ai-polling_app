import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pollId = params.id;

    // First, delete all votes for this poll
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .eq('poll_id', pollId);

    if (votesError) {
      console.error('Error deleting votes:', votesError);
      return NextResponse.json({ error: 'Failed to delete poll votes' }, { status: 500 });
    }

    // Then delete the poll
    const { error: pollError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)
      .eq('created_by', session.id); // Ensure user can only delete their own polls

    if (pollError) {
      console.error('Error deleting poll:', pollError);
      return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete poll error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
