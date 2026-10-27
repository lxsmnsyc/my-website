/**
 * Draws the composition and runs every transition between its views.
 *
 * Planes cover the whole canvas and are cut to their rectangle with
 * clip-path, and lines are a 1px square scaled into place, so every animation
 * here is a clip-path or a transform and nothing triggers layout.
 */
import { createRoot } from 'solid-js';
import { insert } from 'solid-js/web';

import type { LabelContext } from './labels';
import { fitLabel, padFor, renderLabel } from './labels';
import type { Family, Layout, Line, Plane, Rect, Totals, View } from './model';
import { areaOf, clamp, composeFamily, composeHome, viewOf } from './model';

const EASE_LINE = 'cubic-bezier(0.7, 0, 0.15, 1)';
const EASE_PAINT = 'cubic-bezier(0.45, 0, 0.2, 1)';

/**
 * Every duration is multiplied by this. Two plays the choreography at half
 * speed on purpose: at full speed the lines read as snapped, not drawn.
 */
const BASE_SLOWDOWN = 2;

/**
 * Exits and reversals run at this fraction of the entry time.
 */
const EXIT = 0.7;

const LABEL_SHOWN = 'inset(-60px -200vw -200vh -60px)';
const LABEL_HIDDEN = 'inset(-60px 100% -200vh -60px)';

type Side = 'left' | 'right' | 'top' | 'bottom';

interface PlaneRecord {
  el: HTMLElement;
  label: HTMLElement;
  frame: HTMLElement;
  plane: Plane;
  rect: Rect;
  /**
   * Releases the label's Solid root.
   */
  dispose: () => void;
}

interface LineRecord {
  el: HTMLElement;
  line: Line;
}

interface Timing {
  duration: number;
  delay: number;
  easing: string;
  fill: FillMode;
}

interface Spec {
  el: HTMLElement;
  keyframes: Keyframe[];
  timing: Timing;
}

interface Transition {
  kind: 'drill' | 'back';
  specs: Spec[];
  animations: Animation[];
  direction: 1 | -1;
  /**
   * When the last animation ends, in milliseconds on the forward timeline.
   */
  end: number;
  clock: { t0: number; from: number; rate: number };
  commit: () => void;
  revert: () => void;
}

interface Saved {
  planes: Map<string, { rect: Rect; label: string }>;
  lines: Map<string, Line>;
}

export interface StageOptions {
  families: Family[];
  totals: Totals;
  note: string | undefined;
}

function clipFor(view: View, r: Rect): string {
  return `inset(${r.y}px ${view.width - r.x - r.w}px ${view.height - r.y - r.h}px ${r.x}px)`;
}

/**
 * The side a colour is brushed in from: the longest edge of the plane that
 * is a line rather than the edge of the canvas.
 */
function wipeSide(view: View, r: Rect): Side {
  let side: Side = 'left';
  let best = -1;
  const sides: [Side, boolean, number][] = [
    ['left', r.x > 0.5, r.h],
    ['right', r.x + r.w < view.width - 0.5, r.h],
    ['top', r.y > 0.5, r.w],
    ['bottom', r.y + r.h < view.height - 0.5, r.w],
  ];
  for (const [name, inside, length] of sides) {
    if (inside && length > best) {
      best = length;
      side = name;
    }
  }
  return side;
}

function collapsed(r: Rect, side: Side): Rect {
  switch (side) {
    case 'left':
      return { ...r, w: 0 };
    case 'right':
      return { ...r, x: r.x + r.w, w: 0 };
    case 'top':
      return { ...r, h: 0 };
    default:
      return { ...r, y: r.y + r.h, h: 0 };
  }
}

function growFrom(view: View, l: Line): 'start' | 'end' {
  const extent = l.v ? view.height : view.width;
  if (l.a <= 0.5) {
    return 'start';
  }
  if (l.b >= extent - 0.5) {
    return 'end';
  }
  return l.depth % 2 === 0 ? 'start' : 'end';
}

function byLength(a: Line, b: Line): number {
  return b.b - b.a - (a.b - a.a);
}

function byDrawingOrder(a: Line, b: Line): number {
  return a.depth - b.depth || byLength(a, b);
}

function byArea(a: PlaneRecord, b: PlaneRecord): number {
  return areaOf(b.rect) - areaOf(a.rect);
}

/**
 * Whether a line runs along an edge of the rectangle.
 */
function touches(l: Line, r: Rect): boolean {
  const along = l.v ? [r.y, r.y + r.h] : [r.x, r.x + r.w];
  const across = l.v ? [r.x, r.x + r.w] : [r.y, r.y + r.h];
  const onEdge = Math.abs(l.c - across[0]) < 1 || Math.abs(l.c - across[1]) < 1;
  return onEdge && Math.min(l.b, along[1]) - Math.max(l.a, along[0]) > 1;
}

function now(): number {
  const time = document.timeline.currentTime;
  return typeof time === 'number' ? time : performance.now();
}

/**
 * Resolves when every animation has finished. A cancelled animation rejects
 * its promise, and that only means the transition was replaced.
 */
async function done(animations: Animation[]): Promise<void> {
  const finished: Promise<Animation>[] = [];
  for (const animation of animations) {
    finished.push(animation.finished);
  }
  try {
    await Promise.all(finished);
  } catch {
    // Replaced by a rebound or a redraw.
  }
}

export default function createStage(root: HTMLElement, options: StageOptions): () => void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(hover: none)').matches;

  const planeLayer = document.createElement('div');
  planeLayer.className = 'stage-planes';
  const lineLayer = document.createElement('div');
  lineLayer.className = 'stage-lines';
  const badge = document.createElement('div');
  badge.className = 'stage-badge';
  badge.textContent = 'slow motion · 4× slower';
  root.append(planeLayer, lineLayer, badge);

  let view = viewOf(window.innerWidth, window.innerHeight);
  let home: Layout = { planes: [], lines: [] };
  let slowdown = BASE_SLOWDOWN;
  let mode: 'home' | 'family' | 'busy' = 'home';
  let currentFamily: string | undefined;
  /**
   * Bumped by every transition, so a settling promise from an older one
   * knows it has been overtaken.
   */
  let token = 0;
  const planes = new Map<string, PlaneRecord>();
  const lines = new Map<string, LineRecord>();
  /**
   * The transition in flight. Every drill-in and back keeps its own
   * animations plus how to land on either end, so it can be reversed from
   * any point instead of being stacked on.
   */
  let active: Transition | undefined;

  // ------------------------------------------------------------- drawing --

  function lineTransform(
    l: Line,
    {
      k = 1,
      from = 'start',
      thick = 1,
    }: { k?: number; from?: 'start' | 'end'; thick?: number } = {},
  ): string {
    const t = view.thickness;
    const length = Math.max((l.b - l.a + t) * k, 0.0001);
    const width = t * thick;
    const head = from === 'start' ? l.a - t / 2 : l.b + t / 2 - length;
    return l.v
      ? `translate(${l.c - width / 2}px, ${head}px) scale(${width}, ${length})`
      : `translate(${head}px, ${l.c - width / 2}px) scale(${length}, ${width})`;
  }

  function labelAt(rect: Rect): string {
    const pad = padFor(rect, view.thickness);
    return `translate(${rect.x + pad}px, ${rect.y + pad}px)`;
  }

  function place(entry: PlaneRecord, rect: Rect): void {
    const t = view.thickness;
    entry.rect = rect;
    entry.el.style.clipPath = clipFor(view, rect);
    entry.label.style.transform = labelAt(rect);
    Object.assign(entry.frame.style, {
      left: `${rect.x + t / 2}px`,
      top: `${rect.y + t / 2}px`,
      width: `${Math.max(0, rect.w - t)}px`,
      height: `${Math.max(0, rect.h - t)}px`,
    });
  }

  function labelContext(): LabelContext {
    return { thickness: view.thickness, totals: options.totals, note: options.note, touch };
  }

  function makePlane(plane: Plane): PlaneRecord {
    const { content } = plane;
    let el: HTMLElement;
    if (content.kind === 'repo' || content.kind === 'more') {
      const anchor = document.createElement('a');
      anchor.href =
        content.kind === 'repo'
          ? content.repo.html_url
          : 'https://github.com/lxsmnsyc?tab=repositories';
      anchor.target = '_blank';
      anchor.rel = 'noreferrer';
      anchor.draggable = false;
      anchor.setAttribute(
        'aria-label',
        content.kind === 'repo'
          ? `${content.repo.owner ? `${content.repo.owner}/` : ''}${content.repo.name}${content.repo.description ? `: ${content.repo.description}` : ''}`
          : `${content.count} more repositories on GitHub`,
      );
      el = anchor;
    } else {
      el = document.createElement('div');
    }
    el.className = `plane ${plane.color}`;
    el.classList.toggle('alt', plane.alt);
    if (content.kind === 'family') {
      el.classList.add('hoverable');
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      el.setAttribute('aria-label', `Open ${content.family.name}`);
    } else if (content.kind === 'repo' || content.kind === 'more') {
      el.classList.add('hoverable');
    }

    const frame = document.createElement('div');
    frame.className = 'frame';
    const label = document.createElement('div');
    label.className = 'label';
    label.style.width = `${Math.max(0, plane.rect.w - padFor(plane.rect, view.thickness) * 2)}px`;
    label.style.clipPath = LABEL_SHOWN;
    const dispose = createRoot((release) => {
      insert(label, renderLabel(plane, labelContext()));
      return release;
    });
    el.append(frame, label);
    planeLayer.append(el);

    const entry: PlaneRecord = { el, label, frame, plane, rect: plane.rect, dispose };
    el.addEventListener('click', (event) => {
      onPlaneClick(entry, event);
    });
    el.addEventListener('keydown', (event) => {
      if (content.kind === 'family' && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onPlaneClick(entry, event);
      }
    });
    place(entry, plane.rect);
    fitLabel(label, plane.rect, view.thickness);
    planes.set(plane.id, entry);
    return entry;
  }

  function makeLine(line: Line): LineRecord {
    const el = document.createElement('div');
    el.className = 'line';
    el.style.transform = lineTransform(line);
    lineLayer.append(el);
    const entry: LineRecord = { el, line };
    lines.set(line.id, entry);
    return entry;
  }

  function setMode(next: typeof mode): void {
    mode = next;
    root.classList.toggle('busy', next === 'busy');
  }

  function clear(): void {
    for (const animation of root.getAnimations({ subtree: true })) {
      animation.cancel();
    }
    active = undefined;
    for (const entry of planes.values()) {
      entry.dispose();
    }
    planeLayer.replaceChildren();
    lineLayer.replaceChildren();
    planes.clear();
    lines.clear();
  }

  // ----------------------------------------------------------- animation --

  /**
   * While a transition is being built, every animation it starts is recorded
   * here, so the whole choreography can be replayed mirrored.
   */
  let recording: Spec[] | undefined;

  function play(
    el: HTMLElement,
    keyframes: Keyframe[],
    {
      duration,
      delay = 0,
      easing = EASE_LINE,
      fill = 'backwards',
    }: { duration: number; delay?: number; easing?: string; fill?: FillMode },
  ): Animation {
    const timing: Timing = {
      duration: reduceMotion ? 1 : duration * slowdown,
      delay: delay * slowdown,
      easing,
      fill,
    };
    recording?.push({ el, keyframes, timing });
    return el.animate(keyframes, timing);
  }

  /**
   * Snaps the intro to its end state, so clicking a plane while it is still
   * being drawn starts the drill-in from a settled composition.
   */
  function finishAll(): void {
    for (const animation of root.getAnimations({ subtree: true })) {
      if (!(animation instanceof CSSTransition)) {
        animation.finish();
      }
    }
  }

  function wipeIn(entry: PlaneRecord, delay: number, duration: number): Animation {
    const side = wipeSide(view, entry.rect);
    return play(
      entry.el,
      [
        { clipPath: clipFor(view, collapsed(entry.rect, side)) },
        { clipPath: clipFor(view, entry.rect) },
      ],
      { duration, delay, easing: EASE_PAINT },
    );
  }

  function drain(entry: PlaneRecord, delay: number, duration: number): Animation {
    const empty = clipFor(view, collapsed(entry.rect, wipeSide(view, entry.rect)));
    entry.el.style.clipPath = empty;
    return play(entry.el, [{ clipPath: clipFor(view, entry.rect) }, { clipPath: empty }], {
      duration,
      delay,
      easing: EASE_PAINT,
    });
  }

  function revealLabel(entry: PlaneRecord, delay: number, duration: number): Animation {
    entry.label.style.clipPath = LABEL_SHOWN;
    return play(entry.label, [{ clipPath: LABEL_HIDDEN }, { clipPath: LABEL_SHOWN }], {
      duration,
      delay,
    });
  }

  function hideLabel(entry: PlaneRecord, delay: number, duration: number): Animation {
    entry.label.style.clipPath = LABEL_HIDDEN;
    return play(entry.label, [{ clipPath: LABEL_SHOWN }, { clipPath: LABEL_HIDDEN }], {
      duration,
      delay,
      easing: EASE_PAINT,
    });
  }

  function grow(entry: LineRecord, delay: number, duration: number): Animation {
    const from = growFrom(view, entry.line);
    entry.el.style.transform = lineTransform(entry.line);
    return play(
      entry.el,
      [
        { transform: lineTransform(entry.line, { k: 0, from }) },
        { transform: lineTransform(entry.line) },
      ],
      { duration, delay },
    );
  }

  function retract(entry: LineRecord, delay: number, duration: number): Animation {
    const gone = lineTransform(entry.line, { k: 0, from: growFrom(view, entry.line) });
    entry.el.style.transform = gone;
    return play(entry.el, [{ transform: lineTransform(entry.line) }, { transform: gone }], {
      duration,
      delay,
      easing: EASE_PAINT,
    });
  }

  /**
   * The weight of a ruler landing: a brief thickening, then rest.
   */
  function thud(entry: LineRecord, delay: number, amount = 1.35): Animation {
    const rest = lineTransform(entry.line);
    return play(
      entry.el,
      [
        { transform: rest },
        { transform: lineTransform(entry.line, { thick: amount }), offset: 0.3 },
        { transform: rest },
      ],
      { duration: 200, delay, easing: 'ease-out', fill: 'none' },
    );
  }

  /**
   * Moves a plane and its label to a new rectangle.
   */
  function move(entry: PlaneRecord, rect: Rect, delay: number, duration: number): Animation[] {
    const from = entry.rect;
    place(entry, rect);
    return [
      play(entry.el, [{ clipPath: clipFor(view, from) }, { clipPath: clipFor(view, rect) }], {
        duration,
        delay,
      }),
      play(entry.label, [{ transform: labelAt(from) }, { transform: labelAt(rect) }], {
        duration,
        delay,
      }),
    ];
  }

  function slide(entry: LineRecord, line: Line, delay: number, duration: number): Animation {
    const from = entry.line;
    entry.line = line;
    entry.el.style.transform = lineTransform(line);
    return play(
      entry.el,
      [{ transform: lineTransform(from) }, { transform: lineTransform(line) }],
      {
        duration,
        delay,
      },
    );
  }

  // --------------------------------------------------------- transitions --

  function beginRecording(): void {
    recording = [];
  }

  /**
   * Starts a transition from the animations recorded since beginRecording().
   */
  function start(
    kind: Transition['kind'],
    animations: Animation[],
    commit: () => void,
    revert: () => void,
  ): void {
    const specs = recording ?? [];
    recording = undefined;
    let end = 0;
    for (const { timing } of specs) {
      end = Math.max(end, timing.delay + timing.duration);
    }
    const transition: Transition = {
      kind,
      specs,
      animations,
      direction: 1,
      end,
      clock: { t0: now(), from: 0, rate: 1 },
      commit,
      revert,
    };
    active = transition;
    settle(transition);
  }

  /**
   * Where the transition is on its forward timeline, in milliseconds.
   */
  function position(transition: Transition): number {
    const { t0, from, rate } = transition.clock;
    return clamp(from + (now() - t0) * rate, 0, transition.end);
  }

  function settle(transition: Transition): void {
    token += 1;
    const current = token;
    done(transition.animations)
      .then(() => {
        if (token !== current) {
          return;
        }
        active = undefined;
        if (transition.direction === 1) {
          transition.commit();
        } else {
          transition.revert();
        }
        for (const animation of transition.animations) {
          animation.cancel();
        }
      })
      // A throw while landing would otherwise vanish with the promise.
      .catch(reportError);
  }

  /**
   * Rubber band: a click mid-flight sends the transition back the way it
   * came, from wherever it is, at exit speed. Another click sends it forward
   * again.
   *
   * The running animations are replaced, not given a negative playback rate:
   * Chrome runs clip-path animations on the compositor, and a reversed one
   * there paints its first frame until it ends, so the planes would appear
   * to snap home. Each replacement plays forwards with `direction: 'reverse'`
   * on the mirrored timeline, where an animation that ran over
   * [delay, delay + duration] runs over [end - delay - duration, end - delay].
   */
  function rebound(): void {
    const transition = active;
    if (!transition) {
      return;
    }
    const at = position(transition);
    transition.direction = transition.direction === 1 ? -1 : 1;
    const forward = transition.direction === 1;
    const speed = forward ? 1 : 1 / EXIT;
    const previous = transition.animations;
    const next: Animation[] = [];
    for (const { el, keyframes, timing } of transition.specs) {
      // Fill both ways so an animation that is done holds its end state
      // until the whole transition lands, whichever way it is going.
      const fill = timing.fill === 'none' ? 'none' : 'both';
      const animation = forward
        ? el.animate(keyframes, { ...timing, fill })
        : el.animate(keyframes, {
            ...timing,
            fill,
            direction: 'reverse',
            delay: transition.end - timing.delay - timing.duration,
          });
      animation.currentTime = forward ? at : transition.end - at;
      animation.playbackRate = speed;
      next.push(animation);
    }
    for (const animation of previous) {
      animation.cancel();
    }
    transition.animations = next;
    transition.clock = { t0: now(), from: at, rate: forward ? 1 : -speed };
    settle(transition);
  }

  /**
   * Whether the transition in flight ends inside a family.
   */
  function headingIn(): boolean {
    return active !== undefined && (active.kind === 'drill') === (active.direction === 1);
  }

  /**
   * Every plane's rectangle and label state, and every line, right now.
   */
  function save(): Saved {
    const saved: Saved = { planes: new Map(), lines: new Map() };
    for (const [id, entry] of planes) {
      saved.planes.set(id, { rect: entry.rect, label: entry.label.style.clipPath });
    }
    for (const [id, entry] of lines) {
      saved.lines.set(id, entry.line);
    }
    return saved;
  }

  function restore(saved: Saved): void {
    for (const [id, state] of saved.planes) {
      const entry = planes.get(id);
      if (entry) {
        place(entry, state.rect);
        entry.label.style.clipPath = state.label;
      }
    }
    for (const [id, line] of saved.lines) {
      const entry = lines.get(id);
      if (entry) {
        entry.line = line;
        entry.el.style.transform = lineTransform(line);
      }
    }
  }

  function discard(planeRecords: PlaneRecord[], lineRecords: LineRecord[]): void {
    for (const entry of planeRecords) {
      entry.dispose();
      entry.el.remove();
      planes.delete(entry.plane.id);
    }
    for (const entry of lineRecords) {
      entry.el.remove();
      lines.delete(entry.line.id);
    }
  }

  /**
   * Paints new planes: the whites quietly first, then the colours smallest
   * first, so red, the loudest, lands last. Returns when the paint is done.
   */
  function paint(
    records: PlaneRecord[],
    animations: Animation[],
    timing: {
      whitesAt: number;
      whiteStagger: number;
      whiteDuration: number;
      coloursAt: number;
      colourStagger: number;
      colourDuration: number;
    },
  ): number {
    const { whitesAt, whiteStagger, whiteDuration, coloursAt, colourStagger, colourDuration } =
      timing;
    const coloured: PlaneRecord[] = [];
    let whiteIndex = 0;
    for (const entry of records) {
      if (entry.plane.color === 'white') {
        animations.push(wipeIn(entry, whitesAt + whiteIndex * whiteStagger, whiteDuration));
        whiteIndex += 1;
      } else {
        coloured.push(entry);
      }
    }
    coloured.sort((a, b) => areaOf(a.rect) - areaOf(b.rect));
    for (const [index, entry] of coloured.entries()) {
      animations.push(wipeIn(entry, coloursAt + index * colourStagger, colourDuration));
    }
    return coloursAt + Math.max(0, coloured.length - 1) * colourStagger + colourDuration;
  }

  // -------------------------------------------------------- choreography --

  function intro(): void {
    token += 1;
    clear();
    setMode('home');
    currentFamily = undefined;
    view = viewOf(window.innerWidth, window.innerHeight);
    home = composeHome(view, options.families);

    const animations: Animation[] = [];
    const LINE = 440;
    const STAGGER = 60;
    const ordered = [...home.lines].sort(byDrawingOrder);
    for (const [index, line] of ordered.entries()) {
      const entry = makeLine(line);
      const delay = 80 + index * STAGGER;
      animations.push(grow(entry, delay, LINE));
      if (line.depth <= 1) {
        animations.push(thud(entry, delay + LINE));
      }
    }
    const linesEnd = 80 + Math.max(0, ordered.length - 1) * STAGGER + LINE;

    const records: PlaneRecord[] = [];
    for (const plane of home.planes) {
      records.push(makePlane(plane));
    }
    const paintEnd = paint(records, animations, {
      whitesAt: linesEnd - 260,
      whiteStagger: 35,
      whiteDuration: 320,
      coloursAt: linesEnd - 120,
      colourStagger: 100,
      colourDuration: 400,
    });

    records.sort(byArea);
    let index = 0;
    for (const entry of records) {
      if (entry.plane.content.kind === 'identity') {
        animations.push(revealLabel(entry, paintEnd - 300, 460));
      } else {
        animations.push(revealLabel(entry, paintEnd - 120 + index * 50, 280));
        index += 1;
      }
    }
  }

  function drill(familyId: string): void {
    const focus = planes.get(familyId);
    const state = composeFamily(home, view, familyId);
    if (!focus || !state) {
      return;
    }
    finishAll();
    setMode('busy');
    const saved = save();
    beginRecording();
    const animations: Animation[] = [];

    // Push: the focused plane's lines tense up, then slide outward and
    // squeeze the rest of the composition into strips.
    const P0 = 140;
    const PUSH = 480;
    for (const plane of state.outer.planes) {
      const entry = planes.get(plane.id);
      if (entry) {
        animations.push(...move(entry, plane.rect, P0, PUSH));
        animations.push(hideLabel(entry, P0 - 60, 220));
      }
    }
    let focusRect = focus.rect;
    for (const plane of state.outer.planes) {
      if (plane.id === familyId) {
        focusRect = plane.rect;
      }
    }
    const tense: LineRecord[] = [];
    const landed: LineRecord[] = [];
    for (const line of state.outer.lines) {
      const entry = lines.get(line.id);
      if (!entry) {
        continue;
      }
      if (touches(entry.line, focus.plane.rect)) {
        tense.push(entry);
      }
      if (touches(line, focusRect)) {
        landed.push(entry);
      }
      const from = entry.line;
      animations.push(slide(entry, line, P0, PUSH));
      if (tense.includes(entry)) {
        // Created after the slide, so it wins while it runs.
        const rest = lineTransform(from);
        animations.push(
          play(
            entry.el,
            [
              { transform: rest },
              { transform: lineTransform(from, { thick: 1.6 }), offset: 0.55 },
              { transform: rest },
            ],
            { duration: P0, easing: 'ease-in-out', fill: 'none' },
          ),
        );
      }
    }
    for (const entry of landed) {
      animations.push(thud(entry, P0 + PUSH, 1.3));
    }

    // Subdivide: the same drawing order as the intro, one scale down.
    const C0 = P0 + PUSH - 40;
    const LINE = 400;
    const STAGGER = 55;
    const created: LineRecord[] = [];
    for (const [index, line] of [...state.inner.lines].sort(byDrawingOrder).entries()) {
      const entry = makeLine(line);
      created.push(entry);
      animations.push(grow(entry, C0 + index * STAGGER, LINE));
    }
    const linesEnd = C0 + Math.max(0, created.length - 1) * STAGGER + LINE;

    const records: PlaneRecord[] = [];
    for (const plane of state.inner.planes) {
      records.push(makePlane(plane));
    }
    const paintEnd = paint(records, animations, {
      whitesAt: C0 + 120,
      whiteStagger: 25,
      whiteDuration: 300,
      coloursAt: linesEnd - 140,
      colourStagger: 90,
      colourDuration: 380,
    });

    // The family's title is read first, then the tiles by size.
    const order = [...records].sort(
      (a, b) =>
        Number(b.plane.content.kind === 'title') - Number(a.plane.content.kind === 'title') ||
        byArea(a, b),
    );
    for (const [index, entry] of order.entries()) {
      animations.push(revealLabel(entry, paintEnd - 260 + index * 40, 280));
    }

    start(
      'drill',
      animations,
      () => {
        setMode('family');
        currentFamily = familyId;
      },
      () => {
        discard(records, created);
        restore(saved);
        setMode('home');
        currentFamily = undefined;
      },
    );
  }

  /**
   * Zooms out. `next` runs once home is reached, for a sideways move.
   */
  function back(next?: () => void): void {
    const family = currentFamily;
    if (!family) {
      return;
    }
    finishAll();
    setMode('busy');
    const saved = save();
    beginRecording();
    const animations: Animation[] = [];
    const prefix = `C:${family.slice(2)}:`;

    const children: PlaneRecord[] = [];
    for (const entry of planes.values()) {
      const { kind } = entry.plane.content;
      if (kind === 'repo' || kind === 'more' || kind === 'title') {
        children.push(entry);
      }
    }
    const childLines: LineRecord[] = [];
    for (const entry of lines.values()) {
      if (entry.line.id.startsWith(prefix)) {
        childLines.push(entry);
      }
    }

    for (const [index, entry] of children.entries()) {
      animations.push(hideLabel(entry, index * 12, 180 * EXIT));
    }
    children.sort(byArea);
    for (const [index, entry] of children.entries()) {
      animations.push(drain(entry, 90 + index * 18, 280 * EXIT));
    }
    const drainEnd = 90 + Math.max(0, children.length - 1) * 18 + 280 * EXIT;

    // Shortest lines leave first: the drawing order run backwards.
    childLines.sort((a, b) => byDrawingOrder(b.line, a.line));
    for (const [index, entry] of childLines.entries()) {
      animations.push(retract(entry, drainEnd - 120 + index * 30, 320 * EXIT));
    }
    const retractEnd = drainEnd - 120 + Math.max(0, childLines.length - 1) * 30 + 320 * EXIT;

    const U0 = retractEnd - 60;
    const UNWARP = 480 * EXIT;
    const restored: PlaneRecord[] = [];
    for (const plane of home.planes) {
      const entry = planes.get(plane.id);
      if (entry) {
        animations.push(...move(entry, plane.rect, U0, UNWARP));
        restored.push(entry);
      }
    }
    for (const line of home.lines) {
      const entry = lines.get(line.id);
      if (entry) {
        animations.push(slide(entry, line, U0, UNWARP));
      }
    }
    restored.sort(byArea);
    for (const [index, entry] of restored.entries()) {
      animations.push(revealLabel(entry, U0 + UNWARP - 80 + index * 30, 240));
    }

    start(
      'back',
      animations,
      () => {
        discard(children, childLines);
        setMode('home');
        currentFamily = undefined;
        next?.();
      },
      () => {
        restore(saved);
        setMode('family');
        currentFamily = family;
      },
    );
  }

  function onPlaneClick(entry: PlaneRecord, event: Event): void {
    if (event.target instanceof Element && event.target.closest('.links a')) {
      return;
    }
    const { content, id } = entry.plane;
    // Any click while the canvas moves reverses the move rather than
    // starting a second one on top of it.
    if (mode === 'busy') {
      event.preventDefault();
      rebound();
      return;
    }
    if (content.kind === 'repo' || content.kind === 'more') {
      return;
    }
    if (mode === 'home') {
      if (content.kind === 'family') {
        drill(id);
      }
      return;
    }
    if (content.kind === 'family' && id !== currentFamily) {
      back(() => {
        drill(id);
      });
    } else {
      back();
    }
  }

  // -------------------------------------------------------------- wiring --

  function onKeyDown(event: KeyboardEvent): void {
    // Leaves browser shortcuts such as Cmd+R alone, and typing in a field.
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      (event.target instanceof HTMLElement && event.target.isContentEditable) ||
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    if (event.key === 'Escape') {
      if (mode === 'family') {
        back();
      } else if (headingIn()) {
        rebound();
      }
    } else if (event.key === 'r' || event.key === 'R') {
      intro();
    } else if (event.key === 's' || event.key === 'S') {
      slowdown = slowdown === BASE_SLOWDOWN ? BASE_SLOWDOWN * 4 : BASE_SLOWDOWN;
      badge.classList.toggle('on', slowdown !== BASE_SLOWDOWN);
    }
  }

  /**
   * A resize redraws the current view at once. Animating it would lag.
   */
  function redraw(): void {
    const family = currentFamily;
    token += 1;
    clear();
    view = viewOf(window.innerWidth, window.innerHeight);
    home = composeHome(view, options.families);
    const state = family ? composeFamily(home, view, family) : undefined;
    if (family && state) {
      for (const plane of state.outer.planes) {
        makePlane(plane).label.style.clipPath = LABEL_HIDDEN;
      }
      for (const line of state.outer.lines) {
        makeLine(line);
      }
      for (const line of state.inner.lines) {
        makeLine(line);
      }
      for (const plane of state.inner.planes) {
        makePlane(plane);
      }
      setMode('family');
      currentFamily = family;
    } else {
      for (const plane of home.planes) {
        makePlane(plane);
      }
      for (const line of home.lines) {
        makeLine(line);
      }
      setMode('home');
      currentFamily = undefined;
    }
  }

  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  function onResize(): void {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(redraw, 150);
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onResize);
  intro();

  return () => {
    clearTimeout(resizeTimer);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', onResize);
    token += 1;
    clear();
    root.replaceChildren();
  };
}
