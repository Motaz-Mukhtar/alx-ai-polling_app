'use server';

import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';