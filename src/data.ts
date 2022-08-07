export interface FetchedData {
  name: string;
  fork: boolean;
  html_url: string;
  forks: number;
  stargazers_count: number;
  watchers_count: number;
  archived: boolean;
  topics: string[];
  description?: string;
  created_at: string;
}

export default async function getData(page: number): Promise<FetchedData[]> {
  const response = await fetch(`https://api.github.com/users/lxsmnsyc/repos?per_page=10&sort=created&direction=desc&type=sources&page=${page}`);
  const result = await response.json() as FetchedData[];
  return result.filter((item) => !item.archived)
    .filter((item) => !item.fork);
}
