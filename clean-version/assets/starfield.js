// The Supernova star field, drawn with a few lines of WebGL instead of a 3D
// library (it was Three.js: 725 KB and half a second of setup). It keeps the
// look of space-version/components/starfield/Starfield.tsx: 5,000 circular
// stars in a shell (radii 20–80) set 60 units away, seen from z = 5 with a
// 60° field of view, 0.15-unit points at 0.7 opacity with additive blending,
// fog from 25 to 120, and the same turning rates. To stay light on modest
// machines it redraws at most 30 times a second (the shell turns slowly) and
// caps how many pixels it draws.

const STARS = 5000;
const FRAME = 1000 / 30;
const PIXEL_BUDGET = 2_000_000;
// White after the original renderer's ACES filmic tone mapping and sRGB output.
const STAR_LEVEL = 0.888;

export function starPositions(count = STARS, random = Math.random) {
  const positions = new Float32Array(count * 3);
  const inner = 20, outer = 80;
  for (let i = 0; i < count; i++) {
    const theta = random() * 2 * Math.PI;
    const phi = Math.acos(2 * random() - 1);
    const radius = Math.cbrt(random() * (outer ** 3 - inner ** 3) + inner ** 3);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  return positions;
}

// Draw near device resolution, but never more than the pixel budget: stars
// are tiny, and the graphics chip has the rest of the page to composite.
export function renderScale(width, height, deviceRatio = 1) {
  return Math.max(0.5, Math.min(deviceRatio, 1.5, Math.sqrt(PIXEL_BUDGET / Math.max(1, width * height))));
}

// The shell's turn as a column-major matrix, in the original's X-then-Y-then-Z
// Euler order.
export function rotationMatrix(x, y, z) {
  const a = Math.cos(x), b = Math.sin(x), c = Math.cos(y), d = Math.sin(y), e = Math.cos(z), f = Math.sin(z);
  const ae = a * e, af = a * f, be = b * e, bf = b * f;
  return new Float32Array([c * e, af + be * d, bf - ae * d, -c * f, ae - bf * d, be + af * d, d, -b * c, a * c]);
}

const VERTEX = `
attribute vec3 position;
uniform mat3 turn;
uniform float aspect;
uniform float pointScale;
varying float fade;
void main() {
  vec3 view = turn * position + vec3(0.0, 0.0, -65.0);
  float depth = -view.z;
  fade = 1.0 - smoothstep(25.0, 120.0, depth);
  gl_PointSize = pointScale / max(depth, 0.1);
  // A 60° field of view; stars behind the camera are clipped away.
  gl_Position = depth > 0.1 ? vec4(view.x * 1.7320508 / aspect, view.y * 1.7320508, 0.0, depth) : vec4(0.0, 0.0, 2.0, 1.0);
}`;
const FRAGMENT = `
precision mediump float;
varying float fade;
void main() {
  vec2 offset = 2.0 * gl_PointCoord - 1.0;
  if (dot(offset, offset) > 1.0) discard;
  gl_FragColor = vec4(vec3(${STAR_LEVEL} * fade), 0.7);
}`;

// Creates the canvas at once but sets up WebGL just after the page first
// paints, compiling shaders in the background where the browser allows, so
// the star field never delays the page. Stars fade in once they can draw.
export function createStarfield({ document, window }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'supernova-background';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const positions = starPositions();
  let gl = null, background = null, program = null, uniforms = null, disposed = false, contextLost = false;
  // Pending setup: a frame request and a timer, kept apart since their ids can coincide.
  let setupFrame = null, setupTimer = null, frame = null, previous = null, drawn = -Infinity, moving = false;
  let x = 0, y = 0, z = 0;

  function shader(type, source) {
    const compiled = gl.createShader(type);
    gl.shaderSource(compiled, source);
    gl.compileShader(compiled);
    return compiled;
  }
  // Starts building the program; with KHR_parallel_shader_compile the driver
  // finishes it off the main thread.
  function build() {
    program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    uniforms = null;
    waitForProgram();
  }
  function waitForProgram() {
    setupFrame = null;
    if (disposed || contextLost) return;
    if (background && !gl.getProgramParameter(program, background.COMPLETION_STATUS_KHR)) {
      setupFrame = window.requestAnimationFrame(waitForProgram);
      return;
    }
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return fail();
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
    uniforms = Object.fromEntries(['turn', 'aspect', 'pointScale'].map(name => [name, gl.getUniformLocation(program, name)]));
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 1);
    resize();
    canvas.classList.add('is-ready');
    setMotion(moving);
  }
  // Without WebGL the selected palette simply stays plain.
  function fail() {
    disposed = true;
    canvas.remove();
  }
  function start() {
    setupTimer = null;
    if (disposed) return;
    // Size the canvas before creating the context: reallocating a drawing
    // buffer afterwards can stall some drivers for tens of milliseconds.
    fit();
    gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) return fail();
    background = gl.getExtension('KHR_parallel_shader_compile');
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    build();
  }

  function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix3fv(uniforms.turn, false, rotationMatrix(x, y, z));
    gl.drawArrays(gl.POINTS, 0, STARS);
  }
  function cancelFrame() {
    if (frame !== null) window.cancelAnimationFrame(frame);
    frame = null;
    previous = null;
  }
  function animate(now) {
    frame = window.requestAnimationFrame(animate);
    if (now - drawn < FRAME - 2) return;
    drawn = now;
    const delta = previous === null ? 0 : Math.min((now - previous) / 1000, 0.1);
    previous = now;
    x += delta * 0.005;
    y += delta * 0.015;
    z += delta * 0.002;
    draw();
  }
  function setMotion(enabled) {
    moving = enabled;
    cancelFrame();
    if (moving && uniforms && !contextLost) frame = window.requestAnimationFrame(animate);
  }
  // Matches the drawing buffer to the window, within the pixel budget, and
  // returns the window's aspect ratio. Unchanged sizes are left alone.
  function fit() {
    const width = canvas.clientWidth || window.innerWidth, height = canvas.clientHeight || window.innerHeight;
    const scale = renderScale(width, height, window.devicePixelRatio || 1);
    const pixelsWide = Math.round(width * scale), pixelsHigh = Math.round(height * scale);
    if (canvas.width !== pixelsWide) canvas.width = pixelsWide;
    if (canvas.height !== pixelsHigh) canvas.height = pixelsHigh;
    return width / height;
  }
  function resize() {
    if (!uniforms || contextLost) return;
    const aspect = fit();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(uniforms.aspect, aspect);
    // The original's point size: 0.15 units, shrinking with distance.
    gl.uniform1f(uniforms.pointScale, 0.15 * canvas.height * 0.5);
    // Reduced-motion readers still get the star field, held still.
    draw();
  }
  function lost(event) {
    event.preventDefault();
    contextLost = true;
    cancelFrame();
  }
  function restored() {
    contextLost = false;
    build();
  }

  // Wait for the page's first paint before touching WebGL.
  setupFrame = window.requestAnimationFrame(() => {
    setupFrame = null;
    setupTimer = window.setTimeout(start, 0);
  });
  window.addEventListener('resize', resize);
  return {
    setMotion,
    dispose() {
      disposed = true;
      cancelFrame();
      if (setupFrame !== null) window.cancelAnimationFrame(setupFrame);
      if (setupTimer !== null) window.clearTimeout(setupTimer);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    },
  };
}
