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
        
        uniform sampler2D tex;
        
        uniform vec2 u_mouse;
        uniform vec2 u_resolution;
        uniform float u_time; 
        
        vec3 rotatey(in vec3 p, float ang) {
          return vec3(p.x * cos(ang) - p.z * sin(ang), p.y, p.x * sin(ang) + p.z * cos(ang));
        }
        vec3 rotatex(in vec3 p, float ang) {
          return vec3(p.x, p.y * cos(ang) - p.z * sin(ang), p.y * sin(ang) + p.z * cos(ang));
        }
        vec3 rotatez(in vec3 p, float ang) {
          return vec3(p.x * cos(ang) - p.y * sin(ang), p.x * sin(ang) + p.y * cos(ang), p.z);
        }
        
        float scene(vec3 p) {
          vec2 offset = u_mouse / u_resolution;
          p = rotatey(p, offset.x); 
          p = rotatex(p, offset.y); 
          p = rotatez(p, 1.0); 
          float d1 = length(p) - 0.5 + sin(-4.0 * u_time + 60.0 * p.x) * 0.01 + sin(1.5 * u_time + 50.0 * p.x * p.z) * 0.02; 
          return d1;
        }
        
        vec3 get_normal(vec3 p) {
          vec3 eps = vec3(0.001,0,0); 
          float nx = scene(p + eps.xyy) - scene(p - eps.xyy); 
          float ny = scene(p + eps.yxy) - scene(p - eps.yxy); 
          float nz = scene(p + eps.yyx) - scene(p - eps.yyx); 
          return normalize(vec3(nx,ny,nz)); 
        }

        vec3 render(vec2 coord) {
          vec2 p = 2.0 * (coord.xy / u_resolution) - 1.0; 
          p.x *= u_resolution.x / u_resolution.y; 
          vec3 color = vec3(0); 
        
        
          color = vec3(1.0 - length(p * 0.1)) * 0.4; 
          
          vec3 ro = vec3(0,0,1.0); 
          vec3 rd = normalize(vec3(p.x,p.y,-1.0));  
          vec3 pos = ro; 
          float dist = 0.0; 
          for (int i = 0; i < 64; i++) {
            float d = scene(pos);
            pos += rd * d;
            dist += d;
          }
          if (dist < 100.0) {
            vec3 lightpos = vec3(100.0, 0.0, 0.0); 
            vec3 n = get_normal(pos);
            //vec3 l = normalize(vec3(1, 0, 0.0)); 
            vec3 l = normalize(lightpos-pos); 
            float diff = 0.0 * clamp(dot(n, l), 0.0, 1.0); 
            float fres = clamp(dot(n, -rd), 0.0, 1.0); 
            float amb = 0.1; 
            float spec0 = 0.5 * pow(clamp(dot(reflect(n, l), normalize(vec3(-1.0, 0, 1.0))), 0.0, 1.0), 50.0); 
            float spec1 = 0.5 * pow(clamp(dot(reflect(n, l), normalize(vec3(1.0, 0, 1.0))), 0.0, 1.0), 50.0); 
            float spec2 = 3.0 * pow(clamp(dot(reflect(n, l), normalize(vec3(0.0, 0.5, 1.0))), 0.0, 1.0), 10.0); 
            color = diff * vec3(1.0) / dist;
            color += 0.0 * amb * vec3(1.0, 1.0, 1.0) * clamp(p.y, 0.0, 1.0) * 1.0;
            color = mix(vec3(1, 1, 1) * 0.2,vec3(1, 1, 1) * 0.0, fres);
            color += spec0 * vec3(1, 1, 1);
            color += smoothstep(0.0, 1.0, spec1)*vec3(1, 1, 1);
            color += 1.0 * pow(spec1, 2.0)*vec3(1, 1, 1);
            color += smoothstep(0.0, 0.5, spec2)*vec3(1, 1, 1)*pos.y*2.0; 
          }
        
          return color; 
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
