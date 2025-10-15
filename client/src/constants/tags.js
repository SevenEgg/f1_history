export const TAG_OPTIONS = [
  { value: 'Analysis', label: '分析' },
  { value: 'Breaking news', label: '突发新闻' },
  { value: 'Commentary', label: '评论' },
  { value: 'Driver Ratings', label: '车手评分' },
  { value: 'Interview', label: '采访' },
  { value: 'Preview', label: '展望' },
  { value: 'Press release', label: '新闻稿' },
  { value: 'Race report', label: '比赛报告' },
  { value: 'Reactions', label: '反应' },
  { value: 'Rumor', label: '传闻' }
];

export const TAG_LABEL_MAP = TAG_OPTIONS.reduce((acc, cur) => {
  acc[cur.value] = cur.label;
  return acc;
}, {});
