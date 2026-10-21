import assert from 'node:assert/strict';
import test from 'node:test';
import { starPositions, renderScale, rotationMatrix } from '../assets/starfield.js';

test('Stars fill the original shell between radii 20 and 80', () => {
  const positions = starPositions();
  assert.equal(positions.length, 5000 * 3);
  for (let i = 0; i < positions.length; i += 3) {
    const radius = Math.hypot(positions[i], positions[i + 1], positions[i + 2]);
    assert.ok(radius >= 20 - 1e-4 && radius <= 80 + 1e-4);
  }
});

test('The star field draws at device resolution only within a pixel budget', () => {
  assert.equal(renderScale(1280, 800, 1), 1);
  assert.equal(renderScale(800, 600, 2), 1.5, 'never more than 1.5 pixels per CSS pixel');
  assert.ok(renderScale(1280, 800, 2) < 1.5, 'and less once the budget is reached');
  assert.ok(renderScale(2560, 1440, 2) < 0.8, 'large windows draw fewer pixels');
  assert.ok(Math.round(2560 * 1440 * renderScale(2560, 1440, 2) ** 2) <= 2_000_000);
  assert.equal(renderScale(8000, 8000, 1), 0.5, 'but not blurrier than half resolution');
});

test('The shell turns like the original, in X-then-Y-then-Z order', () => {
  assert.deepEqual([...rotationMatrix(0, 0, 0)].map(value => value + 0), [1, 0, 0, 0, 1, 0, 0, 0, 1]);
  const turn = rotationMatrix(0.3, 1.1, -0.7);
  // Columns stay unit length and at right angles to one another.
  const column = index => [turn[index * 3], turn[index * 3 + 1], turn[index * 3 + 2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  for (const [a, b] of [[0, 0], [1, 1], [2, 2]]) assert.ok(Math.abs(dot(column(a), column(b)) - 1) < 1e-6);
  for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) assert.ok(Math.abs(dot(column(a), column(b))) < 1e-6);
  // A quarter turn about Y alone carries +x to -z.
  const quarter = rotationMatrix(0, Math.PI / 2, 0);
  assert.ok(Math.abs(quarter[2] + 1) < 1e-6);
});
