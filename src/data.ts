export interface FetchedData {
  name: string;
  html_url: string;
  description: string | null;
  topics: string[];
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  pushed_at: string;
}

/**
 * Where the repositories on screen came from. The page says so when it is
 * showing anything other than a fresh answer from GitHub.
 */
export type Source = 'live' | 'cache' | 'snapshot';

export interface Dataset {
  repos: FetchedData[];
  source: Source;
  /**
   * When the data was produced, for the cache and the snapshot.
   */
  generated?: string;
}

interface Snapshot {
  generated: string;
  repos: FetchedData[];
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
 * GitHub, the browser cache and the bundled snapshot all hand back untyped
 * JSON, so the shape is checked before it is trusted. Only the fields the
 * page cannot render without are verified.
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

function isSnapshot(value: unknown): value is Snapshot {
  return (
    typeof value === 'object' &&
    value !== null &&
    'generated' in value &&
    typeof value.generated === 'string' &&
    'repos' in value &&
    isRepoList(value.repos)
  );
}

function readCache(allowStale: boolean): Cache | undefined {
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
    return parsed;
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

/**
 * The snapshot is a separate chunk, so a visitor who never hits the rate
 * limit never downloads it. Regenerate it with `pnpm snapshot`.
 */
async function readSnapshot(): Promise<Dataset | undefined> {
  try {
    const loaded: unknown = await import('./repos-snapshot.json');
    if (
      typeof loaded === 'object' &&
      loaded !== null &&
      'default' in loaded &&
      isSnapshot(loaded.default)
    ) {
      return {
        repos: loaded.default.repos,
        source: 'snapshot',
        generated: loaded.default.generated,
      };
    }
    return undefined;
  } catch {
    return undefined;
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

interface RawRepo {
  fork?: boolean;
  archived?: boolean;
}

function isListed(repo: FetchedData & RawRepo): boolean {
  return repo.archived !== true && repo.fork !== true;
}

/**
 * Loads every source repository of the user, newest activity first.
 *
 * Anonymous callers get sixty GitHub requests an hour, so the answer is kept
 * in local storage for half an hour, and when a request does fail the page
 * falls back first to that store, however old it is, and then to the snapshot
 * committed alongside the source.
 */
export default async function getData(): Promise<Dataset> {
  const fresh = readCache(false);
  if (fresh) {
    return { repos: fresh.data, source: 'cache', generated: new Date(fresh.time).toISOString() };
  }

  const collected: FetchedData[] = [];

  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      // Pages have to be requested in order to know when to stop.
      const result = await getPage(page);
      collected.push(...result);
      if (result.length < PER_PAGE) {
        break;
      }
    }
  } catch (error) {
    const stale = readCache(true);
    if (stale) {
      return { repos: stale.data, source: 'cache', generated: new Date(stale.time).toISOString() };
    }
    const snapshot = await readSnapshot();
    if (snapshot) {
      return snapshot;
    }
    throw error;
  }

  const filtered = collected.filter(isListed);

  writeCache(filtered);

  return { repos: filtered, source: 'live' };
}
