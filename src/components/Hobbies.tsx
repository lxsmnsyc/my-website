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
import { useConstantCallback } from '@lyonph/react-hooks';
import stringLerp from '../utils/string-lerp';
import constant from '../hoc/constant';

const HOBBIES = [
  ' do back-end web development.',
  ' do front-end web development.',
  ' use Firebase.',
  ' use ReasonML.',
  ' use NextJS.',
  ' use ReactJS.',
  ' use Crystal.',
  ' use TypeScript.',
  ' use Rust.',
  ' use Lua.',
  ' make open-source libraries.',
  ' like learning new stuffs!',
  ' like functional programming.',
  ' like esoteric programming languages.',
  ' like procedural generation.',
  ' like watching anime.',
  ' love dogs!',
  '\'m an introvert.',
  '\'m the VP of R&D and SE in Lyon.com.ph.',
];

const COOLDOWN = 5.0;
const DURATION = 1.0;

const Hobbies = constant(() => {
  const ref = useRef<HTMLHeadingElement | null>(null);

  const baseList = useRef([...HOBBIES]);

  const nextItem = useConstantCallback(() => {
    // Check if there are no more items
    if (baseList.current.length === 0) {
      // Regenerate list;
      baseList.current = Array.from(HOBBIES);
    }
    // Pick an item
    const pickedIndex = Math.floor(baseList.current.length * Math.random());
    const pickedItem = baseList.current[pickedIndex];

    // Remove that item from the list
    baseList.current.splice(pickedIndex);

    return pickedItem;
  });

  const [name, setName] = useState(nextItem);

  useEffect(() => {
    const title = ref.current;

    if (title) {
      let raf: number;

      let start = 0;
      let timer = 0;

      let base = name;
      let target: string | undefined;

      const onUpdate: FrameRequestCallback = (timestamp) => {
        if (!start) {
          start = timestamp;
        }
        const elapsed = (timestamp - start) / 1000;
        start = timestamp;

        if (target) {
          if (timer > 0) {
            timer -= elapsed;
            setName(stringLerp(target, base, timer / DURATION, false));
          } else {
            timer = DURATION;
            base = target;
            target = undefined;
          }
        }

        raf = requestAnimationFrame(onUpdate);
      };

      raf = requestAnimationFrame(onUpdate);

      const interval = setInterval(() => {
        target = nextItem();
      }, COOLDOWN * 1000);

      return () => {
        cancelAnimationFrame(raf);
        clearInterval(interval);
      };
    }

    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <p className="m-4 text-3xl font-sans" ref={ref}>
      {`I${name}`}
    </p>
  );
});

export default Hobbies;
