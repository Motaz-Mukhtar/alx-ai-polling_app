'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PollForm from '@/components/PollForm';
import Link from 'next/link';

type Poll = {
  id: string;
  question: string;
  options: string[];
};

export default function EditPollPage() {
  const { id } = useParams();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchPoll = async () => {
        try {
          const response = await fetch(`/api/polls/${id}`);
          if (!response.ok) {
            throw new Error('Poll not found');
          }
          const data = await response.json();
          setPoll(data);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
          setLoading(false);
        }
      };

      fetchPoll();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg font-semibold text-gray-700">Loading poll...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <Link href="/polls/manage" className="text-blue-600 mt-4 inline-block">
            Return to My Polls
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <PollForm poll={poll} />
      </div>
    </div>
  );
}
