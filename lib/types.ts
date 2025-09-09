
export interface Poll {
    id: string;
    question: string;
    options: string[];
    votes: number;
    createdBy: string;
    created_at: string;
}
