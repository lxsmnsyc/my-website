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
import React, { useEffect, useRef, useState } from 'react';
import constant from '../hoc/constant';
import stringLerp from '../utils/string-lerp';

const BASE_NAME = 'Alexis H. Munsayac';
const SECRET_NAME = '@lxsmnsyc';

const DURATION = 1.0;

const Greetings = constant(() => {
  const ref = useRef<HTMLHeadingElement | null>(null);

  const [name, setName] = useState(BASE_NAME);

  useEffect(() => {
    const title = ref.current;

    if (title) {
      let raf: number;

      let start = 0;

      let timer = 0;
      let inside = false;

      const onUpdate: FrameRequestCallback = (timestamp) => {
        if (!start) {
          start = timestamp;
        }
        const elapsed = (timestamp - start) / 1000;
        start = timestamp;

        if (!inside) {
          if (timer > 0.0) {
            timer -= elapsed;
            setName(stringLerp(BASE_NAME, SECRET_NAME, timer / DURATION, true));
          }
        } else if (timer < DURATION) {
          timer += elapsed;
          setName(stringLerp(BASE_NAME, SECRET_NAME, timer / DURATION, true));
        }

        raf = requestAnimationFrame(onUpdate);
      };

      raf = requestAnimationFrame(onUpdate);

      const onMouseEnter = () => {
        if (!inside) {
          inside = true;
        }
      };

      const onMouseLeave = () => {
        if (inside) {
          inside = false;
        }
      };

      title.addEventListener('mouseenter', onMouseEnter);
      title.addEventListener('mouseleave', onMouseLeave);

      return () => {
        cancelAnimationFrame(raf);
        title.removeEventListener('mouseenter', onMouseEnter);
        title.removeEventListener('mouseleave', onMouseLeave);
      };
    }

    return undefined;
  }, []);

  return (
    <h1
      className="m-4 text-4xl font-sans font-bold w-full"
      ref={ref}
    >
      {`Hello, I'm ${name}!`}
    </h1>
  );
});

export default Greetings;
