import React from 'react';
import GLBackground from '../components/GLBackground';

export default () => (
  <>
    <GLBackground>
      {`
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        precision mediump int;
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_time;
        
        vec2 rot(vec2 p, float a) {
          float c = cos(a), s = sin(a);
          return vec2(
            c * p.x - s * p.y,
            s * p.x + c * p.y);
            
        }
        
        
        float map(vec3 p) {
          //p.x += sin(p.z * 0.25 + u_time) * 2.0;
          //p.y += cos(p.z * 0.25 + u_time) * 2.0;
          //p.xy = rot(p.xy, -p.z * 0.1);
          vec3 m = mod(p, 2.0) - 1.0;
          
          return length(max(abs(m) - 0.1, 0.0)) - 0.001;
        }

        vec3 render(vec2 coord) {
          vec2 uv = ( 2.0 * coord - u_resolution.xy ) / min(u_resolution.x, u_resolution.y);
          vec3 dir = normalize(vec3(uv, 1.85));
          vec3 pos = vec3(0, 0, u_time * 2.0);
          dir.yz = rot(dir.yz, (u_mouse.y / u_resolution.y) * 1.0);
          dir.zx = rot(dir.zx, (u_mouse.x / u_resolution.x) * 1.0);
          float t = 0.0;
          for(int i = 0 ; i < 90; i++) {
            float k = map(dir * t + pos);
            t += k * 0.85;
          }
          vec3 ip = dir;
          return vec3(t * 0.005 * mix(vec3(0), vec3(1), t * 0.025));
        }
        
        /**
         * for crt
         */
        vec3 scanline(vec2 coord, vec3 screen) {
          screen.xyz -= sin((coord.y + (u_time * 29.0))) * 0.02;
          return screen;
        }

        vec2 crt(vec2 coord, float bend) {
          // put in symmetrical coords
          coord = (coord - 0.5) * 2.0;
          coord *= 1.1;
          // deform coords
          coord.x *= 1.0 + pow((abs(coord.y) / bend), 2.0);
          coord.y *= 1.0 + pow((abs(coord.x) / bend), 2.0);
          // transform back to 0.0 - 1.0 space
          coord  = (coord / 2.0) + 0.5;
          return coord;
        }
        
        vec3 sampleSplit(vec2 coord) {
          vec3 frag;
          vec2 ratio = coord/u_resolution;
          frag.x = render(vec2(ratio.x - 0.0025 * sin(u_time), ratio.y)*u_resolution).x;
          frag.y = render(coord).y;
          frag.z = render(vec2(ratio.x + 0.0025 * sin(u_time), ratio.y)*u_resolution).z;
          return frag;
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          uv.y = 1.0 - uv.y; // flip tex
          vec2 crtCoords = crt(uv, 3.2);
          // shadertoy has tiling textures. wouldn't be needed
          // if you set up your tex params properly
          if (crtCoords.x < 0.0 || crtCoords.x > 1.0 || crtCoords.y < 0.0 || crtCoords.y > 1.0){
            gl_FragColor = vec4(0.0);
          } else {
            // Split the color channels
            vec3 v = sampleSplit(gl_FragCoord.xy);
            // HACK: this bend produces a shitty moire pattern.
            // Up the bend for the scanline
            vec2 screenSpace = crtCoords * u_resolution.xy;
            gl_FragColor = vec4(scanline(screenSpace, v), 1.0);
          }
        }
      `}
    </GLBackground>
  </>
);
