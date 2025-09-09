import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/polls/{id}:
 *   get:
 *     summary: Retrieve a specific poll
 *     description: Fetches the details of a single poll by its ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the poll to retrieve.
 *     responses:
 *       200:
 *         description: The poll data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Poll not found.
 *       500:
 *         description: An unexpected error occurred.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const pollId = params.id;

    const { data: poll, error } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();

    if (error || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    return NextResponse.json(poll);
  } catch (error) {
    console.error('Get poll error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/polls/{id}:
 *   put:
 *     summary: Update a poll
 *     description: Updates the question and options of an existing poll. The user must be authenticated and the owner of the poll.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the poll to update.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               options:
 *                 type: string
 *     responses:
 *       200:
 *         description: Poll updated successfully.
 *       400:
 *         description: Missing required fields or invalid options.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Failed to update poll.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pollId = params.id;
    const formData = await request.formData();
    const question = formData.get('question') as string;
    const options = formData.get('options') as string;

    if (!question || !options) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const optionsArray = options.split(',').map(option => option.trim()).filter(option => option.length > 0);

    if (optionsArray.length < 2) {
      return NextResponse.json({ error: 'Please provide at least 2 valid options' }, { status: 400 });
    }

    const { error } = await supabase
      .from('polls')
      .update({
        question,
        options: JSON.stringify(optionsArray),
      })
      .eq('id', pollId)
      .eq('created_by', session.id);

    if (error) {
      console.error('Error updating poll:', error);
      return NextResponse.json({ error: 'Failed to update poll' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update poll error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/polls/{id}:
 *   delete:
 *     summary: Delete a poll
 *     description: Deletes a poll and all its associated votes. The user must be authenticated and the owner of the poll.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the poll to delete.
 *     responses:
 *       200:
 *         description: Poll deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Failed to delete poll.
 */
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

    // First, delete all votes for this poll to maintain referential integrity.
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .eq('poll_id', pollId);

    if (votesError) {
      console.error('Error deleting votes:', votesError);
      return NextResponse.json({ error: 'Failed to delete poll votes' }, { status: 500 });
    }

    // Then delete the poll itself.
    const { error: pollError } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)
      .eq('created_by', session.id); // Ensure user can only delete their own polls.

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
