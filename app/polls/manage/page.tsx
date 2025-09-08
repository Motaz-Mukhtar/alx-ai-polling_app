'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SignOutButton from '@/components/SignOutButton';
import PollManagementCard from '@/components/PollManagementCard';
import { BarChart3, FileText, TrendingUp, Zap } from 'lucide-react';

type PollWithStats = {
  id: string;
  question: string;
  options: string[];
  created_at: string;
  totalVotes: number;
  voteCounts: number[];
  mostVotedOption: number;
  mostVotedCount: number;
  mostVotedOptionText: string;
};

export default function PollManagement() {
  const [pollsWithStats, setPollsWithStats] = useState<PollWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const response = await fetch('/api/polls/manage');
        if (!response.ok) {
          throw new Error('Failed to fetch polls');
        }
        const data = await response.json();
        setPollsWithStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPolls();
  }, []);

  // Calculate overall statistics
  const totalPolls = pollsWithStats.length;
  const totalVotes = pollsWithStats.reduce((sum, poll) => sum + poll.totalVotes, 0);
  const activePolls = pollsWithStats.filter(poll => poll.totalVotes > 0).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">Loading your polls...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Polls</h1>
              <p className="text-gray-600">Manage and track your created polls</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/polls" 
                className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                ← Back to Dashboard
              </Link>
              <Link 
                href="/polls/create" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create New Poll
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Polls</p>
                <p className="text-2xl font-bold text-gray-900">{totalPolls}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold text-gray-900">{totalVotes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Polls</p>
                <p className="text-2xl font-bold text-gray-900">{activePolls}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Votes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalPolls > 0 ? (totalVotes / totalPolls).toFixed(1) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Polls Management Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Your Polls</h2>
            <p className="text-gray-600 text-sm mt-1">Manage and track performance of your polls</p>
          </div>
          
          <div className="p-6">
            {pollsWithStats.length > 0 ? (
              <div className="space-y-6">
                {pollsWithStats.map((poll) => (
                  <PollManagementCard 
                    key={poll.id}
                    poll={poll}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No polls created yet</h3>
                <p className="text-gray-600 mb-6">Start creating polls to see them here with detailed analytics!</p>
                <Link 
                  href="/polls/create" 
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Your First Poll
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}