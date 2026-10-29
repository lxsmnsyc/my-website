/**
 * The composition: which repositories go together, how big each plane is,
 * where the lines run and which planes get a colour. Everything here is pure
 * geometry, so the stage can lay out any view without touching the DOM.
 */
import type { FetchedData } from '../data';

export interface Repo extends FetchedData {
  /**
   * Set on repositories that belong to someone else.
   */
  owner?: string;
  /**
   * Pull requests by the user merged into a repository someone else owns.
   */
  prs?: number;
}

export interface Family {
  name: string;
  blurb: string;
  repos: Repo[];
}

export interface Totals {
  repos: number;
  stars: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * A line runs along `c` from `a` to `b`. A vertical line has `c` on the x
 * axis.
 */
export interface Line {
  id: string;
  v: boolean;
  c: number;
  a: number;
  b: number;
  depth: number;
}

export type Color = 'white' | 'red' | 'blue' | 'yellow' | 'ink';

export type Content =
  | { kind: 'identity' }
  | { kind: 'stats' }
  | { kind: 'links' }
  | { kind: 'family'; family: Family }
  | { kind: 'title'; family: Family }
  | { kind: 'repo'; repo: Repo }
  | { kind: 'more'; count: number };

export interface Plane {
  id: string;
  rect: Rect;
  content: Content;
  color: Color;
  /**
   * White planes alternate between two off-whites, the way Mondrian's whites
   * are never quite the same paint.
   */
  alt: boolean;
}

export interface Layout {
  planes: Plane[];
  lines: Line[];
}

export interface View {
  width: number;
  height: number;
  /**
   * Line weight.
   */
  thickness: number;
}

export function viewOf(width: number, height: number): View {
  return {
    width,
    height,
    thickness: Math.round(Math.max(6, Math.min(11, Math.min(width, height) * 0.011))),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ------------------------------------------------------------------ data --

/**
 * Star counts span three orders of magnitude, so the raw value is compressed.
 * Upstream work is sized by merged pull requests instead of somebody else's
 * star count, or solidjs/solid would swallow the canvas.
 */
export function weightOf(repo: Repo): number {
  if (repo.prs) {
    return (repo.prs * 30 + 1) ** 0.62;
  }
  return (repo.stargazers_count + repo.forks_count * 0.5 + 1) ** 0.62;
}

const COMPILER_NAMES = new Set(['seroval', 'forgetti', 'thaler', 'dismantle', 'ecmason']);
const COMPILER_TOPICS = [
  'babel',
  'babel-plugin',
  'compiler',
  'parser',
  'rollup-plugin',
  'vite-plugin',
];

/**
 * Groups by what a repository is for rather than its language. The order of
 * the checks matters: a Babel plugin for Solid is a compiler first.
 */
function familyOf(repo: FetchedData): string {
  const name = repo.name.toLowerCase();
  const topics = new Set(repo.topics);
  if (COMPILER_NAMES.has(name)) {
    return 'Compilers';
  }
  for (const topic of COMPILER_TOPICS) {
    if (topics.has(topic)) {
      return 'Compilers';
    }
  }
  if (
    name.startsWith('solid') ||
    topics.has('solid-js') ||
    topics.has('solidjs') ||
    name === 'terracotta' ||
    name === 'caldaria'
  ) {
    return 'Solid';
  }
  if (repo.language === 'Lua' || topics.has('lua') || topics.has('love2d')) {
    return 'Lua';
  }
  if (
    name.startsWith('react') ||
    name.startsWith('preact') ||
    topics.has('react') ||
    topics.has('preact') ||
    topics.has('react-hooks') ||
    repo.language === 'Reason'
  ) {
    return 'React';
  }
  return 'Elsewhere';
}

const BLURBS: Record<string, string> = {
  Solid: 'Primitives, UI bindings and SSR for SolidJS',
  Compilers: 'Serializers, Babel plugins and the layer underneath',
  React: 'Hooks, state and bindings for React, Preact and Reason',
  Lua: 'Lua and LÖVE experiments',
  Elsewhere: 'Lists, experiments and everything else',
  Upstream: 'Merged pull requests to projects other people own',
};

export function buildFamilies(repos: FetchedData[], upstream: Repo[]): Family[] {
  const buckets = new Map<string, Repo[]>();
  for (const repo of repos) {
    const name = familyOf(repo);
    let bucket = buckets.get(name);
    if (!bucket) {
      bucket = [];
      buckets.set(name, bucket);
    }
    bucket.push(repo);
  }
  if (upstream.length > 0) {
    buckets.set('Upstream', [...upstream]);
  }
  const families: Family[] = [];
  for (const [name, list] of buckets) {
    list.sort((a, b) => weightOf(b) - weightOf(a));
    families.push({ name, blurb: BLURBS[name] ?? '', repos: list });
  }
  return families;
}

export function totalsOf(repos: FetchedData[]): Totals {
  let stars = 0;
  for (const repo of repos) {
    stars += repo.stargazers_count;
  }
  return { repos: repos.length, stars };
}

export function familyMeta(family: Family): string {
  let stars = 0;
  let prs = 0;
  for (const repo of family.repos) {
    if (repo.prs) {
      prs += repo.prs;
    } else {
      stars += repo.stargazers_count;
    }
  }
  if (prs > 0) {
    return `${family.repos.length} projects · ${prs} PRs merged`;
  }
  return `${family.repos.length} repos · ${stars} ★`;
}

// ---------------------------------------------------------------- layout --

interface Item {
  id: string;
  w: number;
  content: Content;
}

interface Placed {
  item: Item;
  rect: Rect;
}

function sumOf(items: Item[]): number {
  let total = 0;
  for (const item of items) {
    total += item.w;
  }
  return total;
}

/**
 * Guillotine partition. Every cut runs the full length of the region it
 * splits, so the lines stay continuous the way Mondrian's do. Odd depths
 * swap the halves so the heavy blocks do not all pile into one corner.
 */
function partition(
  items: Item[],
  rect: Rect,
  prefix: string,
  depth: number,
  placed: Placed[],
  lines: Line[],
): void {
  if (items.length === 1) {
    placed.push({ item: items[0], rect });
    return;
  }
  const total = sumOf(items);
  let acc = 0;
  let k = 1;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < items.length - 1; i++) {
    acc += items[i].w;
    const distance = Math.abs(acc - total / 2);
    if (distance < best) {
      best = distance;
      k = i + 1;
    }
  }
  let first = items.slice(0, k);
  let second = items.slice(k);
  if (depth % 2 === 1) {
    [first, second] = [second, first];
  }
  const fraction = sumOf(first) / total;
  let a: Rect;
  let b: Rect;
  if (rect.w >= rect.h) {
    const c = rect.x + rect.w * fraction;
    a = { x: rect.x, y: rect.y, w: c - rect.x, h: rect.h };
    b = { x: c, y: rect.y, w: rect.x + rect.w - c, h: rect.h };
    lines.push({ id: prefix, v: true, c, a: rect.y, b: rect.y + rect.h, depth });
  } else {
    const c = rect.y + rect.h * fraction;
    a = { x: rect.x, y: rect.y, w: rect.w, h: c - rect.y };
    b = { x: rect.x, y: c, w: rect.w, h: rect.y + rect.h - c };
    lines.push({ id: prefix, v: false, c, a: rect.x, b: rect.x + rect.w, depth });
  }
  partition(first, a, `${prefix}0`, depth + 1, placed, lines);
  partition(second, b, `${prefix}1`, depth + 1, placed, lines);
}

export function areaOf(rect: Rect): number {
  return rect.w * rect.h;
}

function centerDistance(p: Rect, q: Rect): number {
  return Math.hypot(p.x + p.w / 2 - (q.x + q.w / 2), p.y + p.h / 2 - (q.y + q.h / 2));
}

function largest(candidates: Placed[]): Placed | undefined {
  let pick: Placed | undefined;
  for (const candidate of candidates) {
    if (!pick || areaOf(candidate.rect) > areaOf(pick.rect)) {
      pick = candidate;
    }
  }
  return pick;
}

/**
 * Picks the plane in the area band that sits farthest from every plane
 * already painted, so colour spreads across the canvas instead of clustering.
 */
function farthest(
  candidates: Placed[],
  colors: Map<Placed, Color>,
  painted: Placed[],
  total: number,
  min: number,
  max: number,
): Placed | undefined {
  let pick: Placed | undefined;
  let best = -1;
  for (const candidate of candidates) {
    const share = areaOf(candidate.rect) / total;
    if (colors.has(candidate) || share < min || share > max) {
      continue;
    }
    let distance = Number.POSITIVE_INFINITY;
    for (const other of painted) {
      distance = Math.min(distance, centerDistance(candidate.rect, other.rect));
    }
    if (distance > best) {
      best = distance;
      pick = candidate;
    }
  }
  return pick;
}

function toLayout(placed: Placed[], lines: Line[], colors: Map<Placed, Color>): Layout {
  const planes: Plane[] = [];
  let whites = 0;
  for (const entry of placed) {
    const color = colors.get(entry);
    planes.push({
      id: entry.item.id,
      rect: entry.rect,
      content: entry.item.content,
      color: color ?? 'white',
      alt: color === undefined && whites++ % 2 === 1,
    });
  }
  return { planes, lines };
}

/**
 * The landing composition: the name, one plane per family, the totals and
 * the links. Only the biggest family is red, one family far from it is blue,
 * the totals are yellow and the links are ink.
 */
export function composeHome(view: View, families: Family[]): Layout {
  const familyItems: Item[] = [];
  const raws: number[] = [];
  let raw = 0;
  for (const family of families) {
    let sum = 0;
    for (const repo of family.repos) {
      sum += weightOf(repo);
    }
    // Square root again, so a small family still gets a readable plane.
    const value = Math.sqrt(sum);
    raws.push(value);
    raw += value;
  }
  for (const [index, family] of families.entries()) {
    familyItems.push({
      id: `f:${family.name}`,
      w: (raws[index] / raw) * 0.6,
      content: { kind: 'family', family },
    });
  }
  familyItems.sort((a, b) => b.w - a.w);

  const identity: Item = { id: 'identity', w: 0.3, content: { kind: 'identity' } };
  const stats: Item = { id: 'stats', w: 0.055, content: { kind: 'stats' } };
  const links: Item = { id: 'links', w: 0.045, content: { kind: 'links' } };

  const placed: Placed[] = [];
  const lines: Line[] = [];
  partition(
    [identity, ...familyItems, stats, links],
    { x: 0, y: 0, w: view.width, h: view.height },
    'L',
    0,
    placed,
    lines,
  );

  const colors = new Map<Placed, Color>();
  const familyPlaced: Placed[] = [];
  for (const entry of placed) {
    switch (entry.item) {
      case identity:
        colors.set(entry, 'white');
        break;
      case stats:
        colors.set(entry, 'yellow');
        break;
      case links:
        colors.set(entry, 'ink');
        break;
      default:
        familyPlaced.push(entry);
    }
  }
  const red = largest(familyPlaced);
  if (red) {
    colors.set(red, 'red');
    const painted = [red];
    for (const entry of placed) {
      if (entry.item === stats) {
        painted.push(entry);
      }
    }
    const blue = farthest(familyPlaced, colors, painted, view.width * view.height, 0.025, 0.2);
    if (blue) {
      colors.set(blue, 'blue');
    }
  }
  return toLayout(placed, lines, colors);
}

/**
 * Piecewise linear map that grows one plane to fill the canvas and squeezes
 * everything around it into strips. Lines keep their order, so the
 * composition is pushed aside rather than replaced.
 */
function makeWarp(focus: Rect, view: View): { rect: (r: Rect) => Rect; line: (l: Line) => Line } {
  const strip = (length: number): number => (length < 0.5 ? 0 : clamp(length * 0.12, 22, 72));
  const axis =
    (start: number, size: number, extent: number) =>
    (value: number): number => {
      const before = strip(start);
      const after = strip(extent - start - size);
      if (value <= start) {
        return start > 0 ? (value * before) / start : 0;
      }
      if (value >= start + size) {
        const rest = extent - start - size;
        return extent - after + (rest > 0 ? ((value - start - size) * after) / rest : 0);
      }
      return before + ((value - start) * (extent - before - after)) / size;
    };
  const mx = axis(focus.x, focus.w, view.width);
  const my = axis(focus.y, focus.h, view.height);
  return {
    rect(r) {
      const x = mx(r.x);
      const y = my(r.y);
      return { x, y, w: mx(r.x + r.w) - x, h: my(r.y + r.h) - y };
    },
    line(l) {
      return l.v
        ? { ...l, c: mx(l.c), a: my(l.a), b: my(l.b) }
        : { ...l, c: my(l.c), a: mx(l.a), b: mx(l.b) };
    },
  };
}

export interface FamilyView {
  /**
   * The landing composition squeezed into strips around the family.
   */
  outer: Layout;
  /**
   * The family's own planes and lines, inside the space it grew into.
   */
  inner: Layout;
}

export function composeFamily(home: Layout, view: View, familyId: string): FamilyView | undefined {
  let focus: Plane | undefined;
  let family: Family | undefined;
  for (const plane of home.planes) {
    if (plane.id === familyId && plane.content.kind === 'family') {
      focus = plane;
      family = plane.content.family;
    }
  }
  if (!focus || !family) {
    return undefined;
  }
  const warp = makeWarp(focus.rect, view);
  const inner = warp.rect(focus.rect);

  // A phone has room for fewer tiles before they get too small to read, and
  // flatter sizes keep the smallest tile wide enough for a name.
  const narrow = view.width < 600;
  const limit = narrow ? 7 : 11;
  const flatten = narrow ? 0.6 : 1;

  const items: Item[] = [];
  let smallest = Number.POSITIVE_INFINITY;
  let tail = 0;
  for (const [index, repo] of family.repos.entries()) {
    const w = weightOf(repo) ** flatten;
    if (index < limit) {
      items.push({ id: `r:${repo.owner ?? ''}/${repo.name}`, w, content: { kind: 'repo', repo } });
      smallest = Math.min(smallest, w);
    } else {
      tail += w;
    }
  }
  const rest = family.repos.length - limit;
  if (rest > 0) {
    items.push({
      id: `more:${family.name}`,
      w: Math.max(smallest, tail * 0.2),
      content: { kind: 'more', count: rest },
    });
  }
  items.push({
    id: `title:${family.name}`,
    w: sumOf(items) * 0.32,
    content: { kind: 'title', family },
  });
  items.sort((a, b) => b.w - a.w);

  const placed: Placed[] = [];
  const lines: Line[] = [];
  partition(items, inner, `C:${family.name}:`, 0, placed, lines);

  const colors = new Map<Placed, Color>();
  const repoPlaced: Placed[] = [];
  for (const entry of placed) {
    if (entry.item.content.kind === 'repo') {
      repoPlaced.push(entry);
    } else if (entry.item.content.kind === 'more') {
      colors.set(entry, 'ink');
    }
  }
  const total = areaOf(inner);
  const red = largest(repoPlaced);
  if (red) {
    colors.set(red, 'red');
    const painted = [red];
    const blue = farthest(repoPlaced, colors, painted, total, 0.03, 0.2);
    if (blue) {
      colors.set(blue, 'blue');
      painted.push(blue);
    }
    const yellow = farthest(repoPlaced, colors, painted, total, 0.01, 0.12);
    if (yellow) {
      colors.set(yellow, 'yellow');
    }
  }

  const outerPlanes: Plane[] = [];
  for (const plane of home.planes) {
    outerPlanes.push({ ...plane, rect: warp.rect(plane.rect) });
  }
  const outerLines: Line[] = [];
  for (const line of home.lines) {
    outerLines.push(warp.line(line));
  }
  return {
    outer: { planes: outerPlanes, lines: outerLines },
    inner: toLayout(placed, lines, colors),
  };
}
