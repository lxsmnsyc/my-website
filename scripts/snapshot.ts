/**
 * Writes a local copy of the repository list to src/repos-snapshot.json, and
 * the repositories of other people the user contributes to, to
 * src/upstream-snapshot.json.
 *
 * The page falls back to the first file when GitHub rate limits a visitor,
 * and always reads the second, so run this whenever the wall should be
 * brought up to date:
 *
 *   pnpm snapshot
 *
 * The GitHub API allows sixty anonymous requests an hour. A token lifts that,
 * and the script picks one up from GITHUB_TOKEN or from the gh CLI if either
 * is available.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { FetchedData, UpstreamData } from '../src/data';

const USER = 'lxsmnsyc';
const PER_PAGE = 100;
const MAX_PAGES = 4;

const SOURCE = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const OUTPUT = join(SOURCE, 'repos-snapshot.json');
const UPSTREAM_OUTPUT = join(SOURCE, 'upstream-snapshot.json');

/**
 * GitHub search returns at most a thousand results, ten pages of a hundred.
 */
const SEARCH_PAGES = 10;

/**
 * Fewer merged pull requests than this reads as a drive-by fix rather than
 * contributing to a project.
 */
const MIN_PRS = 5;

function findToken(): string | undefined {
  const fromEnvironment = process.env.GITHUB_TOKEN;
  if (fromEnvironment) {
    return fromEnvironment;
  }
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
}

function readString(source: object, key: string): string | null {
  if (key in source) {
    const value: unknown = Reflect.get(source, key);
    if (typeof value === 'string') {
      return value;
    }
  }
  return null;
}

function readNumber(source: object, key: string): number {
  if (key in source) {
    const value: unknown = Reflect.get(source, key);
    if (typeof value === 'number') {
      return value;
    }
  }
  return 0;
}

function readTopics(source: object): string[] {
  if ('topics' in source) {
    const value: unknown = Reflect.get(source, 'topics');
    if (Array.isArray(value)) {
      return value.filter((topic): topic is string => typeof topic === 'string');
    }
  }
  return [];
}

function isFlagged(source: object, key: string): boolean {
  return key in source && Reflect.get(source, key) === true;
}

/**
 * Keeps only the fields the page renders, which is about a third of what the
 * API returns, and drops forks and archived repositories the way the live
 * request does.
 */
function toRepo(value: unknown): FetchedData | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  if (isFlagged(value, 'fork') || isFlagged(value, 'archived')) {
    return undefined;
  }
  return readRepo(value);
}

function readRepo(value: object): FetchedData | undefined {
  const name = readString(value, 'name');
  const url = readString(value, 'html_url');
  if (name === null || url === null) {
    return undefined;
  }
  return {
    name,
    html_url: url,
    description: readString(value, 'description'),
    topics: readTopics(value),
    language: readString(value, 'language'),
    stargazers_count: readNumber(value, 'stargazers_count'),
    forks_count: readNumber(value, 'forks_count'),
    created_at: readString(value, 'created_at') ?? '',
    pushed_at: readString(value, 'pushed_at') ?? '',
  };
}

async function getJson(url: string, headers: Record<string, string>): Promise<unknown> {
  const response = await fetch(url, { headers });
  if (response.status === 403 || response.status === 429) {
    throw new Error(
      `GitHub rate limited ${url}. Set GITHUB_TOKEN or log in with \`gh auth login\`, then run this again.`,
    );
  }
  if (!response.ok) {
    throw new Error(`GitHub responded with ${response.status} for ${url}`);
  }
  const body: unknown = await response.json();
  return body;
}

/**
 * Counts the user's merged pull requests per repository they do not own, and
 * keeps the repositories with at least MIN_PRS of them, most first.
 */
async function collectUpstream(headers: Record<string, string>): Promise<UpstreamData[]> {
  const counts = new Map<string, number>();
  const query = encodeURIComponent(`author:${USER} type:pr is:merged -user:${USER}`);

  for (let page = 1; page <= SEARCH_PAGES; page += 1) {
    const body = await getJson(
      `https://api.github.com/search/issues?q=${query}&per_page=${PER_PAGE}&page=${page}`,
      headers,
    );
    if (
      typeof body !== 'object' ||
      body === null ||
      !('items' in body) ||
      !Array.isArray(body.items)
    ) {
      throw new Error(`GitHub search returned something unexpected on page ${page}`);
    }
    const items: unknown[] = body.items;
    for (const item of items) {
      if (typeof item !== 'object' || item === null) {
        continue;
      }
      // repository_url is https://api.github.com/repos/{owner}/{name}
      const fullName = readString(item, 'repository_url')?.split('/repos/')[1];
      if (fullName) {
        counts.set(fullName, (counts.get(fullName) ?? 0) + 1);
      }
    }
    if (items.length < PER_PAGE) {
      break;
    }
  }

  const upstream: UpstreamData[] = [];
  for (const [fullName, prs] of counts) {
    if (prs < MIN_PRS) {
      continue;
    }
    const body = await getJson(`https://api.github.com/repos/${fullName}`, headers);
    const repo = typeof body === 'object' && body !== null ? readRepo(body) : undefined;
    if (repo) {
      upstream.push({ ...repo, owner: fullName.split('/')[0], prs });
    }
  }
  upstream.sort((a, b) => b.prs - a.prs);
  return upstream;
}

async function main(): Promise<void> {
  const token = findToken();
  const headers: Record<string, string> = { accept: 'application/vnd.github+json' };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const repos: FetchedData[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = `https://api.github.com/users/${USER}/repos?per_page=${PER_PAGE}&sort=pushed&direction=desc&type=sources&page=${page}`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`GitHub responded with ${response.status} on page ${page}`);
    }
    const body: unknown = await response.json();
    if (!Array.isArray(body)) {
      throw new Error(`GitHub returned something that is not a list on page ${page}`);
    }
    for (const entry of body) {
      const repo = toRepo(entry);
      if (repo) {
        repos.push(repo);
      }
    }
    if (body.length < PER_PAGE) {
      break;
    }
  }

  const snapshot = {
    generated: new Date().toISOString(),
    repos,
  };

  // Both files are written only after every request has succeeded, so a
  // failure part way leaves the two snapshots from the same run.
  const upstream = await collectUpstream(headers);
  writeFileSync(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`);
  writeFileSync(
    UPSTREAM_OUTPUT,
    `${JSON.stringify({ generated: snapshot.generated, repos: upstream }, null, 2)}\n`,
  );

  process.stdout.write(
    `Wrote ${repos.length} repositories to ${OUTPUT} and ${upstream.length} to ${UPSTREAM_OUTPUT}${token ? '' : ' (anonymous request)'}\n`,
  );
}

await main();
