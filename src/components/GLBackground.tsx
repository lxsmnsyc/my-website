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
import React, { memo, useEffect, useRef, useState } from 'react';
import { useSmoothCursor } from '../models/SmoothCursor';

/**
* Default vertex shader
*/
const VERTEX = 'attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0, 1); }';

interface Resolution {
  width: number;
  height: number;
}

/**
 * Calculates the screen resolution
 * @param scale
 */
function getResolution(scale: number): Resolution {
  if (typeof document === 'undefined') {
    return {
      width: 0,
      height: 0,
    };
  }
  const element = document.documentElement;
  return {
    width: Math.max(element.clientWidth, window.innerWidth || 0) * scale,
    height: Math.max(element.clientHeight, window.innerHeight || 0) * scale,
  };
}

function protect<T>(promise: Promise<T>, checkMount: () => boolean): Promise<T> {
  return new Promise<T>((res, rej) => {
    promise.then(
      (value) => checkMount() && res(value),
      (value) => checkMount() && rej(value),
    );
  });
}

type Promisify = <T>(deferred: () => T) => Promise<T>;

function deferWrapper(checkMount: () => boolean): Promisify {
  return (deferred) => protect(Promise.resolve().then(deferred), checkMount);
}

async function loadShader(
  context: WebGLRenderingContext,
  type: number,
  source: string,
  promisify: Promisify,
) {
  const shader = await promisify(() => context.createShader(type));

  if (!shader) {
    return null;
  }

  // Send the source to the shader object

  await promisify(() => context.shaderSource(shader, source));

  // Compile the shader program

  await promisify(() => context.compileShader(shader));

  // See if it compiled successfully

  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    // alert('An error occurred compiling the shaders: ' + context.getShaderInfoLog(shader));
    context.deleteShader(shader);
    return null;
  }

  return shader;
}

async function initShaderProgram(
  renderContext: WebGLRenderingContext,
  fragment: string,
  promisify: Promisify,
) {
  const vertexShader = await loadShader(
    renderContext,
    renderContext.VERTEX_SHADER,
    VERTEX,
    promisify,
  );
  const fragmentShader = await loadShader(
    renderContext,
    renderContext.FRAGMENT_SHADER,
    fragment,
    promisify,
  );

  // Create the shader program
  const shaderProgram = await promisify(() => renderContext.createProgram());
  if (shaderProgram && vertexShader && fragmentShader) {
    await promisify(() => renderContext.attachShader(shaderProgram, vertexShader));
    await promisify(() => renderContext.attachShader(shaderProgram, fragmentShader));
    await promisify(() => renderContext.linkProgram(shaderProgram));

    // If creating the shader program failed, alert
    if (!renderContext.getProgramParameter(shaderProgram, renderContext.LINK_STATUS)) {
      // alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return null;
    }

    return shaderProgram;
  }

  return null;
}

export interface GLBackgroundProps {
  scale: number;
  fragment: string;
}

const GLBackground = memo(({ scale, fragment }: GLBackgroundProps) => {
  const [getX, getY] = useSmoothCursor();
  const [loading, setLoading] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    let {
      width: currentWidth,
      height: currentHeight,
    } = getResolution(scale);

    const gl = canvas.getContext('webgl');

    if (!gl) {
      return undefined;
    }

    let mounted = true;
    let updateReso: undefined | (() => void);

    let raf = 0;

    const promisedProgram = initShaderProgram(gl, fragment, deferWrapper(() => mounted));

    promisedProgram
      .then((program) => {
        if (!program) {
          return;
        }

        const ploc = gl.getAttribLocation(program, 'a_position');

        const pbuff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pbuff);

        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0]),
          gl.STATIC_DRAW,
        );

        const uTime = gl.getUniformLocation(program, 'time');
        const uMouse = gl.getUniformLocation(program, 'mouse');
        const uRes = gl.getUniformLocation(program, 'resolution');
        const uORes = gl.getUniformLocation(program, 'oreso');

        let time = 0.0;
        let stamp = 0.0;

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        const render = () => {
          gl.clearColor(0.0, 0.0, 0.0, 1.0);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.useProgram(program);

          gl.bindBuffer(gl.ARRAY_BUFFER, pbuff);
          gl.enableVertexAttribArray(ploc);
          gl.vertexAttribPointer(ploc, 2, gl.FLOAT, false, 0, 0);
          gl.uniform1f(uTime, time);
          gl.uniform2f(uMouse, getX(), getY());
          gl.uniform2f(uRes, currentWidth, currentHeight);
          gl.uniform2f(uORes, currentWidth / scale, currentHeight / scale);

          gl.drawArrays(gl.TRIANGLES, 0, 6);
        };

        updateReso = () => {
          const currentResolution = getResolution(scale);

          canvas.width = currentResolution.width;
          canvas.height = currentResolution.height;

          currentWidth = currentResolution.width;
          currentHeight = currentResolution.height;

          gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        };

        window.addEventListener('resize', updateReso);

        let start = 0;

        const update: FrameRequestCallback = (ev) => {
          if (!start) start = ev;
          stamp = ev - start;
          time = stamp / 1000.0;
          render();
          raf = requestAnimationFrame(update);
        };

        setLoading(false);
        raf = requestAnimationFrame(update);
      })
      .catch(() => {
        // handle error
      });

    return () => {
      if (updateReso) {
        window.removeEventListener('resize', updateReso);
      }
      cancelAnimationFrame(raf);
      mounted = false;
    };
  }, [scale, fragment]);

  const { width, height } = getResolution(scale);

  return (
    <div className="w-full h-full">
      <canvas
        className={`w-full h-full transition-opacity duration-1000 ${loading ? 'opacity-0' : 'opacity-100'}`}
        ref={canvasRef}
        width={width}
        height={height}
      />
    </div>
  );
});

export default GLBackground;
