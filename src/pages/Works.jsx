import React from 'react';
import GLBackground from '../components/GLBackground';

export default () => (
  <>
    <GLBackground>
      {`
        #define ITERATIONS 50.
        #ifdef GL_FRAGMENT_PRECISION_HIGH
          precision highp float;
        #else
          precision mediump float;
        #endif
        precision mediump int;
       
        
        uniform float u_time;
        uniform vec2 u_mouse;
        uniform vec2 u_resolution;
        uniform vec2 u_oreso;
        
        const float TIME_SCALE = 0.1;
        
        float modI(float a,float b) {
          float m=a - floor((a + 0.5) / b) * b;
          return floor(m + 0.5);
        }
        
        vec3 getJulia(vec2 pixel){
        
          vec2 mid = u_oreso * 0.5;
          vec2 m = mid - u_mouse;
          
          float w = u_resolution.x;
          float h = u_resolution.y;
          
          float time = u_time * TIME_SCALE;
          
          m /= mid;
          
          float re = m.x * cos(time);
          float im = m.y * -sin(time);
          
          float newRe = 1.5 * (pixel.x - w / 2.0) / (0.5 * w);
          float newIm = (pixel.y - h / 2.0) / (0.5 * h);
          float oldRe, oldIm;
          
          float steps;
          
          for (float i = 0.; i < ITERATIONS; i++){
            steps = i;
            oldRe = newRe;
            oldIm = newIm;
            
            newRe = oldRe * oldRe - oldIm * oldIm + re;
            newIm = 2.0 * oldRe * oldIm + im;
            
            if ((newRe * newRe + newIm * newIm) > 4.) break;
          }
          
          float s_f = steps;
          float r = 1. - abs(1. - 2. * s_f/ITERATIONS);
          float g = 1. - abs(1. - 2. * s_f/ITERATIONS);
          float b = 1. - abs(1. - 2. * s_f/ITERATIONS);
          
          return vec3(r, g, b);
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
          frag.x = getJulia(vec2(ratio.x - 0.0025 * sin(u_time), ratio.y)*u_resolution).x;
          frag.y = getJulia(coord).y;
          frag.z = getJulia(vec2(ratio.x + 0.0025 * sin(u_time), ratio.y)*u_resolution).z;
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
            vec3 currentJulia = getJulia(gl_FragCoord.xy);
            gl_FragColor = vec4(scanline(screenSpace, v), 1.0);
          }
        }
      `}
    </GLBackground>
  </>
);
