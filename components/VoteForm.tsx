'use client';

import { useState, useMemo, useCallback } from 'react';
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

type VoteData = {
  voteCounts: number[];
  totalVotes: number;
};

/**
 * Success message component that displays confirmation of a submitted vote.
 * 
 * This component provides visual feedback to users after they successfully submit their vote,
 * showing which option they selected and confirming that their vote was recorded.
 * 
 * @param {Object} props - Component props
 * @param {string} props.selectedOption - The option the user voted for
 * @returns {JSX.Element} The rendered success message
 */
const SuccessMessage = ({ selectedOption }: { selectedOption: string }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div className="flex items-center text-blue-700">
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <p className="font-medium">Your vote for &quot;{selectedOption}&quot; has been recorded!</p>
    </div>
  </div>
);

/**
 * Poll results component that displays vote statistics and percentages.
 * 
 * This component renders the results of a poll after voting, showing:
 * - Vote counts for each option
 * - Percentage calculations
 * - Visual progress bars
 * - Highlighting of the user's selected option
 * 
 * @param {Object} props - Component props
 * @param {string[]} props.options - Array of poll options
 * @param {number[]} props.voteCounts - Array of vote counts for each option
 * @param {number} props.totalVotes - Total number of votes across all options
 * @param {string} props.selectedOption - The option the user voted for
 * @returns {JSX.Element} The rendered poll results
 */
const PollResults = ({ options, voteCounts, totalVotes, selectedOption }: {
  options: string[];
  voteCounts: number[];
  totalVotes: number;
  selectedOption: string;
}) => (
  <div className="space-y-3">
    {options.map((option: string, index: number) => {
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
    })}
  </div>
);

/**
 * Interactive voting form component that allows users to vote on polls and view results.
 * 
 * This client component provides a comprehensive voting interface that:
 * 1. Displays poll question and options as radio buttons
 * 2. Handles vote submission with validation and error handling
 * 3. Fetches and displays real-time vote statistics
 * 4. Shows poll results with percentages and progress bars
 * 5. Provides visual feedback for successful vote submission
 * 6. Supports vote updates (users can change their vote)
 * 
 * The component features:
 * - Radio button selection for poll options
 * - Form validation to ensure option selection
 * - Loading states during vote submission
 * - Real-time vote count fetching and display
 * - Visual progress bars showing vote percentages
 * - Success confirmation with selected option highlighting
 * - Error handling with user-friendly messages
 * 
 * Voting process:
 * 1. User selects an option from radio buttons
 * 2. Form validates selection and submits to /api/votes
 * 3. Vote is processed (new vote or update existing)
 * 4. Updated vote counts are fetched and displayed
 * 5. Results view shows percentages and progress bars
 * 
 * @param {VoteFormProps} props - Component props
 * @param {string} props.pollId - The UUID of the poll to vote on
 * @param {string} props.question - The poll question text
 * @param {string[]} props.options - Array of poll options
 * @param {string} [props.existingVote] - User's existing vote (if any)
 * @returns {JSX.Element} The rendered voting form with results
 * 
 * @example
 * ```tsx
 * <VoteForm 
 *   pollId="123e4567-e89b-12d3-a456-426614174000"
 *   question="What is your favorite programming language?"
 *   options={["JavaScript", "Python", "TypeScript", "Rust"]}
 *   existingVote="JavaScript"
 * />
 * ```
 */
export default function VoteForm({ pollId, question, options, existingVote }: VoteFormProps) {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | undefined>(existingVote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [voteCounts, setVoteCounts] = useState<number[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);

  // Fetch vote data helper function
  const fetchVoteData = useCallback(async (): Promise<VoteData | null> => {
    try {
      const votesResponse = await fetch(`/api/polls/${pollId}/votes`);
      if (votesResponse.ok) {
        return await votesResponse.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching vote data:', error);
      return null;
    }
  }, [pollId]);

  // Submit vote handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOption) {
      const errorMsg = 'Please select an option';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pollId', pollId);
      // Find the index of the selected option
      const optionIndex = options.findIndex((opt: string) => opt === selectedOption);
      formData.append('option', optionIndex.toString());

      const response = await fetch('/api/votes', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }
      
      // Show success message and results
      toast.success('Thank you for your vote!');
      setVoteSubmitted(true);
      
      // Fetch updated vote counts
      const voteData = await fetchVoteData();
      if (voteData) {
        setVoteCounts(voteData.voteCounts);
        setTotalVotes(voteData.totalVotes);
      } else {
        // Fallback: create default counts for the selected option
        const defaultCounts = options.map((_: string, index: number) => {
          return options[index] === selectedOption ? 1 : 0;
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
  }, [selectedOption, pollId, options, fetchVoteData, router]);

  // Memoize button text to avoid recalculation
  const buttonText = useMemo(() => {
    if (isSubmitting) return 'Submitting...';
    return existingVote ? 'Update Vote' : 'Submit Vote';
  }, [isSubmitting, existingVote]);

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
              {options.map((option: string, index: number) => (
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
              {buttonText}
            </Button>
          </CardFooter>
        </form>
      ) : (
        <CardContent className="space-y-4">
          <SuccessMessage selectedOption={selectedOption!} />
          <h3 className="text-lg font-semibold">Poll Results</h3>
          <PollResults 
            options={options}
            voteCounts={voteCounts}
            totalVotes={totalVotes}
            selectedOption={selectedOption!}
          />
        </CardContent>
      )}
    </Card>
  );
}
