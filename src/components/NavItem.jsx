/* eslint-disable react/prop-types */
import React, { useRef, useEffect } from 'react';

import { Link } from 'react-router-dom';
import { addTarget, removeTarget } from './Cursor';
import stringLerp from '../utils/stringLerp';

const INCREMENTS = 1.0 / 64.0;
const DETECTION_RADIUS = 32;

const DURATION = 0.4;
const MODE = 2;

export default ({ target, start, end }) => {
  const navRef = useRef(null);

  useEffect(() => {
    const item = navRef.current;

    addTarget(item);

    let timer = 0.0;
    let reversed = false;
    let raf;

    const update = () => {
      if (reversed) {
        if (timer > 0.0) {
          timer -= INCREMENTS;
          raf = requestAnimationFrame(update);
        }
      } else if (timer < DURATION) {
        timer += INCREMENTS;
        raf = requestAnimationFrame(update);
      }
      item.innerHTML = stringLerp(start, end, timer / DURATION, MODE);
    };

    const onMouseMove = (e) => {
      const y = e.clientY;
      const x = e.clientX;


      const width = item.clientWidth;
      const height = item.clientHeight;

      const rect = item.getBoundingClientRect();

      const { top } = rect;
      const { left } = rect;

      const hw = width * 0.5;
      const hh = height * 0.5;


      const ex = left + hw;
      const ey = top + hh;

      const dx = x - ex; const
        dy = y - ey;

      if (dx * dx + dy * dy <= DETECTION_RADIUS * DETECTION_RADIUS) {
        if (reversed) {
          reversed = false;
          update();
        }
      } else if (!reversed) {
        reversed = true;
        update();
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      removeTarget(item);
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
    };
  });

  return (
    <Link
      innerRef={navRef}
      className="nav-item"
      id={`nav-${target}`}
      to={`/${target}`}
    >
      {start}
    </Link>
  );
};
