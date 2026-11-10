/* 모락모락 타운 — WebGL 바닥층
 * 바다(해안 곡선·물결·포말)를 셰이더로 그리고, 2D로 구운 바닥 구역 그림을 텍스처로 올려 GPU에서 합성한다.
 * 결과 캔버스는 렌더러가 2D 화면에 한 장으로 그려 넣는다(밤 색조·불빛 등 나머지 합성은 그대로).
 * WebGL을 쓸 수 없거나 주소에 ?gl=0 이 있으면 렌더러가 2D로 그린다. */
(function (root) {
  'use strict';
  const VS_TEX = `
attribute vec2 a_pos; attribute vec2 a_uv;
uniform vec3 u_cam; uniform vec2 u_view;
varying vec2 v_uv;
void main() {
  vec2 s = (a_pos - u_cam.xy) * u_cam.z + u_view * 0.5;
  gl_Position = vec4(s.x / u_view.x * 2.0 - 1.0, 1.0 - s.y / u_view.y * 2.0, 0.0, 1.0);
  v_uv = a_uv;
}`;
  const FS_TEX = `
precision mediump float;
uniform sampler2D u_tex; varying vec2 v_uv;
void main() { gl_FragColor = texture2D(u_tex, v_uv); }`;
  const VS_FULL = `attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;
  // 화면 픽셀 → 월드 → 타일 좌표. 해안선 c(x) = base + Σ a·sin(x/k)
  const FS_SEA = `
precision highp float;
uniform vec3 u_cam; uniform vec2 u_view; uniform float u_dpr; uniform float u_time;
uniform vec4 u_coast; // base, a1, k1, a2
uniform vec2 u_coast2; // k2, beachW
uniform vec2 u_map;   // W, H
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 css = vec2(gl_FragCoord.x, u_view.y * u_dpr - gl_FragCoord.y) / u_dpr;
  vec2 w = (css - u_view * 0.5) / u_cam.z + u_cam.xy;
  float tx = (w.y / 16.0 + w.x / 32.0) * 0.5, ty = (w.y / 16.0 - w.x / 32.0) * 0.5;
  if (tx < -0.5 || tx > u_map.x - 0.5 || ty > u_map.y - 0.5) discard;
  float c = u_coast.x + u_coast.y * sin(tx / u_coast.z) + u_coast.w * sin(tx / u_coast2.x);
  float s = ty - c;                      // 0보다 크면 바다
  float px = 1.0 / (32.0 * u_cam.z);     // 화면 1px의 타일 길이(대략)
  vec3 ink = vec3(0.369, 0.122, 0.169);
  if (s < -u_coast2.y - 0.6) discard;    // 모래사장 안쪽(산책로·땅)은 다른 층이 그림
  vec3 col;
  if (s < 0.0) {
    // 모래: 물가는 젖은 모래, 작은 점
    col = mix(vec3(0.953, 0.875, 0.706), vec3(0.906, 0.792, 0.612), smoothstep(-0.35, -0.02, s));
    vec2 g = vec2(tx, ty) * 6.0; vec2 id = floor(g);
    if (hash(id) < 0.09 && length(fract(g) - 0.5) < 0.12) col = mix(col, ink, 0.3);
  } else {
    float deep = smoothstep(0.5, 3.0, s);
    col = mix(vec3(0.486, 0.776, 0.800), vec3(0.420, 0.725, 0.769), deep);
    // 잔물결: 칸마다 하나씩, 화면 가로 방향의 짧은 호가 깜빡이듯 떠오름
    vec2 g = vec2(tx, ty) * 1.3; vec2 id = floor(g); vec2 f = fract(g) - 0.5;
    float h = hash(id);
    if (h < 0.45 && s > 0.5) {
      float ph = fract(u_time * 0.25 + h * 7.0);
      vec2 o = vec2(fract(h * 13.0) - 0.5, fract(h * 29.0) - 0.5) * 0.4;
      vec2 d = f - o; float al = (d.x - d.y) * 0.5, ac = (d.x + d.y);
      if (abs(ac + al * al * 3.0) < px * 2.2 && abs(al) < 0.16) col = mix(col, vec3(1.0), 0.85 * sin(ph * 3.14159));
    }
    // 밀려왔다 빠지는 포말 두 줄
    float f1 = 0.10 + 0.05 * sin(tx * 1.7 + u_time * 1.1);
    float f2 = 0.42 + 0.18 * sin(u_time * 0.6) + 0.06 * sin(tx * 1.1 - u_time * 0.8);
    if (abs(s - f1) < px * 2.0) col = mix(col, vec3(1.0), 0.95);
    if (abs(s - f2) < px * 1.6 && sin(tx * 2.3 + u_time) > -0.2) col = mix(col, vec3(1.0), 0.8);
    if (s < f1) col = mix(col, vec3(0.86, 0.94, 0.94), 0.55);
  }
  if (abs(s) < px * 1.2) col = ink;      // 해안선 잉크 선
  gl_FragColor = vec4(col, 1.0);
}`;
  function compile(gl, vs, fs) {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  function GLGround() {
    this.ok = false;
    if (typeof document === 'undefined') return;
    try {
      const cv = this.cv = document.createElement('canvas');
      const gl = this.gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: false });
      if (!gl) return;
      this.pTex = compile(gl, VS_TEX, FS_TEX); this.pSea = compile(gl, VS_FULL, FS_SEA);
      this.buf = gl.createBuffer(); this.full = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.full); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      this.tex = new Map();
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); this.ok = false; }, false);
      this.ok = true;
    } catch (e) { this.ok = false; this.err = String(e.message || e); }
  }
  const G = GLGround.prototype;
  G.begin = function (w, h, dpr, cam) {
    const gl = this.gl;
    const W = Math.round(w * dpr), H = Math.round(h * dpr);
    if (this.cv.width !== W || this.cv.height !== H) { this.cv.width = W; this.cv.height = H; }
    gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.w = w; this.h = h; this.dpr = dpr; this.cam = cam;
  };
  G.sea = function (coast, map, time) {
    const gl = this.gl, p = this.pSea; gl.useProgram(p);
    gl.uniform3f(gl.getUniformLocation(p, 'u_cam'), this.cam.x, this.cam.y, this.cam.z);
    gl.uniform2f(gl.getUniformLocation(p, 'u_view'), this.w, this.h);
    gl.uniform1f(gl.getUniformLocation(p, 'u_dpr'), this.dpr);
    gl.uniform1f(gl.getUniformLocation(p, 'u_time'), time);
    const [[a1, k1], [a2, k2]] = coast.waves;
    gl.uniform4f(gl.getUniformLocation(p, 'u_coast'), coast.base, a1, k1, a2);
    gl.uniform2f(gl.getUniformLocation(p, 'u_coast2'), k2, coast.beachW);
    gl.uniform2f(gl.getUniformLocation(p, 'u_map'), map.W, map.H);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.full);
    const loc = gl.getAttribLocation(p, 'a_pos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.disableVertexAttribArray(loc);
  };
  // 2D로 구운 그림(캔버스)을 월드 사각형에 그림. key·ver가 같으면 다시 올리지 않음
  G.image = function (key, ver, canvas, x, y, w, h) {
    const gl = this.gl; let e = this.tex.get(key);
    if (!e) { e = { t: gl.createTexture(), ver: null }; this.tex.set(key, e); }
    gl.bindTexture(gl.TEXTURE_2D, e.t);
    if (e.ver !== ver) {
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      e.ver = ver;
    }
    const p = this.pTex; gl.useProgram(p);
    gl.uniform3f(gl.getUniformLocation(p, 'u_cam'), this.cam.x, this.cam.y, this.cam.z);
    gl.uniform2f(gl.getUniformLocation(p, 'u_view'), this.w, this.h);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([x, y, 0, 0, x + w, y, 1, 0, x, y + h, 0, 1, x + w, y + h, 1, 1]), gl.DYNAMIC_DRAW);
    const lp = gl.getAttribLocation(p, 'a_pos'), lu = gl.getAttribLocation(p, 'a_uv');
    gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(lu); gl.vertexAttribPointer(lu, 2, gl.FLOAT, false, 16, 8);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
  G.forget = function (keep) { for (const [k, e] of this.tex) if (!keep.has(k)) { this.gl.deleteTexture(e.t); this.tex.delete(k); } };
  root.GLGround = GLGround;
})(typeof window !== 'undefined' ? window : globalThis);
