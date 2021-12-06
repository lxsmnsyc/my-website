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
 * @copyright Alexis Munsayac 2021
 */
import { JSX } from 'solid-js';

interface SmoothCursorContext {
  x: number;
  y: number;
}

const SmoothCursorContext = $createContext<SmoothCursorContext>();

interface SmoothCursorProps {
  children: JSX.Element;
}

export function useSmoothCursor(): SmoothCursorContext {
  const ctx = $useContext(SmoothCursorContext);
  if (ctx) {
    return ctx;
  }
  throw new Error('Missing SmoothCursorContext');
}

export default function SmoothCursor(props: SmoothCursorProps): JSX.Element {
  let xRef = 0;
  let yRef = 0;

  effect: {
    let raf: number;

    let targetX = 0;
    let targetY = 0;

    let prevX = 0;
    let prevY = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    window.addEventListener('mousemove', onMouseMove);

    let start = 0;

    const update: FrameRequestCallback = (timestamp) => {
      if (!start) start = timestamp;
      const dt = (timestamp - start) / 1000.0;
      start = timestamp;

      const dx = targetX - prevX;
      const dy = targetY - prevY;

      prevX += dx * dt;
      prevY += dy * dt;

      xRef = prevX;
      yRef = prevY;

      raf = requestAnimationFrame(update);
    };

    raf = requestAnimationFrame(update);

    cleanup: {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(raf);
    }
  }

  return (
    <SmoothCursorContext.Provider
      value={{
        get x() {
          return xRef;
        },
        get y() {
          return yRef;
        },
      }}
    >
      {props.children}
    </SmoothCursorContext.Provider>
  );
}
