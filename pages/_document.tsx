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
// ANCHOR React
import React from 'react';

// ANCHOR Next
import Document, {
  DocumentContext, Head, Html, Main, NextScript,
} from 'next/document';

// ANCHOR Styletron
import { Client, Sheet } from 'styletron-engine-atomic';

// ANCHOR Utils
import { styletron } from '../utils/styletron';

function getStylesheets(): Sheet[] {
  if (styletron instanceof Client) {
    return [];
  }
  return styletron.getStylesheets();
}

interface CustomDocumentProps extends DocumentContext {
  stylesheets?: Sheet[];
}

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID ?? '';

export default class CustomDocument extends Document<CustomDocumentProps> {
  public static async getInitialProps(ctx: CustomDocumentProps) {
    const initialProps = await Document.getInitialProps(ctx);
    const stylesheets = getStylesheets() || [];
    return { stylesheets, ...initialProps };
  }

  public render(): JSX.Element {
    const { stylesheets } = this.props;
    return (
      <Html lang="en">
        <Head>
          {
            stylesheets && stylesheets.map((sheet: Sheet) => (
              <style
                className="_styletron_hydrate_"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: sheet.css }}
                media={sheet.attrs.media}
                data-hydrate={sheet.attrs['data-hydrate']}
              />
            ))
          }
          {/* Global Site Tag (gtag.js) - Google Analytics */}
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          />
          <script
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_TRACKING_ID}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
