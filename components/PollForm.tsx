'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

/**
 * Zod schema for poll form validation.
 * 
 * This schema defines the validation rules for poll creation:
 * - Question must be at least 5 characters long
 * - Options string must contain at least 3 characters (to ensure at least 2 options)
 */
const formSchema = z.object({
  question: z.string().min(5, {
    message: 'Question must be at least 5 characters.',
  }),
  options: z.string().min(3, {
    message: 'Please provide at least 2 comma-separated options.',
  }),
});

/**
 * Poll creation form component that allows authenticated users to create new polls.
 * 
 * This client component provides a comprehensive poll creation interface that:
 * 1. Renders a form with question and options input fields
 * 2. Validates form inputs using Zod schema validation
 * 3. Processes comma-separated options into an array
 * 4. Submits poll data to the API endpoint
 * 5. Handles form submission states and error scenarios
 * 6. Provides user feedback through toast notifications
 * 7. Redirects to the polls dashboard after successful creation
 * 
 * The form features:
 * - Question input with minimum length validation
 * - Options input with comma-separated value processing
 * - Real-time form validation with error messages
 * - Loading states during submission
 * - Comprehensive error handling and user feedback
 * - Integration with shadcn/ui components for consistent styling
 * 
 * Poll creation process:
 * 1. User enters poll question and comma-separated options
 * 2. Form validates input according to schema rules
 * 3. Options are parsed and validated (minimum 2, maximum 10)
 * 4. Data is submitted to /api/polls endpoint
 * 5. Success feedback is shown and user is redirected
 * 
 * @returns {JSX.Element} The rendered poll creation form
 * 
 * @example
 * ```tsx
 * <PollForm />
 * ```
 */
export default function PollForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
      options: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const options = values.options.split(',').map(option => option.trim()).filter(option => option.length > 0);
      
      if (options.length < 2) {
        const validationError = 'Please provide at least 2 valid options';
        setError(validationError);
        toast.error(validationError);
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('question', values.question);
      formData.append('options', values.options);

      // Submit the form to the server action
      const response = await fetch('/api/polls', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }
      
      // Show success message and redirect
      setError(null);
      toast.success('Poll created successfully!');
      router.push('/polls');
      router.refresh();
    } catch (err) {
      console.error('Error creating poll:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while creating the poll';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create New Poll</CardTitle>
        <CardDescription>Create a new poll to gather opinions from your audience</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input placeholder="What's your favorite programming language?" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the question your audience will vote on.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="options"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Options</FormLabel>
                  <FormControl>
                    <Input placeholder="JavaScript, Python, TypeScript, Rust" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter options separated by commas. You need at least 2 options.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creating...' : 'Create Poll'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}