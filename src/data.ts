export interface FetchedData {
  name: string;
  fork: boolean;
  html_url: string;
  forks_count: number;
  stargazers_count: number;
  archived: boolean;
  topics: string[];
  language: string | null;
  description: string | null;
  created_at: string;
  pushed_at: string;
}

const USER = 'lxsmnsyc';
const PER_PAGE = 100;
const MAX_PAGES = 4;
const CACHE_KEY = 'repo-map-cache-v1';
const CACHE_TTL = 30 * 60 * 1000;

interface Cache {
  time: number;
  data: FetchedData[];
}

/**
 * Both GitHub and the browser cache hand back untyped JSON, so the shape is
 * checked before it is trusted. Only the fields the page cannot render
 * without are verified.
 */
function isRepo(value: unknown): value is FetchedData {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    'html_url' in value &&
    typeof value.html_url === 'string'
  );
}

function isRepoList(value: unknown): value is FetchedData[] {
  return Array.isArray(value) && value.every(isRepo);
}

function isCache(value: unknown): value is Cache {
  return (
    typeof value === 'object' &&
    value !== null &&
    'time' in value &&
    typeof value.time === 'number' &&
    'data' in value &&
    isRepoList(value.data)
  );
}

function readCache(allowStale: boolean): FetchedData[] | undefined {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isCache(parsed)) {
      return undefined;
    }
    if (!allowStale && Date.now() - parsed.time > CACHE_TTL) {
      return undefined;
    }
    return parsed.data;
  } catch {
    return undefined;
  }
}

function writeCache(data: FetchedData[]): void {
  try {
    const payload: Cache = { time: Date.now(), data };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Storage is optional, ignore failures.
  }
}

async function getPage(page: number): Promise<FetchedData[]> {
  const response = await fetch(
    `https://api.github.com/users/${USER}/repos?per_page=${PER_PAGE}&sort=pushed&direction=desc&type=sources&page=${page}`,
  );
  if (!response.ok) {
    throw new Error(`GitHub responded with ${response.status}`);
  }
  const body: unknown = await response.json();
  if (!isRepoList(body)) {
    throw new Error('GitHub returned something that is not a repository list');
  }
  return body;
}

/**
 * Loads every source repository of the user, newest activity first.
 * The result is cached for the session so that a reload does not
 * burn through the anonymous GitHub rate limit.
 */
export default async function getData(): Promise<FetchedData[]> {
  const cached = readCache(false);
  if (cached) {
    return cached;
  }

  const collected: FetchedData[] = [];

  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      // Pages have to be requested in order to know when to stop.
      // eslint-disable-next-line no-await-in-loop
      const result = await getPage(page);
      collected.push(...result);
      if (result.length < PER_PAGE) {
        break;
      }
    }
  } catch (error) {
    // Anonymous callers get sixty requests an hour. When that runs out an
    // out of date map still beats an empty one.
    const stale = readCache(true);
    if (stale) {
      return stale;
    }
    throw error;
  }

  const filtered = collected.filter((item) => !item.archived).filter((item) => !item.fork);

  writeCache(filtered);

  return filtered;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Rust: '#dea584',
  Dart: '#00b4ab',
  Python: '#3572a5',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00add8',
  Java: '#b07219',
  Kotlin: '#a97bff',
  Swift: '#f05138',
  Ruby: '#701516',
  Lua: '#000080',
  Zig: '#ec915c',
  Nix: '#7e7eff',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Astro: '#ff5a03',
  MDX: '#fcb32c',
  Solidity: '#aa6746',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  OCaml: '#3be133',
};

export function getLanguageColor(language: string | null): string {
  if (language && language in LANGUAGE_COLORS) {
    return LANGUAGE_COLORS[language];
  }
  return '#8b949e';
}
