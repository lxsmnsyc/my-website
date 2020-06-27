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
// ANCHOR Next
import { AppProps } from 'next/app';

// ANCHOR React
import React from 'react';

// ANCHOR Styletron
import { Provider as StyletronProvider } from 'styletron-react';

// ANCHOR Utilities
import { debug, styletron } from '../utils/styletron';

// ANCHOR CSS
import 'normalize.css/normalize.css';

interface WebVitalsParam {
  name: string;
  delta: number;
  id: string;
}

export function reportWebVitals({ name, delta, id }: WebVitalsParam) {
  gtag('event', name, {
    event_category: 'Web Vitals',
    // Google Analytics metrics must be integers, so the value is rounded.
    // For CLS the value is first multiplied by 1000 for greater precision
    // (note: increase the multiplier for greater precision if needed).
    value: Math.round(name === 'CLS' ? delta * 1000 : delta),
    // The `id` value will be unique to the current page load. When sending
    // multiple values from the same page (e.g. for CLS), Google Analytics can
    // compute a total by grouping on this ID (note: requires `eventLabel` to
    // be a dimension in your report).
    event_label: id,
    // Use a non-interaction event to avoid affecting bounce rate.
    non_interaction: true,
  });
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <StyletronProvider
      value={styletron}
      debug={debug}
      debugAfterHydration
    >
      <Component {...pageProps} />
    </StyletronProvider>
  );
}
