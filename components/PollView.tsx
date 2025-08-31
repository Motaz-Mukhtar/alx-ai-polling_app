'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import QRCodeModal from '@/components/QRCodeModal';
import { QrCode, Copy, CheckCircle } from 'lucide-react';

type PollViewProps = {
  poll: {
    id: string;
    question: string;
    options: string[];
    created_at: string;
    profiles?: { username: string };
  };
  voteCounts: number[];
  totalVotes: number;
  children: React.ReactNode; // For VoteForm
};

export default function PollView({ poll, voteCounts, totalVotes, children }: PollViewProps) {
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  
  const pollUrl = `${window.location.origin}/polls/${poll.id}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Poll Details</h1>
              <p className="text-gray-600">Cast your vote and see results</p>
            </div>
            <Link 
              href="/polls" 
              className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Poll Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* Poll Question */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{poll.question}</h2>
            <div className="flex items-center text-sm text-gray-600 space-x-4">
              <span>By {poll.profiles?.username || 'Anonymous'}</span>
              <span>•</span>
              <span>{new Date(poll.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>{totalVotes} votes</span>
            </div>
          </div>

          {/* Voting Form */}
          <div className="mb-8">
            {children}
          </div>
          
          {/* Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Results</h3>
            
            {poll.options.map((option: string, index: number) => {
              const voteCount = voteCounts[index];
              const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
              
              return (
                <div key={index} className="w-full p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{option}</span>
                    <span className="text-sm text-gray-600">{voteCount} votes</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>

          {/* Results Summary */}
          {totalVotes > 0 && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Results Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalVotes}</div>
                  <div className="text-sm text-gray-600">Total Votes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{poll.options.length}</div>
                  <div className="text-sm text-gray-600">Options</div>
                </div>
              </div>
            </div>
          )}

          {/* Share Poll */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share This Poll</h3>
            <div className="flex items-center space-x-4 mb-4">
              <input
                type="text"
                value={pollUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
              <Button
                onClick={copyToClipboard}
                className="flex items-center gap-2"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowQRModal(true)}
                className="flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                QR Code
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Share this poll with others so they can vote too!
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        pollUrl={pollUrl}
        pollQuestion={poll.question}
      />
    </div>
  );
}
