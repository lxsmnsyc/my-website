import type { JSX } from 'solid-js';
import {
  For,
  Show,
  createEffect,
  createMemo,
  createResource,
  createSignal,
  onCleanup,
} from 'solid-js';

import type { FetchedData } from './data';
import getData from './data';
import type { Anchor } from './models/RepoTreemap';
import RepoTreemap from './models/RepoTreemap';

function Github(props: JSX.IntrinsicElements['svg']): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z"
      />
    </svg>
  );
}

function Codepen(props: JSX.IntrinsicElements['svg']): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path d="M21.838 8.445c0-.001-.001-.001 0 0l-.003-.004-.001-.001v-.001a.809.809 0 0 0-.235-.228l-9.164-6.08a.834.834 0 0 0-.898 0L2.371 8.214A.786.786 0 0 0 2 8.897v6.16a.789.789 0 0 0 .131.448v.001l.002.002.01.015v.002h.001l.001.001.001.001c.063.088.14.16.226.215l9.165 6.082a.787.787 0 0 0 .448.139.784.784 0 0 0 .45-.139l9.165-6.082a.794.794 0 0 0 .371-.685v-6.16a.793.793 0 0 0-.133-.452zm-9.057-4.172 6.953 4.613-3.183 2.112-3.771-2.536V4.273zm-1.592 0v4.189l-3.771 2.536-3.181-2.111 6.952-4.614zm-7.595 6.098 2.395 1.59-2.395 1.611v-3.201zm7.595 9.311-6.96-4.617 3.195-2.15 3.765 2.498v4.269zm.795-5.653-3.128-2.078 3.128-2.105 3.131 2.105-3.131 2.078zm.797 5.653v-4.27l3.766-2.498 3.193 2.15-6.959 4.618zm7.597-6.11-2.396-1.611 2.396-1.59v3.201z" />
    </svg>
  );
}

function Twitter(props: JSX.IntrinsicElements['svg']): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path d="M19.633 7.997c.013.175.013.349.013.523 0 5.325-4.053 11.461-11.46 11.461-2.282 0-4.402-.661-6.186-1.809.324.037.636.05.973.05a8.07 8.07 0 0 0 5.001-1.721 4.036 4.036 0 0 1-3.767-2.793c.249.037.499.062.761.062.361 0 .724-.05 1.061-.137a4.027 4.027 0 0 1-3.23-3.953v-.05c.537.299 1.16.486 1.82.511a4.022 4.022 0 0 1-1.796-3.354c0-.748.199-1.434.548-2.032a11.457 11.457 0 0 0 8.306 4.215c-.062-.3-.1-.611-.1-.923a4.026 4.026 0 0 1 4.028-4.028c1.16 0 2.207.486 2.943 1.272a7.957 7.957 0 0 0 2.556-.973 4.02 4.02 0 0 1-1.771 2.22 8.073 8.073 0 0 0 2.319-.624 8.645 8.645 0 0 1-2.019 2.083z" />
    </svg>
  );
}

interface SocialData {
  url: string;
  icon: (props: JSX.IntrinsicElements['svg']) => JSX.Element;
  title: string;
}

const SOCIAL: SocialData[] = [
  {
    url: 'https://github.com/lxsmnsyc',
    icon: Github,
    title: 'Github',
  },
  {
    url: 'https://twitter.com/lxsmnsyc',
    icon: Twitter,
    title: 'Twitter',
  },
  {
    url: 'https://codepen.io/lxsmnsyc',
    icon: Codepen,
    title: 'Codepen',
  },
];

function StarIcon(props: JSX.IntrinsicElements['svg']): JSX.Element {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.5l2.92 5.92 6.53.95-4.72 4.6 1.11 6.5L12 17.42 6.16 20.47l1.11-6.5-4.72-4.6 6.53-.95z" />
    </svg>
  );
}

function ForkIcon(props: JSX.IntrinsicElements['svg']): JSX.Element {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6 3a3 3 0 0 1 1 5.83V10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8.83A3 3 0 1 1 19 3a3 3 0 0 1 1 5.83V10a4 4 0 0 1-4 4h-3v1.17a3 3 0 1 1-2 0V14H9a4 4 0 0 1-4-4V8.83A3 3 0 0 1 6 3z" />
    </svg>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
  });
}

const TIP_GAP = 10;
const TIP_EDGE = 12;

/**
 * The repository card. It is fixed positioned next to its square so that
 * showing it can never resize the treemap underneath, which would otherwise
 * pull the square out from under the pointer.
 */
function Tooltip(props: { anchor: Anchor }): JSX.Element {
  let element!: HTMLDivElement;
  const [placement, setPlacement] = createSignal<{ left: number; top: number } | undefined>();

  createEffect(() => {
    const { rect } = props.anchor;
    const width = element.offsetWidth;
    const height = element.offsetHeight;

    let left = Math.min(rect.left, window.innerWidth - width - TIP_EDGE);
    left = Math.max(TIP_EDGE, left);

    let top = rect.bottom + TIP_GAP;
    if (top + height > window.innerHeight - TIP_EDGE) {
      top = rect.top - height - TIP_GAP;
    }
    top = Math.max(TIP_EDGE, top);

    setPlacement({ left, top });
  });

  const repo = (): FetchedData => props.anchor.repo;

  return (
    <div
      ref={element}
      class="tip"
      classList={{ 'is-placed': placement() !== undefined }}
      style={{
        left: `${placement()?.left ?? 0}px`,
        top: `${placement()?.top ?? 0}px`,
      }}
      role="status"
    >
      <div class="detail-head">
        <h2>{repo().name}</h2>
        <span class="detail-stats">
          <StarIcon class="detail-stat-icon" />
          {repo().stargazers_count}
          <ForkIcon class="detail-stat-icon" />
          {repo().forks_count}
        </span>
      </div>
      <p class="detail-description">{repo().description ?? 'No description.'}</p>
      <div class="detail-meta">
        <Show when={repo().language}>
          <span class="detail-tag">{repo().language}</span>
        </Show>
        <For each={repo().topics.slice(0, 6)}>
          {(topic) => <span class="detail-tag">{topic}</span>}
        </For>
        <span class="detail-date">{formatDate(repo().pushed_at)}</span>
      </div>
    </div>
  );
}

export default function Index(): JSX.Element {
  const [repos] = createResource(getData);
  const [query, setQuery] = createSignal('');
  const [zoom, setZoom] = createSignal<string | undefined>();
  const [active, setActive] = createSignal<Anchor | undefined>();

  const all = createMemo(() => repos() ?? []);

  const stars = createMemo(() => all().reduce((total, item) => total + item.stargazers_count, 0));

  const hits = createMemo(() => {
    const needle = query().trim().toLowerCase();
    if (!needle) {
      return undefined;
    }
    return all().filter(
      (repo) =>
        repo.name.toLowerCase().includes(needle) ||
        (repo.description ?? '').toLowerCase().includes(needle) ||
        (repo.language ?? '').toLowerCase().includes(needle) ||
        repo.topics.some((topic) => topic.toLowerCase().includes(needle)),
    ).length;
  });

  const languages = createMemo(() => {
    const counts = new Map<string, number>();
    for (const repo of all()) {
      const language = repo.language ?? 'Other';
      counts.set(language, (counts.get(language) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 7);
  });

  // Escape backs out of a language, which is the only navigation state here.
  createEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && zoom()) {
        setZoom(undefined);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    onCleanup(() => {
      window.removeEventListener('keydown', onKeyDown);
    });
  });

  return (
    <div class="stage">
      <div class="stage-glow" aria-hidden="true" />

      <header class="bar">
        <div class="bar-identity">
          <h1 class="title">
            <span class="title-at">@</span>
            lxsmnsyc
          </h1>
          <p class="subtitle">
            Hi, I am Alexis. I build open source libraries for the web, mostly around SolidJS, React
            and the compilers underneath them. Every public repository I have written is on this
            wall. The bigger the block, the more people have starred it.
          </p>
        </div>

        <nav class="socials" aria-label="Social links">
          <For each={SOCIAL}>
            {(item) => (
              <a href={item.url} title={item.title} class="social" target="_blank" rel="noreferrer">
                <span class="sr-only">{item.title}</span>
                <item.icon class="social-icon" />
              </a>
            )}
          </For>
        </nav>

        <div class="bar-controls">
          <div class="search">
            <input
              type="search"
              aria-label="Filter repositories"
              placeholder="filter"
              value={query()}
              onInput={(event) => {
                setQuery(event.currentTarget.value);
              }}
            />
          </div>
          <div class="counters">
            <Show
              when={hits() !== undefined}
              fallback={
                <>
                  <span>
                    <strong>{all().length}</strong>
                    {' repos'}
                  </span>
                  <span>
                    <strong>{stars()}</strong>
                    {' stars'}
                  </span>
                </>
              }
            >
              <span>
                <strong>{hits()}</strong>
                {` of ${all().length} match`}
              </span>
            </Show>
          </div>
        </div>
      </header>

      <div class="legend">
        <button
          type="button"
          class="chip"
          classList={{ 'is-on': zoom() === undefined }}
          onClick={() => {
            setZoom(undefined);
          }}
        >
          all
        </button>
        <For each={languages()}>
          {([language, count]) => (
            <button
              type="button"
              class="chip"
              classList={{ 'is-on': zoom() === language }}
              onClick={() => {
                setZoom(zoom() === language ? undefined : language);
              }}
            >
              {language}
              <span class="chip-count">{count}</span>
            </button>
          )}
        </For>
      </div>

      <main class="canvas">
        <Show
          when={!repos.loading && all().length > 0}
          fallback={
            <div class="loader">
              <Show when={repos.error !== undefined} fallback={<span>packing the squares…</span>}>
                <span>GitHub is not answering right now.</span>
              </Show>
            </div>
          }
        >
          <RepoTreemap
            repos={all()}
            query={query()}
            zoom={zoom()}
            onZoom={(language) => {
              setZoom(language);
            }}
            onFocus={(anchor) => {
              setActive(anchor);
            }}
          />
        </Show>
      </main>

      <footer class="dock">
        <p class="hint">
          <span>area is stars plus forks</span>
          <span>click a language to drill in</span>
          <span>escape to zoom out</span>
          <span>click a square to open it</span>
        </p>
      </footer>

      <Show when={active()}>{(anchor) => <Tooltip anchor={anchor()} />}</Show>
    </div>
  );
}
