/* eslint-disable no-bitwise */
/* eslint-disable react/prop-types */
import React, { useRef, useLayoutEffect } from 'react';
import { getX, getY } from './Cursor';

import '../css/GLBackground.css';

const SCREEN_SCALE = 1 / 4;

const VERTEX = 'attribute vec2 a_position; void main() { gl_Position = vec4(a_position, 0, 1); }';

function getResolution() {
  const element = document.documentElement;
  return {
    w: Math.max(element.clientWidth, window.innerWidth || 0) * SCREEN_SCALE,
    h: Math.max(element.clientHeight, window.innerHeight || 0) * SCREEN_SCALE,
  };
}

const loadShader = (context, type, source) => {
  const shader = context.createShader(type);

  // Send the source to the shader object

  context.shaderSource(shader, source);

  // Compile the shader program

  context.compileShader(shader);

  // See if it compiled successfully

  if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
    // alert('An error occurred compiling the shaders: ' + context.getShaderInfoLog(shader));
    context.deleteShader(shader);
    return null;
  }

  return shader;
};

const initShaderProgram = (context, vsSource, fsSource) => {
  const vertexShader = loadShader(context, context.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(context, context.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = context.createProgram();
  context.attachShader(shaderProgram, vertexShader);
  context.attachShader(shaderProgram, fragmentShader);
  context.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!context.getProgramParameter(shaderProgram, context.LINK_STATUS)) {
    // alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
};


export default (props) => {
  const canvasRef = useRef(null);

  const { w: width, h: height } = getResolution();

  useLayoutEffect(() => {
    const canvas = canvasRef.current;

    let { w: currentW, h: currentH } = getResolution();

    const gl = canvas.getContext('webgl');

    if (!gl) {
      return () => {};
    }

    const fragment = props.children;

    const program = initShaderProgram(gl, VERTEX, fragment);

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

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uORes = gl.getUniformLocation(program, 'u_oreso');

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
      gl.uniform2f(uRes, currentW, currentH);
      gl.uniform2f(uORes, currentW / SCREEN_SCALE, currentH / SCREEN_SCALE);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const updateReso = () => {
      const { w, h } = getResolution();

      canvas.width = w;
      canvas.height = h;

      currentW = w;
      currentH = h;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    };

    window.addEventListener('resize', updateReso);

    let start = 0;

    let raf = 0;
    const updateTime = (ev) => {
      if (!start) start = ev;
      stamp = ev - start;
      time = stamp / 1000.0;

      raf = requestAnimationFrame(updateTime);
    };
    updateTime(0);

    const update = () => {
      render();
      raf = requestAnimationFrame(update);
    };
    update();

    return () => {
      window.removeEventListener('resize', updateReso);
      cancelAnimationFrame(raf);
    };
  });

  return (
    <canvas
      ref={canvasRef}
      id="gl"
      width={width}
      height={height}
    />
  );
};
