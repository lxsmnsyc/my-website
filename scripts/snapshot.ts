/**
 * Writes a local copy of the repository list to src/repos-snapshot.json.
 *
 * The page falls back to that file when GitHub rate limits a visitor, so run
 * this whenever the wall should be brought up to date:
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

import type { FetchedData } from '../src/data';

const USER = 'lxsmnsyc';
const PER_PAGE = 100;
const MAX_PAGES = 4;

const OUTPUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'repos-snapshot.json');

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

  writeFileSync(OUTPUT, `${JSON.stringify(snapshot, null, 2)}\n`);

  process.stdout.write(
    `Wrote ${repos.length} repositories to ${OUTPUT}${token ? '' : ' (anonymous request)'}\n`,
  );
}

await main();
