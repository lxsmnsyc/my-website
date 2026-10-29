/**
 * What is printed on each plane. Sizes are estimated from the plane's
 * rectangle first, then fitLabel measures the real text and trims it.
 */
import type { JSX } from 'solid-js';

import type { Plane, Rect, Repo, Totals } from './model';
import { clamp, familyMeta } from './model';

export interface LabelContext {
  thickness: number;
  totals: Totals;
  /**
   * Says where the data came from when it is not a fresh answer from GitHub.
   */
  note: string | undefined;
  /**
   * The device has no hover, so the hints talk about taps.
   */
  touch: boolean;
}

/**
 * Inner padding, smaller on small planes so narrow tiles keep a label.
 */
export function padFor(rect: Rect, thickness: number): number {
  return thickness / 2 + clamp(Math.min(rect.w, rect.h) * 0.09, 7, 14);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

/**
 * Lets a long name break at its dots, underscores and camel humps as well as
 * at its hyphens, which the browser already breaks at.
 */
function breakable(name: string): JSX.Element[] {
  const result: JSX.Element[] = [];
  for (const [index, piece] of name.split(/(?<=[._])|(?<=[a-z])(?=[A-Z])/).entries()) {
    if (index > 0) {
      result.push(<wbr />);
    }
    result.push(piece);
  }
  return result;
}

const LINKS = [
  { title: 'GitHub', url: 'https://github.com/lxsmnsyc' },
  { title: 'Twitter', url: 'https://twitter.com/lxsmnsyc' },
  { title: 'CodePen', url: 'https://codepen.io/lxsmnsyc' },
  { title: 'LinkedIn', url: 'https://www.linkedin.com/in/alexis-munsayac-467a27124/' },
];

function repoLabel(repo: Repo, w: number, h: number): JSX.Element {
  if (w < 30 || h < 24) {
    return undefined;
  }
  const size = clamp(Math.min(w / (repo.name.length * 0.56), h * 0.3), 11, 72);

  // Each part carries the class fitLabel drops it by. The space between
  // parts sits outside them, so the row can break there.
  const parts: [kind: string, text: string][] = [];
  if (repo.prs) {
    parts.push(['', `${repo.prs} PRs merged`]);
  }
  if (repo.stargazers_count > 0) {
    parts.push(['', `${repo.stargazers_count} ★`]);
  }
  if (repo.forks_count > 0) {
    parts.push(['m-forks', `${repo.forks_count} ${repo.forks_count === 1 ? 'fork' : 'forks'}`]);
  }
  if (repo.language) {
    parts.push(['m-lang', repo.language]);
  }
  parts.push(['m-date', formatDate(repo.pushed_at)]);
  const meta: JSX.Element[] = [];
  let metaLength = 0;
  for (const [index, [kind, text]] of parts.entries()) {
    if (index > 0) {
      meta.push(' ');
      metaLength += 3;
    }
    meta.push(<span class={`part ${kind}`}>{`${index > 0 ? '· ' : ''}${text}`}</span>);
    metaLength += text.length;
  }

  // The meta row wraps on narrow tiles; 11px mono is about 6.6px a
  // character. Whatever height is left goes to the topics, then to the
  // description in whole lines.
  const metaLines = Math.max(1, Math.ceil((metaLength * 6.6) / Math.max(w, 1)));
  let room = h - (size * 0.95 + (repo.owner ? 19 : 0) + metaLines * 16.5 + 13);

  // Topics wrap onto as many rows as the tile has height for, up to three,
  // keeping one line back for the description. A tag that would start a row
  // past that is left out whole instead of cut. 10px mono caps run about
  // 6.4px a character, plus padding.
  const maxRows = Math.min(3, Math.floor((room - (repo.description ? 18 : 0) - 30) / 20) + 1);
  const topics: string[] = [];
  let rows = 1;
  if (w >= 110 && maxRows >= 1) {
    let x = 0;
    for (const topic of repo.topics) {
      const width = topic.length * 6.4 + 12;
      if (x > 0 && x + 4 + width > w) {
        rows++;
        x = 0;
      }
      if (rows > maxRows) {
        rows = maxRows;
        break;
      }
      x += (x > 0 ? 4 : 0) + width;
      topics.push(topic);
    }
  }
  if (topics.length > 0) {
    room -= 30 + (rows - 1) * 20;
  }
  // Counted as if the meta row were one line: fitLabel drops the date,
  // language and forks before it trims the description.
  const lines = Math.min(6, Math.floor((room + (metaLines - 1) * 16.5) / 18));

  const tags: JSX.Element[] = [];
  for (const topic of topics) {
    tags.push(<span class="tag">{topic}</span>);
  }

  return (
    <div class="lift">
      {repo.owner ? <div class="owner">{repo.owner}/</div> : undefined}
      <div class="repo-name" style={{ 'font-size': `${size}px` }}>
        {breakable(repo.name)}
      </div>
      <div class="stars">{meta}</div>
      {repo.description && lines >= 1 && w >= 70 ? (
        <p class="desc" style={{ '-webkit-line-clamp': `${lines}` }}>
          {repo.description}
        </p>
      ) : undefined}
      {tags.length > 0 ? <div class="tags">{tags}</div> : undefined}
    </div>
  );
}

export function renderLabel(plane: Plane, context: LabelContext): JSX.Element {
  const pad = padFor(plane.rect, context.thickness);
  const w = plane.rect.w - pad * 2;
  const h = plane.rect.h - pad * 2;
  const { content } = plane;
  switch (content.kind) {
    case 'identity': {
      const size = clamp(Math.min(w / 4.6, h * 0.3), 28, 260);
      return (
        <div class="lift">
          <h1 class="big" style={{ 'font-size': `${size}px` }}>
            <span class="at">@</span>
            LXSMNSYC
          </h1>
          <p class="intro">
            Hi, I am Alexis. I build open source libraries for the web, mostly around SolidJS, React
            and the compilers underneath them.
          </p>
          <p class="keys">
            {context.touch
              ? 'tap a plane to open it'
              : 'click a plane · esc back · R replay · S slow motion'}
          </p>
        </div>
      );
    }
    case 'family': {
      const { family } = content;
      const size = clamp(Math.min(w / (family.name.length * 0.6), h * 0.3), 18, 120);
      return (
        <div class="lift">
          <h2 class="big" style={{ 'font-size': `${size}px` }}>
            {family.name}
          </h2>
          <div class="meta">{familyMeta(family)}</div>
          <div class="blurb">{family.blurb}</div>
        </div>
      );
    }
    case 'stats': {
      const size = clamp(Math.min(w * 0.3, h * 0.2), 16, 64);
      return (
        <>
          <div class="big" style={{ 'font-size': `${size}px` }}>
            {context.totals.repos}
          </div>
          <div class="meta">repos</div>
          <div class="big" style={{ 'font-size': `${size}px`, 'margin-top': '0.35em' }}>
            {context.totals.stars}
          </div>
          <div class="meta">stars</div>
          {context.note ? <div class="keys">{context.note}</div> : undefined}
        </>
      );
    }
    case 'links': {
      const links: JSX.Element[] = [];
      for (const link of LINKS) {
        links.push(
          <a href={link.url} target="_blank" rel="noreferrer">
            {link.title}
          </a>,
        );
      }
      return (
        <nav class="links" aria-label="Elsewhere">
          {links}
        </nav>
      );
    }
    case 'title': {
      const { family } = content;
      const size = clamp(Math.min(w / (family.name.length * 0.6), h * 0.42), 22, 220);
      return (
        <>
          <h2 class="big" style={{ 'font-size': `${size}px` }}>
            {family.name}
          </h2>
          <div class="meta">{familyMeta(family)}</div>
          <div class="blurb">{family.blurb}</div>
          <p class="keys">
            {context.touch ? 'tap here to go back' : 'esc or click here to go back'}
          </p>
        </>
      );
    }
    case 'more': {
      const size = clamp(Math.min(w * 0.3, h * 0.35), 16, 72);
      return (
        <div class="lift">
          <div class="big" style={{ 'font-size': `${size}px` }}>
            +{content.count}
          </div>
          <div class="meta">more on GitHub</div>
        </div>
      );
    }
    default:
      return repoLabel(content.repo, w, h);
  }
}

/**
 * Shrinks every headline to the width its plane actually has. The sizes in
 * renderLabel are only a starting point; the browser measures the real
 * glyphs.
 */
function fitWidth(label: HTMLElement): void {
  const room = label.clientWidth;
  if (room <= 0) {
    return;
  }
  for (const el of label.querySelectorAll<HTMLElement>('.big, .repo-name')) {
    const original = Number.parseFloat(el.style.fontSize);
    let natural = el.scrollWidth;
    if (natural <= room) {
      continue;
    }
    let size = (original * room) / natural;
    // A long name would shrink past reading size on a narrow tile, so it
    // breaks at its hyphens, dots, underscores and camel humps instead, and
    // only the longest piece has to fit the width.
    if (
      size < 13 &&
      el.classList.contains('repo-name') &&
      /[-._]|[a-z][A-Z]/.test(el.textContent)
    ) {
      const start = Math.max(original, 16);
      el.classList.add('wrap');
      el.style.fontSize = `${start}px`;
      natural = el.scrollWidth;
      size = natural > room ? (start * room) / natural : start;
    }
    el.style.fontSize = `${size}px`;
  }
}

/**
 * Optional parts of a label, least useful first.
 */
const DROPPABLE = ['.tags', '.m-date', '.m-lang', '.m-forks', '.keys', '.blurb', '.meta'];

/**
 * Drops optional parts of a label until it fits its plane, because text cut
 * off mid-line at a plane's edge reads as broken.
 */
function fitHeight(label: HTMLElement, rect: Rect, thickness: number): void {
  const room = rect.h - padFor(rect, thickness) - thickness / 2 - 6;
  // Too tall, or a word wider than the label, such as a blurb on a narrow
  // plane.
  const over = (): boolean =>
    label.scrollHeight > room || label.scrollWidth > label.clientWidth + 1;

  // A meta part wider than the whole label cannot wrap into it.
  for (const part of label.querySelectorAll<HTMLElement>('.part')) {
    if (part.offsetWidth > label.clientWidth) {
      part.remove();
    }
  }
  for (const selector of DROPPABLE) {
    if (!over()) {
      return;
    }
    label.querySelector(selector)?.remove();
  }
  const desc = label.querySelector<HTMLElement>('.desc');
  if (desc) {
    while (over()) {
      const lines = Number(desc.style.webkitLineClamp) - 1;
      if (lines < 1) {
        desc.remove();
        break;
      }
      desc.style.webkitLineClamp = `${lines}`;
    }
  }
  if (over()) {
    label.querySelector('.owner')?.remove();
  }
}

/**
 * Measures a label that is already in the document and trims it to its
 * plane.
 */
export function fitLabel(label: HTMLElement, rect: Rect, thickness: number): void {
  fitWidth(label);
  fitHeight(label, rect, thickness);
}
