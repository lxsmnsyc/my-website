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
// const TextInnerContainer = styled('div', {
//   width: '75%',

//   display: 'flex',
//   flexDirection: 'column',
//   alignItems: 'flex-start',
//   justifyContent: 'center',

//   marginLeft: '32px',
//   marginRight: '32px',
//   marginTop: '16px',
//   marginBottom: '16px',

//   '@media screen and (orientation: portrait)': {
//     width: '100%',
//   },
// });

import React, { ReactNode } from 'react';

interface TextInnerContainerProps {
  children: ReactNode
}

export default function TextInnerContainer(
  { children }: TextInnerContainerProps,
): JSX.Element {
  const gradients = [
    'preset-gradient-1',
    'preset-gradient-2',
    'preset-gradient-3',
    'preset-gradient-4',
    'preset-gradient-5',
    'preset-gradient-6',
    'preset-gradient-7',
  ];

  const selectedGradient = gradients[Math.floor(Math.random() * gradients.length)];

  return (
    <div className={`m-4 flex flex-col items-start justify-start bg-clip-text text-transparent gradient-text ${selectedGradient}`}>
      {children}
    </div>
  );
}
