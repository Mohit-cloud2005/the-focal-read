export interface Article {
  title: string;
  description: string;
  content?: string;
  url: string;
  image: string;
  publishedAt: string;
  source: {
    name: string;
    url?: string;
  };
}

export type Category =
  | "general"
  | "business"
  | "entertainment"
  | "health"
  | "science"
  | "sports"
  | "technology";

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

export interface AISummaryResponse {
  summary: string[];
  isRealAI: boolean;
  notice?: string;
}
