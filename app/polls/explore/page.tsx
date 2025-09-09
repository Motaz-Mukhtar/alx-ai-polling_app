
import PollCard from "@/components/PollCard";
import { getPolls } from "@/lib/pollActions";
import { Poll } from "@/lib/types";
import React from "react";

/**
 * Props interface for the ExplorePolls page component
 */
interface ExplorePollsProps {
  /** Search parameters from the URL, containing optional page number */
  searchParams: {
    page?: string;
  };
}

/**
 * Props interface for the pagination component
 */
interface PaginationProps {
  /** Current active page number */
  currentPage: number;
  /** Total number of pages available */
  totalPages: number;
}

/**
 * Pagination component for navigating through poll pages
 * 
 * @param currentPage - The currently active page number
 * @param totalPages - Total number of pages available
 * @returns JSX element containing pagination links
 */
function Pagination({ currentPage, totalPages }: PaginationProps): React.JSX.Element {
  // Don't render pagination if there's only one page or no pages
  if (totalPages <= 1) {
    return <></>;
  }

  return (
    <nav className="flex justify-center mt-8" aria-label="Poll pagination">
      <div className="flex space-x-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
          const isCurrentPage = currentPage === pageNumber;
          
          return (
            <a
              key={pageNumber}
              href={`/polls/explore?page=${pageNumber}`}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors duration-200
                ${
                  isCurrentPage
                    ? 'bg-[#8FD9FB] text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-[#87CEEB] hover:text-white'
                }
              `}
              aria-label={`Go to page ${pageNumber}`}
              aria-current={isCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * ExplorePolls page component - displays a paginated grid of all available polls
 * 
 * This server component fetches and displays polls in a responsive grid layout
 * with pagination support. Users can browse through all public polls and
 * navigate to individual poll pages.
 * 
 * @param searchParams - URL search parameters containing optional page number
 * @returns Promise resolving to JSX element containing the polls exploration page
 */
export default async function ExplorePolls({ 
  searchParams 
}: ExplorePollsProps): Promise<React.JSX.Element> {
  // Parse page number from search params, default to page 1
  const currentPage = parseInt(searchParams.page || '1', 10);
  
  // Ensure page number is valid (minimum 1)
  const validatedPage = Math.max(1, currentPage);
  
  // Configuration for pagination
  const POLLS_PER_PAGE = 10;
  
  try {
    // Fetch polls data from the server
    const { polls, total } = await getPolls({ 
      page: validatedPage, 
      limit: POLLS_PER_PAGE 
    });
    
    // Calculate total number of pages
    const totalPages = Math.ceil(total / POLLS_PER_PAGE);
    
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Explore Polls
          </h1>
          <p className="text-gray-600">
            Discover and participate in polls created by the community
          </p>
          {total > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {polls.length} of {total} polls
            </p>
          )}
        </div>
        
        {/* Polls Grid */}
        {polls.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {polls.map((poll: Poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
            
            {/* Pagination */}
            <Pagination 
              currentPage={validatedPage} 
              totalPages={totalPages} 
            />
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No polls found
              </h3>
              <p className="text-gray-500 mb-4">
                There are no polls available at the moment. Be the first to create one!
              </p>
              <a
                href="/polls/create"
                className="inline-flex items-center px-4 py-2 bg-[#8FD9FB] text-white rounded-lg hover:bg-[#87CEEB] transition-colors duration-200"
              >
                Create Your First Poll
              </a>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    // Error handling for failed poll fetching
    console.error('Failed to fetch polls:', error);
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Error Loading Polls
            </h3>
            <p className="text-gray-500 mb-4">
              We encountered an error while loading the polls. Please try again later.
            </p>
            <a
              href="/polls/explore"
              className="inline-flex items-center px-4 py-2 bg-[#8FD9FB] text-white rounded-lg hover:bg-[#87CEEB] transition-colors duration-200"
            >
              Try Again
            </a>
          </div>
        </div>
      </div>
    );
  }
}
