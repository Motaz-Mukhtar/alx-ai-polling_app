'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type VoteFormProps = {
  pollId: string;
  question: string;
  options: string[];
  existingVote?: string;
};

export default function VoteForm({ pollId, question, options, existingVote }: VoteFormProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | undefined>(existingVote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOption) {
      setError('Please select an option');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pollId', pollId);
      // Find the index of the selected option
      const optionIndex = options.findIndex(opt => opt === selectedOption);
      formData.append('option', optionIndex.toString());

      const response = await fetch('/api/votes', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      router.refresh();
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while submitting your vote');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{question}</CardTitle>
        <CardDescription>Select an option and submit your vote</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <RadioGroup 
            value={selectedOption} 
            onValueChange={setSelectedOption}
            className="space-y-3"
          >
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="cursor-pointer">{option}</Label>
              </div>
            ))}
          </RadioGroup>
          {error && (
            <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : existingVote ? 'Update Vote' : 'Submit Vote'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}