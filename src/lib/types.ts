export interface RawPost {
  source: "reddit" | "producthunt";
  title: string;
  body: string;
  url: string;
  upvotes: number;
  comments: number;
  subreddit?: string;
  tagline?: string;
  createdAt: string;
}

export interface ScoredNeed {
  source: "reddit" | "producthunt";
  title: string;
  painPoint: string;
  clarity: number;
  marketSignal: number;
  score: number;
  originalUrl: string;
  upvotes: number;
  comments: number;
  subreddit?: string;
  tagline?: string;
}

export interface SearchResult {
  keyword: string;
  needs: ScoredNeed[];
  totalRaw: number;
  filteredOut: number;
  errors?: string[];
}
