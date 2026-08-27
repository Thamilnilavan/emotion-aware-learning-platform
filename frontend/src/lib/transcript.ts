export interface TranscriptCue {
  start: number;
  end: number;
  text: string;
}

const parseTimestamp = (value: string): number | null => {
  const parts = value.trim().replace(',', '.').split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isFinite(part))) return null;
  const [hours, minutes, seconds] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
  return (hours * 3600) + (minutes * 60) + seconds;
};

export const parseWebVtt = (source: string): TranscriptCue[] => {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r/g, '').trim();
  if (!normalized.startsWith('WEBVTT')) throw new Error('Invalid WebVTT transcript');

  return normalized
    .split(/\n{2,}/)
    .slice(1)
    .flatMap((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      const timingIndex = lines.findIndex((line) => line.includes('-->'));
      if (timingIndex < 0) return [];
      const [rawStart, rawEnd] = lines[timingIndex].split('-->');
      const start = parseTimestamp(rawStart);
      const end = parseTimestamp(rawEnd.split(/\s+/)[0]);
      const text = lines.slice(timingIndex + 1).join(' ').replace(/<[^>]+>/g, '').trim();
      if (start === null || end === null || end <= start || !text) return [];
      return [{ start, end, text }];
    });
};
