
import PollCard from "@/components/PollCard";
import { getPolls } from "@/lib/pollActions";
import { Poll } from "@/lib/types";


export default async function ExplorePolls({ searchParams }: { searchParams: { page?: string } }) {
    const page = parseInt(searchParams.page || '1', 10);
    const { polls, total } = await getPolls({ page, limit: 10 });
    const totalPages = Math.ceil(total / 10);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Explore Polls</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {polls.map((poll: Poll) => (
                    <PollCard key={poll.id} poll={poll} />
                ))}
            </div>
            <div className="flex justify-center mt-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <a
                        key={p}
                        href={`/polls/explore?page=${p}`}
                        className={`px-3 py-1 mx-1 rounded ${page === p ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                        {p}
                    </a>
                ))}
            </div>
        </div>
    );
}
