function calculateCourseProgress(course, sessions) {
  const itemCount = course?.content?.length || 0;
  if (itemCount === 0) return 0;

  const highestByItem = Array(itemCount).fill(0);
  for (const session of sessions) {
    for (const item of session.contentProgress || []) {
      if (Number.isInteger(item.contentIndex) && item.contentIndex >= 0 && item.contentIndex < itemCount) {
        highestByItem[item.contentIndex] = Math.max(
          highestByItem[item.contentIndex],
          Math.min(100, Math.max(0, Number(item.percent) || 0))
        );
      }
    }
  }

  return Math.round((highestByItem.reduce((sum, value) => sum + value, 0) / itemCount) * 10) / 10;
}

module.exports = { calculateCourseProgress };
