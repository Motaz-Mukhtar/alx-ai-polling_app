'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Poll } from '@/lib/types';

export default function PollCard({ poll }: { poll: Poll }) {
  const router = useRouter();
  const { id, question, options, votes, createdBy, created_at: createdAt } = poll;
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold line-clamp-2">{question}</CardTitle>
        <CardDescription className="flex justify-between items-center text-sm text-gray-500">
          <span>By {createdBy}</span>
          <span>{formattedDate}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-1">
          {options.slice(0, 3).map((option, index) => (
            <div key={index} className="text-sm text-gray-700 truncate">
              • {option}
            </div>
          ))}
          {options.length > 3 && (
            <div className="text-sm text-gray-500">+{options.length - 3} more options</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-2 border-t">
        <div className="text-sm text-gray-500">
          {votes} {votes === 1 ? 'vote' : 'votes'}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push(`/polls/${id}`)}
        >
          View Poll
        </Button>
      </CardFooter>
    </Card>
  );
}