const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeContent } = require('../utils/courseContent');

test('normalizes and orders teacher study materials', () => {
  const result = normalizeContent([
    { contentType: 'video', title: ' Lecture ', url: '/uploads/videos/a.mp4', durationMinutes: 15 },
    { contentType: 'document', title: ' Slides ', url: '/uploads/materials/a.pdf', durationMinutes: -3 },
  ]);
  assert.deepEqual(result.map(({ contentType, title, durationMinutes, order }) => ({ contentType, title, durationMinutes, order })), [
    { contentType: 'video', title: 'Lecture', durationMinutes: 15, order: 0 },
    { contentType: 'document', title: 'Slides', durationMinutes: 0, order: 1 },
  ]);
});

test('rejects incomplete materials and safely handles invalid input', () => {
  assert.deepEqual(normalizeContent(null), []);
  assert.deepEqual(normalizeContent([{ contentType: 'video', title: '', url: '' }]), []);
});
