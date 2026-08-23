const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateEngagement } = require('../utils/engagement');

test('returns ENGAGED for attentive, positive and interactive frames', () => {
  const result = calculateEngagement([
    { emotion: 'happy', attention: 1, interaction: 1 },
    { emotion: 'neutral', attention: 1, interaction: 0.8 },
  ]);
  assert.equal(result.state, 'ENGAGED');
  assert.ok(result.engagementScore >= 70);
  assert.ok(result.attentionScore >= 0 && result.attentionScore <= 1);
});

test('makes BREAK_NEEDED reachable for a very low score', () => {
  const result = calculateEngagement([
    { emotion: 'angry', attention: 0, interaction: 0 },
  ]);
  assert.equal(result.state, 'BREAK_NEEDED');
  assert.ok(result.engagementScore < 20);
});

test('clamps incoming attention and interaction to the 0..1 contract', () => {
  const result = calculateEngagement([
    { emotion: 'neutral', attention: 100, interaction: -5 },
  ]);
  assert.equal(result.attentionScore, 1);
  assert.equal(result.interactionScore, 0);
});

test('returns NEGATIVE_AFFECT when negative emotion dominates a viable window', () => {
  const result = calculateEngagement([
    { emotion: 'sad', attention: 1, interaction: 1, fatigue: 0 },
    { emotion: 'angry', attention: 1, interaction: 1, fatigue: 0 },
    { emotion: 'neutral', attention: 1, interaction: 1, fatigue: 0 },
  ]);
  assert.equal(result.state, 'NEGATIVE_AFFECT');
  assert.ok(result.negativeAffectRatio >= 0.6);
});

test('returns BREAK_NEEDED when measured fatigue remains high', () => {
  const result = calculateEngagement([
    { emotion: 'happy', attention: 1, interaction: 1, fatigue: 0.8 },
    { emotion: 'neutral', attention: 1, interaction: 1, fatigue: 0.7 },
  ]);
  assert.equal(result.state, 'BREAK_NEEDED');
  assert.ok(result.fatigueScore >= 0.65);
});
