'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
  const [showResults, setShowResults] = useState(false);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [voteCounts, setVoteCounts] = useState<number[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!selectedOption) {
    setError('Please select an option');
    toast.error('Please select an option');
    return;
  }

  setIsSubmitting(true);
  setError(null);

  // Parse options once at the beginning to avoid multiple parsing
  const parsedOptions = JSON.parse(options);

  try {
    const formData = new FormData();
    formData.append('pollId', pollId);
    // Find the index of the selected option
    const optionIndex = parsedOptions.findIndex(opt => opt === selectedOption);
    formData.append('option', optionIndex.toString());

    const response = await fetch('/api/votes', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to submit vote');
    }
    
    // Show thank you message and results
    toast.success('Thank you for your vote!');
    setVoteSubmitted(true);
    setShowResults(true);
    
    // Fetch updated vote counts
    const votesResponse = await fetch(`/api/polls/${pollId}/votes`);
    if (votesResponse.ok) {
      const votesData = await votesResponse.json();
      setVoteCounts(votesData.voteCounts);
      setTotalVotes(votesData.totalVotes);
    } else {
      // If we can't get the vote counts, we'll use a simple count for the selected option
      const defaultCounts = parsedOptions.map((_, index) => {
        return parsedOptions[index] === selectedOption ? 1 : 0;
      });
      setVoteCounts(defaultCounts);
      setTotalVotes(1);
    }
    
    router.refresh();
  } catch (err) {
    console.error('Error submitting vote:', err);
    const errorMessage = err instanceof Error ? err.message : 'An error occurred while submitting your vote';
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setIsSubmitting(false);
  }
}

return (
  <Card>
    <CardHeader>
      <CardTitle>{question}</CardTitle>
      <CardDescription>
        {voteSubmitted 
          ? 'Thank you for your vote! Here are the results:' 
          : 'Select an option and submit your vote'}
      </CardDescription>
    </CardHeader>
    {!voteSubmitted ? (
      <form onSubmit={handleSubmit}>
        <CardContent>
          <RadioGroup 
            value={selectedOption} 
            onValueChange={setSelectedOption}
            className="space-y-3"
          >
            {/* Parse options once and store in a variable */}
            {(() => {
              const parsedOptions = JSON.parse(options);
              return parsedOptions.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">{option}</Label>
                </div>
              ));
            })()}
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
    ) : (
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center text-blue-700">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="font-medium">Your vote for "{selectedOption}" has been recorded!</p>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold">Poll Results</h3>
        <div className="space-y-3">
          {/* Parse options once using IIFE */}
          {(() => {
            const parsedOptions = JSON.parse(options);
            return parsedOptions.map((option, index) => {
              const voteCount = voteCounts[index] || 0;
              const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
              const isSelected = option === selectedOption;
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{option}</span>
                    <span className="text-sm text-gray-500">
                      {voteCount} {voteCount === 1 ? 'vote' : 'votes'} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${isSelected ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </CardContent>
    )}
  </Card>
);
