import type { JSX } from 'solid-js';
import { Show, createResource, onCleanup, onMount } from 'solid-js';

import type { Dataset } from './data';
import getData from './data';
import { buildFamilies, totalsOf } from './mondrian/model';
import createStage from './mondrian/stage';

function Stage(props: { dataset: Dataset }): JSX.Element {
  let root!: HTMLDivElement;

  onMount(() => {
    const { repos, upstream, source } = props.dataset;
    const dispose = createStage(root, {
      families: buildFamilies(repos, upstream),
      totals: totalsOf(repos),
      // Says so when the wall is not coming straight from GitHub.
      note: source === 'live' ? undefined : `from ${source}`,
    });
    onCleanup(dispose);
  });

  return <main ref={root} class="stage" />;
}

export default function App(): JSX.Element {
  const [dataset] = createResource(getData);

  return (
    <Show
      when={dataset.state === 'ready' && dataset()}
      fallback={
        <div class="loader">
          {dataset.error === undefined
            ? 'drawing the lines…'
            : 'GitHub is not answering right now.'}
        </div>
      }
    >
      {(data) => <Stage dataset={data()} />}
    </Show>
  );
}
