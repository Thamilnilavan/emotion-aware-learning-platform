const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateCourseProgress } = require('../utils/progress');

test('calculates progress from actual watched percentage across course items', () => {
  const course = { content: [{}, {}, {}] };
  const sessions = [{ contentProgress: [
    { contentIndex: 0, percent: 100 },
    { contentIndex: 1, percent: 50 },
  ] }];
  assert.equal(calculateCourseProgress(course, sessions), 50);
});

test('keeps the highest progress when content is replayed in another session', () => {
  const course = { content: [{}] };
  const sessions = [
    { contentProgress: [{ contentIndex: 0, percent: 80 }] },
    { contentProgress: [{ contentIndex: 0, percent: 20 }] },
  ];
  assert.equal(calculateCourseProgress(course, sessions), 80);
});
