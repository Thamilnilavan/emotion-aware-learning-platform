const ALLOWED_CONTENT_TYPES = new Set(['video', 'youtube', 'document', 'link']);

const normalizeContent = (content) => {
  if (!Array.isArray(content)) return [];
  return content.map((item, index) => ({
    contentType: ALLOWED_CONTENT_TYPES.has(item.contentType) ? item.contentType : 'link',
    title: String(item.title || '').trim(),
    url: String(item.url || '').trim(),
    durationMinutes: Math.max(0, Number(item.durationMinutes) || 0),
    order: index,
  })).filter((item) => item.title && item.url);
};

module.exports = { normalizeContent };
