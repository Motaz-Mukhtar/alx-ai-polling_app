import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseClient';

/**
 * @swagger
 * /api/polls:
 *   post:
 *     summary: Create a new poll
 *     description: Creates a new poll with the provided question and options. Requires authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 description: The poll question.
 *               options:
 *                 type: string
 *                 description: Comma-separated list of poll options.
 *     responses:
 *       200:
 *         description: Poll created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 poll:
 *                   type: object
 *       400:
 *         description: Invalid input, such as missing fields or invalid options.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Failed to create poll.
 */
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
    const question = formData.get('question') as string;
    const optionsString = formData.get('options') as string;
    
    // Validate inputs
    if (!question || !optionsString) {
      return NextResponse.json(
        { error: 'Question and options are required' },
        { status: 400 }
      );
    }
    
    // Validate question length
    if (question.trim().length < 5 || question.trim().length > 200) {
      return NextResponse.json(
        { error: 'Question must be between 5 and 200 characters' },
        { status: 400 }
      );
    }

    const options = optionsString
      .split(',')
      .map(option => option.trim())
      .filter(option => option.length > 0);
    
    // Validate options count
    if (options.length < 2) {
      return NextResponse.json(
        { error: 'Please provide at least 2 options' },
        { status: 400 }
      );
    }
    
    if (options.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 options allowed' },
        { status: 400 }
      );
    }
    
    // Validate options length and uniqueness
    const uniqueOptions = new Set();
    for (const option of options) {
      if (option.length < 1 || option.length > 100) {
        return NextResponse.json({ error: 'Each option must be between 1 and 100 characters' }, { status: 400 });
      }
      if (uniqueOptions.has(option.toLowerCase())) {
        return NextResponse.json({ error: 'All options must be unique' }, { status: 400 });
      }
      uniqueOptions.add(option.toLowerCase());
    }
    
    // Insert poll into database using admin client to bypass RLS
    const { data, error } = await supabaseAdmin.from('polls').insert({
      question,
      options: JSON.stringify(options),
      created_by: session.id,
    }).select();

    if (error) {
      console.error('Error creating poll:', error);
      return NextResponse.json(
        { error: 'Failed to create poll' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, poll: data[0] });
  } catch (error) {
    console.error('Error in POST /api/polls:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
