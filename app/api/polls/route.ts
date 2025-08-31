import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';

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

    const options = optionsString
      .split(',')
      .map(option => option.trim())
      .filter(option => option.length > 0);
    
    if (options.length < 2) {
      return NextResponse.json(
        { error: 'Please provide at least 2 options' },
        { status: 400 }
      );
    }
    console.log("Data");
    console.log(question, JSON.stringify(options), session);
    // Insert poll into database using admin client to bypass RLS
    const { data, error } = await supabaseAdmin.from('polls').insert({
      question,
      options: `${JSON.stringify(options)}`,
      created_by: session.id, // session is the user object from auth.getUser()
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