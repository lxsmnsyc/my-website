import React, { useEffect, useRef } from 'react';

import '../css/Cursor.css';

const MIN_RADIUS = 16;
const MAX_RADIUS = 64;
const DETECTION_RADIUS = 32;

const STEPS = 1 / 16;

const GROWTH_TIME = 1.0 / 8.0;
const GROWTH_STEP = 1 / 64;

const lerp = (a, b, t) => a + (b - a) * (t * t * (3 - 2 * t));

const CURSOR = {
  x: 0,
  y: 0,
  radius: 0,
};

let growing = false;
let timer = 0.0;

export const getX = () => CURSOR.x;

export const getY = () => CURSOR.y;

let targets = 0;
const targetsL = [];
const targetsX = [];
const targetsY = [];
const targetsR = [];

targets = 0;
function loadTarget(el) {
  const width = el.clientWidth;
  const height = el.clientHeight;

  const rect = el.getBoundingClientRect();

  const { top } = rect;
  const { left } = rect;

  const hw = width * 0.5;
  const hh = height * 0.5;


  const x = left + hw;
  const y = top + hh;

  targetsX[targets] = x;
  targetsY[targets] = y;
  targetsR[targets] = DETECTION_RADIUS + ((width > height) ? hh : hw);
  targets += 1;
}

function loadTargets() {
  const max = targets;
  targets = 0;
  for (let i = 0; i < max; i += 1) {
    loadTarget(targetsL[i]);
  }
}

export const addTarget = (el) => {
  targetsL.push(el);
  loadTarget(el);
};

export const removeTarget = (el) => {
  const index = targetsL.indexOf(el);

  if (index > -1) {
    targetsL.splice(index, 1);
  }
};

let targetX = 0;
let targetY = 0;
let prevX = 0;
let prevY = 0;

window.addEventListener('resize', loadTargets);

window.addEventListener('mousemove', (e) => {
  targetX = e.clientX;
  targetY = e.clientY;
});

export default () => {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;

    let raf;

    const update = () => {
      let dx = targetX - prevX;
      let dy = targetY - prevY;

      prevX += dx * STEPS;
      prevY += dy * STEPS;

      CURSOR.x = prevX;
      CURSOR.y = prevY;

      let transform = `translate3d(${prevX - DETECTION_RADIUS}px, ${prevY - DETECTION_RADIUS}px, 0)`;

      // check for targets
      let found = false;
      for (let i = 0; i < targets; i += 1) {
        const tx = targetsX[i];
        const ty = targetsY[i];

        dx = tx - prevX;
        dy = ty - prevY;

        const tr = targetsR[i];

        if (dx * dx + dy * dy <= tr * tr) {
          growing = true;
          found = true;
          break;
        }
      }
      if (!found) {
        growing = false;
      }

      const MIN_SCALE = MIN_RADIUS / MAX_RADIUS;
      if (growing) {
        if (timer < GROWTH_TIME) {
          const t = timer / GROWTH_TIME;
          const rad = MIN_SCALE + lerp(0, 1, t * t * t) * (1.0 - MIN_SCALE);

          CURSOR.radius = rad * MAX_RADIUS;

          transform += `scale3d(${rad},${rad},1)`;

          timer += GROWTH_STEP;
        }
      } else if (timer > 0.0) {
        const t = timer / GROWTH_TIME;
        const rad = MIN_SCALE + lerp(0, 1, t * t * t) * (1.0 - MIN_SCALE);

        CURSOR.radius = rad * MAX_RADIUS;

        transform += `scale(${rad})`;

        timer -= GROWTH_STEP;
      } else {
        CURSOR.radius = MIN_RADIUS;
        transform += `scale(${MIN_SCALE})`;
      }

      cursor.style.webkitTransform = transform;
      cursor.style.mozTransform = transform;
      cursor.style.msTransform = transform;
      cursor.style.oTransform = transform;
      cursor.style.transform = transform;

      raf = requestAnimationFrame(update);
    };

    update();

    return () => cancelAnimationFrame(raf);
  });
  return (
    <div id="cursor" ref={cursorRef} />
  );
};
