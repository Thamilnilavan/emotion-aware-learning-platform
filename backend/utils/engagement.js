const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const EMOTION_VALENCE = {
  happy: 1,
  surprised: 0.75,
  neutral: 0.6,
  fearful: 0.3,
  sad: 0.25,
  disgusted: 0.2,
  angry: 0.15,
};

function calculateEngagement(frames) {
  if (!Array.isArray(frames) || frames.length === 0) {
    throw new TypeError('A non-empty frames array is required');
  }

  const emotionDistribution = {};
  let totalAttention = 0;
  let totalValence = 0;
  let totalInteraction = 0;
  let totalFatigue = 0;

  for (const frame of frames) {
    const emotion = String(frame.emotion || 'neutral').toLowerCase();
    emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
    totalAttention += clamp(Number(frame.attention) || 0, 0, 1);
    totalValence += EMOTION_VALENCE[emotion] ?? 0.5;
    totalInteraction += clamp(Number(frame.interaction) || 0, 0, 1);
    totalFatigue += clamp(Number(frame.fatigue) || 0, 0, 1);
  }

  const count = frames.length;
  const attentionScore = totalAttention / count;
  const valenceScore = totalValence / count;
  const interactionScore = totalInteraction / count;
  const fatigueScore = totalFatigue / count;
  const engagementScore = Math.round(
    (0.45 * attentionScore + 0.35 * valenceScore + 0.20 * interactionScore) * 100
  );

  const negativeRatio = Object.entries(emotionDistribution)
    .filter(([emotion]) => ['angry', 'sad', 'fearful', 'disgusted'].includes(emotion))
    .reduce((sum, [, amount]) => sum + amount, 0) / count;

  let state = 'ENGAGED';
  if (fatigueScore >= 0.65 || engagementScore < 20) state = 'BREAK_NEEDED';
  else if (engagementScore < 45) state = 'DISTRACTED';
  else if (negativeRatio >= 0.6) state = 'NEGATIVE_AFFECT';
  else if (engagementScore < 70) state = 'MILD_DISTRACTION';

  return {
    engagementScore,
    state,
    attentionScore,
    valenceScore,
    interactionScore,
    fatigueScore,
    negativeAffectRatio: negativeRatio,
    emotionDistribution,
  };
}

module.exports = { calculateEngagement };
