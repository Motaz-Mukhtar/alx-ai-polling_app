import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseClient';

/**
 * API endpoint for creating new polls with comprehensive validation and security checks.
 * 
 * This endpoint handles poll creation by:
 * 1. Verifying user authentication and authorization
 * 2. Validating poll data (question length, options count, uniqueness)
 * 3. Sanitizing and processing poll options
 * 4. Storing the poll in the database with proper user association
 * 5. Returning the created poll data for immediate UI updates
 * 
 * The validation includes:
 * - Question must be 5-200 characters
 * - Minimum 2 options, maximum 10 options
 * - Each option must be 1-100 characters
 * - All options must be unique (case-insensitive)
 * - User must be authenticated
 * 
 * @param {NextRequest} request - The incoming request containing poll data
 * @returns {NextResponse} JSON response with success status and poll data or error message
 * 
 * @example
 * ```typescript
 * const formData = new FormData();
 * formData.append('question', 'What is your favorite programming language?');
 * formData.append('options', 'JavaScript, Python, TypeScript, Rust');
 * 
 * const response = await fetch('/api/polls', {
 *   method: 'POST',
 *   body: formData
 * });
 * 
 * const result = await response.json();
 * if (result.success) {
 *   console.log('Poll created:', result.poll);
 * }
 * ```
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
    
    // Validate options length and uniqueness
    const optionErrors = [];
    const uniqueOptions = new Set();
    
    for (const option of options) {
      if (option.length < 1 || option.length > 100) {
        optionErrors.push('Each option must be between 1 and 100 characters');
        break;
      }
      
      if (uniqueOptions.has(option.toLowerCase())) {
        optionErrors.push('All options must be unique');
        break;
      }
      
      uniqueOptions.add(option.toLowerCase());
    }
    
    if (options.length > 10) {
      optionErrors.push('Maximum 10 options allowed');
    }
    
    if (optionErrors.length > 0) {
      return NextResponse.json(
        { error: optionErrors[0] },
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