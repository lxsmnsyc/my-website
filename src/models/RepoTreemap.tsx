import type { JSX } from 'solid-js';
import { For, Show, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';

import type { FetchedData } from '../data';
import type { Placed, Rect } from '../utils/treemap';
import treemap from '../utils/treemap';

/**
 * Star counts span three orders of magnitude, so the raw value is compressed.
 * The exponent keeps the popular repositories clearly dominant while leaving
 * the quiet ones large enough to aim at.
 */
function weightOf(repo: FetchedData): number {
  const score = repo.stargazers_count + repo.forks_count * 0.5;
  return (score + 1) ** 0.62;
}

function tierOf(heat: number): 'red' | 'blue' | 'yellow' | 'plain' {
  if (heat > 0.55) {
    return 'red';
  }
  if (heat > 0.35) {
    return 'blue';
  }
  if (heat > 0.2) {
    return 'yellow';
  }
  return 'plain';
}

interface Group {
  language: string;
  repos: FetchedData[];
  weight: number;
}

const GROUP_HEADER = 26;
const CELL_GAP = 6;

function groupOf(repos: FetchedData[]): Group[] {
  const buckets = new Map<string, FetchedData[]>();
  for (const repo of repos) {
    const language = repo.language ?? 'Other';
    const bucket = buckets.get(language);
    if (bucket) {
      bucket.push(repo);
    } else {
      buckets.set(language, [repo]);
    }
  }
  return [...buckets.entries()].map(([language, items]) => ({
    language,
    repos: items,
    weight: items.reduce((total, repo) => total + weightOf(repo), 0),
  }));
}

interface Slot {
  rect: Rect;
  /**
   * Which of the four Mondrian fields the cell is painted in. Only the
   * heaviest repositories earn a primary, so the composition stays mostly
   * white with a few blocks of colour.
   */
  tier: 'red' | 'blue' | 'yellow' | 'plain';
  /**
   * Cells too small to read drop their label and keep only the colour.
   */
  label: boolean;
  font: number;
}

export interface Anchor {
  repo: FetchedData;
  rect: DOMRect;
}

interface RepoTreemapProps {
  repos: FetchedData[];
  query: string;
  zoom: string | undefined;
  onZoom: (language: string | undefined) => void;
  onFocus: (anchor: Anchor | undefined) => void;
}

export default function RepoTreemap(props: RepoTreemapProps): JSX.Element {
  let container!: HTMLDivElement;

  const [size, setSize] = createSignal<{ width: number; height: number }>({ width: 0, height: 0 });
  const [active, setActive] = createSignal<string | undefined>();

  // Touch has no hover, so there the first tap reveals a square and the
  // second one opens it.
  const coarse = window.matchMedia('(hover: none)').matches;

  createEffect(() => {
    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(container);
    onCleanup(() => {
      observer.disconnect();
    });
  });

  const matched = createMemo(() => {
    const needle = props.query.trim().toLowerCase();
    if (!needle) {
      return undefined;
    }
    const hits = new Set<string>();
    for (const repo of props.repos) {
      const haystack = [repo.name, repo.description ?? '', repo.language ?? '', ...repo.topics]
        .join(' ')
        .toLowerCase();
      if (haystack.includes(needle)) {
        hits.add(repo.name);
      }
    }
    return hits;
  });

  const visible = createMemo(() => {
    const hits = matched();
    let { repos } = props;
    if (props.zoom) {
      repos = repos.filter((repo) => (repo.language ?? 'Other') === props.zoom);
    }
    if (hits) {
      repos = repos.filter((repo) => hits.has(repo.name));
    }
    return repos;
  });

  const groups = createMemo<Placed<Group>[]>(() => {
    const { width, height } = size();
    if (width === 0 || height === 0) {
      return [];
    }
    const bounds: Rect = {
      x: 0,
      y: 0,
      width,
      height,
    };
    const all = groupOf(visible());
    if (props.zoom || all.length === 1) {
      return all.map((group) => ({ item: group, ...bounds }));
    }
    return treemap(
      all.map((group) => ({ value: group.weight, item: group })),
      bounds,
    );
  });

  /**
   * Where every repository sits right now, keyed by name. Cells that fall out
   * of the current view keep their last rectangle and fade instead of jumping.
   */
  const slots = createMemo(() => {
    const placed = new Map<string, Slot>();
    const nested = groups().length > 1;
    // Weights are ranked against the whole view, not against each language,
    // so a small language does not get a red block of its own.
    const heaviest = Math.max(...visible().map(weightOf), 1);

    for (const group of groups()) {
      const inner: Rect = nested
        ? {
            x: group.x,
            y: group.y + GROUP_HEADER,
            width: group.width,
            height: Math.max(0, group.height - GROUP_HEADER),
          }
        : {
            x: group.x,
            y: group.y,
            width: group.width,
            height: group.height,
          };

      const cells = treemap(
        group.item.repos.map((repo) => ({ value: weightOf(repo), item: repo })),
        inner,
      );

      for (const cell of cells) {
        // Trimming the right and bottom edge of a block is what leaves the
        // gutter between it and its neighbour. Blocks that sit against the
        // edge of the wall have no neighbour there and stay flush, so the only
        // spacing around the wall is the page gap, which is a gutter wide.
        const atRight = cell.x + cell.width >= size().width - 0.5;
        const atBottom = cell.y + cell.height >= size().height - 0.5;
        const width = Math.max(0, cell.width - (atRight ? 0 : CELL_GAP));
        const height = Math.max(0, cell.height - (atBottom ? 0 : CELL_GAP));
        // The label is monospaced, so its width is close to
        // `characters * 0.62 * fontSize`. Solve that for the font size the
        // cell can actually afford, counting the star badge and padding.
        const stars =
          cell.item.stargazers_count > 0 ? `${cell.item.stargazers_count}`.length + 1 : 0;
        const characters = cell.item.name.length + stars;
        const font = Math.max(9, Math.min((width - 14) / (characters * 0.62), height * 0.34, 22));
        placed.set(cell.item.name, {
          tier: tierOf(weightOf(cell.item) / heaviest),
          rect: {
            x: cell.x,
            y: cell.y,
            width,
            height,
          },
          label: width > 56 && height > 26,
          font,
        });
      }
    }

    return placed;
  });

  function report(repo: FetchedData | undefined, element?: HTMLElement): void {
    setActive(repo?.name);
    props.onFocus(repo && element ? { repo, rect: element.getBoundingClientRect() } : undefined);
  }

  return (
    <div class="map" ref={container}>
      <Show when={groups().length > 1}>
        <For each={groups()}>
          {(group) => (
            <button
              type="button"
              class="map-group"
              style={{
                left: `${group.x}px`,
                top: `${group.y}px`,
                width: `${group.width}px`,
                height: `${group.height}px`,
              }}
              onClick={() => {
                props.onZoom(group.item.language);
              }}
              title={`Show only ${group.item.language}`}
            >
              <span class="map-group-label">
                <span class="map-group-name">{group.item.language}</span>
                <span class="map-group-count">{group.item.repos.length}</span>
              </span>
            </button>
          )}
        </For>
      </Show>

      <For each={props.repos}>
        {(repo) => {
          const slot = createMemo(() => slots().get(repo.name));
          const shown = createMemo(() => slot() !== undefined);
          return (
            <a
              class="map-cell"
              classList={{
                'is-hidden': !shown(),
                'is-active': active() === repo.name,
                'is-bare': !(slot()?.label ?? false),
                [`is-${slot()?.tier ?? 'plain'}`]: true,
              }}
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              tabIndex={shown() ? 0 : -1}
              aria-hidden={!shown()}
              title={`${repo.name}${repo.description ? ` — ${repo.description}` : ''}`}
              style={{
                left: `${slot()?.rect.x ?? 0}px`,
                top: `${slot()?.rect.y ?? 0}px`,
                width: `${slot()?.rect.width ?? 0}px`,
                height: `${slot()?.rect.height ?? 0}px`,
                '--cell-font': `${slot()?.font ?? 12}px`,
              }}
              onClick={(event) => {
                if (coarse && active() !== repo.name) {
                  event.preventDefault();
                  report(repo, event.currentTarget);
                }
              }}
              onPointerEnter={(event) => {
                if (!coarse) {
                  report(repo, event.currentTarget);
                }
              }}
              onPointerLeave={() => {
                if (!coarse && active() === repo.name) {
                  report(undefined);
                }
              }}
              onFocus={(event) => {
                report(repo, event.currentTarget);
              }}
              onBlur={() => {
                if (active() === repo.name) {
                  report(undefined);
                }
              }}
            >
              <span class="map-cell-body">
                <span class="map-cell-name">{repo.name}</span>
                <Show when={repo.stargazers_count > 0}>
                  <span class="map-cell-stars">{repo.stargazers_count}</span>
                </Show>
              </span>
            </a>
          );
        }}
      </For>

      <Show when={visible().length === 0}>
        <p class="map-empty">nothing matches that.</p>
      </Show>
    </div>
  );
}
