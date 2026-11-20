export interface DiscoveryFilter {
  query?: string;
  genre?: string;
  language?: string;
  status?: 'completed' | 'ongoing' | 'all';
  minReads?: number;
  minVotes?: number;
  sort?: 'hot' | 'new' | 'top';
}

export interface DiscoveredStory {
  id: string;
  title: string;
  author: {
    username: string;
    name?: string;
    avatar?: string | null;
  };
  description: string;
  genre: string;
  tags: string[];
  coverUrl?: string | null;
  numParts: number;
  readCount: number;
  voteCount: number;
  commentCount?: number;
  status: 'completed' | 'ongoing';
  url: string;
  lastUpdated?: string;
}
