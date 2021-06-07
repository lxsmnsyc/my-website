
#ifdef GL_ES
  precision mediump float;
#endif

#extension GL_OES_standard_derivatives : enable

uniform sampler2D tex;

uniform vec2 mouse;
uniform vec2 resolution;
uniform float time; 

vec3 rotatey(in vec3 p, float ang) {
  return vec3(p.x * cos(ang) - p.z * sin(ang), p.y, p.x * sin(ang) + p.z * cos(ang));
}
vec3 rotatex(in vec3 p, float ang) {
  return vec3(p.x, p.y * cos(ang) - p.z * sin(ang), p.y * sin(ang) + p.z * cos(ang));
}
vec3 rotatez(in vec3 p, float ang) {
  return vec3(p.x * cos(ang) - p.y * sin(ang), p.x * sin(ang) + p.y * cos(ang), p.z);
}

#define PI 3.14159265358979

float scene(vec3 p) {
  vec2 offset = mouse / resolution;
  p = rotatex(p, PI * (1.0 - offset.y * 2.0)); 
  p = rotatey(p, 1.0); 
  p = rotatez(p, PI * (1.0 - offset.x * 2.0)); 
  const float k = 2.0; // or some other amount
  float c = cos(k * p.y);
  float s = sin(k * p.y);
  mat2  m = mat2(c, -s, s, c);
  vec3  q = vec3(m * p.xz, p.y);
  float d1 = length(q) - 0.5 + sin(-6.0 * time + 60.0 * q.x) * 0.01; 
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
  vec2 p = 2.0 * (coord.xy / resolution) - 1.0; 
  p.x *= resolution.x / resolution.y; 
  vec3 color = vec3(0); 

  color = vec3(1.0 - length(p * 0.1)) * 0.4; 
  
  vec3 ro = vec3(-0.5, 0, 1.0); 
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
    color += smoothstep(0.0, 1.0, spec1) * vec3(1, 1, 1);
    color += 1.0 * pow(spec1, 2.0) * vec3(1, 1, 1);
    color += smoothstep(0.0, 0.5, spec2) * vec3(1, 1, 1)*pos.y*2.0; 
  }

  return color; 
}        

vec3 scanline(vec2 coord, vec3 screen) {
  screen.xyz -= sin((coord.y + (time * 29.0))) * 0.02;
  return screen;
}

vec3 sampleSplit(vec2 coord) {
  vec3 frag;
  vec2 ratio = coord/resolution;
  frag.x = render(vec2(ratio.x - 0.01 * sin(time), ratio.y)*resolution).x;
  frag.y = render(coord).y;
  frag.z = render(vec2(ratio.x + 0.01 * sin(time), ratio.y)*resolution).z;
  return frag;
}

float ease(float t) {
  return t * t * t;
}

float lerp(float a, float b, float t) {
  return a + (b - a) * ease(t);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  uv.y = 1.0 - uv.y;
  vec3 v = sampleSplit(gl_FragCoord.xy * vec2(1.0, 1.0));
  vec2 screenSpace = uv * resolution.xy;
  float ratio = 0.75 + sin(time + uv.y) * 0.05;
  vec3 scan = scanline(screenSpace, v);
  if (uv.x < ratio) {
    gl_FragColor = vec4(scan * lerp(0.0, 1.0, uv.x / ratio), 1.0);
  } else {
    gl_FragColor = vec4(scan, 1.0);
  }
}