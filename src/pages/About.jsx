import React from 'react';
import GLBackground from '../components/GLBackground';

export default () => (
  <>
    <GLBackground>
      {`
        #ifdef GL_ES
          precision mediump float;
        #endif
        
        #extension GL_OES_standard_derivatives : enable
        
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform vec2 u_resolution;
        
        const float PI = acos(-1.0);
        
        float distanceFunction(vec3 p){
          vec3 pp = abs(fract(p + vec3(0.0, 0.0, u_time)) * 2.0 - 1.0);
          
          return min(p.y + 1.0, max(pp.z, pp.x) + p.y * 0.5);
        }
        
        vec3 calculateNormal(vec3 p){
          const float delta = 0.001;
          
          float startd = distanceFunction(p);
          float dx = startd - distanceFunction(vec3(p.x - delta, p.y, p.z));
          float dy = startd - distanceFunction(vec3(p.x, p.y - delta, p.z));
          float dz = startd - distanceFunction(vec3(p.x, p.y, p.z - delta));
          
          return normalize(vec3(dx, dy, dz));
        }
        
        vec3 render(vec2 coord) {
        
          vec2 position = coord.xy / u_resolution.xy;
          vec3 vector = normalize(vec3((1.0 - (u_mouse.xy / u_resolution.xy) * 0.5) + position * 2.0 - 1.0, 1.0));
          
          const int steps = 128;
          const float rSteps = 1.0 / float(steps);
          
          vec3 worldPosition = vec3(0.0);
          bool hit = false;
          float woah = 0.0;
          
          for (int i = 0; i < steps; ++i){
            float d = distanceFunction(worldPosition);
            woah = float(i);
            
            hit = true;
            if (abs(d) < 0.001 || length(worldPosition) > 64.0) break;
            hit = false;
            
            worldPosition += vector * d * 0.5;
          }
          
          vec3 normal = calculateNormal(worldPosition);
          //vec3 halfVector = normalize(normal + vector);
          //float NoV = dot(normal, -vector);
        
          return vec3(woah * 0.02) / length(worldPosition) * 3.0;
        }
        
        /**
         * for crt
         */
        vec3 scanline(vec2 coord, vec3 screen)
        {
          screen.xyz -= sin((coord.y + (u_time * 29.0))) * 0.02;
          return screen;
        }
        
        vec2 crt(vec2 coord, float bend)
        {
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
        
        vec3 sampleSplit(vec2 coord)
        {
          vec3 frag;
          vec2 ratio = coord/u_resolution;
          frag.x = render(vec2(ratio.x - 0.0025 * sin(u_time), ratio.y) * u_resolution).x;
          frag.y = render(coord).y;
          frag.z = render(vec2(ratio.x + 0.0025 * sin(u_time), ratio.y) * u_resolution).z;
          return frag;
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / u_resolution.xy;
          uv.y = 1.0 - uv.y; // flip tex
          vec2 crtCoords = crt(uv, 3.2);
          if (crtCoords.x < 0.0 || crtCoords.x > 1.0 || crtCoords.y < 0.0 || crtCoords.y > 1.0){
            gl_FragColor = vec4(0.0);
          } else {
            vec3 v = sampleSplit(gl_FragCoord.xy);
            vec2 screenSpace = crtCoords * u_resolution.xy;
            gl_FragColor = vec4(scanline(screenSpace, v), 1.0);
          }
        }
      `}
    </GLBackground>
  </>
);
