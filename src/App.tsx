/**
 * @license
 * MIT License
 *
 * Copyright (c) 2020 Alexis Munsayac
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 *
 * @author Alexis Munsayac <alexis.munsayac@gmail.com>
 * @copyright Alexis Munsayac 2020
 */
import { For, JSX } from 'solid-js';
import DATA from './data';
import SmoothCursor from './models/SmoothCursor';
import classNames from './utils/class-names';

function Github(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path fill-rule="evenodd" clip-rule="evenodd" d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z" />
    </svg>
  );
}

function Codepen(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path
        d="M21.838 8.445c0-.001-.001-.001 0 0l-.003-.004-.001-.001v-.001a.809.809 0 0 0-.235-.228l-9.164-6.08a.834.834 0 0 0-.898 0L2.371 8.214A.786.786 0 0 0 2 8.897v6.16a.789.789 0 0 0 .131.448v.001l.002.002.01.015v.002h.001l.001.001.001.001c.063.088.14.16.226.215l9.165 6.082a.787.787 0 0 0 .448.139.784.784 0 0 0 .45-.139l9.165-6.082a.794.794 0 0 0 .371-.685v-6.16a.793.793 0 0 0-.133-.452zm-9.057-4.172 6.953 4.613-3.183 2.112-3.771-2.536V4.273zm-1.592 0v4.189l-3.771 2.536-3.181-2.111 6.952-4.614zm-7.595 6.098 2.395 1.59-2.395 1.611v-3.201zm7.595 9.311-6.96-4.617 3.195-2.15 3.765 2.498v4.269zm.795-5.653-3.128-2.078 3.128-2.105 3.131 2.105-3.131 2.078zm.797 5.653v-4.27l3.766-2.498 3.193 2.15-6.959 4.618zm7.597-6.11-2.396-1.611 2.396-1.59v3.201z"
      />
    </svg>
  );
}

function Twitter(props: JSX.IntrinsicElements['svg']) {
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

const SOCIAL_LINK = classNames(
  'rounded-full transition duration-150',
  'focus:outline-none focus-visible:ring focus-visible:ring-opacity-75',
  'focus-visible:ring-gray-900',
  'dark:focus-visible:ring-gray-50',
  // Background
  'bg-gray-50 hover:bg-gray-200 active:bg-gray-100',
  'dark:bg-gray-900 dark:hover:bg-gray-700 dark:active:bg-gray-800',
  // Foreground
  'text-gray-900 hover:text-gray-700 active:text-gray-800',
  'dark:text-gray-50 dark:hover:text-gray-200 dark:active:text-gray-100',
);

const URL = classNames(
  'rounded-xl p-2 flex flex-col w-full group',
  'bg-gray-900 hover:bg-gray-700 active:bg-gray-800',
  'dark:bg-gray-50 dark:hover:bg-gray-200 dark:active:bg-gray-100',
);

const URL_CONTAINER = classNames(
  'rounded-lg p-4 flex flex-col space-y-1',
  'text-gray-900 bg-gray-50',
  'hover:text-gray-700 hover:bg-gray-200',
  'active:text-gray-800 active:bg-gray-100',
  'dark:text-gray-50 dark:bg-gray-900',
  'dark:hover:text-gray-200 dark:hover:bg-gray-700',
  'dark:active:text-gray-100 dark:active:bg-gray-800',
);

const URL_TAG = classNames(
  'text-xs font-mono rounded-full px-2 py-1',
  'text-gray-50 bg-gray-900',
  'group-hover:text-gray-200 group-hover:bg-gray-700',
  'dark:text-gray-900 dark:bg-gray-50',
  'dark:group-hover:text-gray-700 dark:group-hover:bg-gray-200',
);

export default function Index(): JSX.Element {
  return (
    <SmoothCursor>
      <div class="w-full min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center">
        <main class="flex flex-col items-center space-y space-y-4 m-8">
          <h1 class="text-4xl md:text-8xl text-gray-900 dark:text-gray-50 font-bold font-mono">@lxsmnsyc</h1>
          <div class="flex items-center space-x-2">
            <For each={SOCIAL}>
              {(item) => (
                <a
                  href={item.url}
                  title={item.title}
                  class={SOCIAL_LINK}
                >
                  <span class="sr-only">{item.title}</span>
                  <item.icon class="w-16 h-16 p-2" />
                </a>
              )}
            </For>
          </div>
          <div class="flex flex-col space-y-2 items-center w-full">
            <For each={DATA}>
              {(item) => (
                <a
                  href={item.url}
                  title={`${item.title} - ${item.description}`}
                  class={URL}
                >
                  <div class={URL_CONTAINER}>
                    <span class="text-xl font-mono font-semibold">{item.title}</span>
                    <p>{item.description}</p>
                    <div class="flex flex-wrap gap-1">
                      <For each={item.tags}>
                        {(tag) => <span class={URL_TAG}>{tag}</span>}
                      </For>
                    </div>
                  </div>
                </a>
              )}
            </For>
          </div>
        </main>
      </div>
    </SmoothCursor>
  );
}
