'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { deletePoll } from '@/lib/pollActions';
import QRCodeModal from '@/components/QRCodeModal';
import { 
  BarChart3, 
  Share2, 
  Eye, 
  Edit, 
  Trash2, 
  Copy,
  CheckCircle,
  TrendingUp,
  QrCode
} from 'lucide-react';

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

type Props = {
  poll: PollWithStats;
};

export default function PollManagementCard({ poll }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  const formattedDate = new Date(poll.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const pollUrl = `http://localhost:3000/polls/${poll.id}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePoll(poll.id);
      setShowDeleteConfirm(false);
      // The page will be revalidated automatically by the server action
    } catch (error) {
      console.error('Error deleting poll:', error);
      alert('Failed to delete poll. Please try again.');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold line-clamp-2 mb-2">
              {poll.question}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm text-gray-500">
              <span>Created {formattedDate}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
              </span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-1"
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-1"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Vote Statistics */}
        <div className="space-y-3">
          {JSON.parse(poll.options).map((option, index) => {
            const voteCount = poll.voteCounts[index] || 0;
            const percentage = poll.totalVotes > 0 ? (voteCount / poll.totalVotes) * 100 : 0;
            const isMostVoted = index === poll.mostVotedOption && voteCount > 0;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {option}
                    {isMostVoted && (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    )}
                  </span>
                  <span className="text-sm text-gray-500">
                    {voteCount} votes ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isMostVoted ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        {poll.totalVotes > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Most Popular Choice</p>
                <p className="text-lg font-semibold text-green-600">
                  {poll.mostVotedOptionText}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Votes</p>
                <p className="text-lg font-bold text-gray-900">{poll.mostVotedCount}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/polls/${poll.id}`)}
            className="flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            View Poll
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/polls/${poll.id}/edit`)}
            className="flex items-center gap-1"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </CardFooter>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Poll</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete &quot;{poll.question}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        pollUrl={pollUrl}
        pollQuestion={poll.question}
      />
    </Card>
  );
}
