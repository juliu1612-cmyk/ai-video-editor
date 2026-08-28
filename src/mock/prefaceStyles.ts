/**
 * AI 前贴风格
 */
export interface PrefaceStyle {
  id: string;
  name: string;
  desc: string;
  example: string;     // CSS 渐变 (示例画面)
  duration: 1 | 3 | 5 | 10;
  script: string;      // 推荐脚本
}

export const prefaceStyles: PrefaceStyle[] = [
  {
    id: 'p1', name: '悬念开场',
    desc: '抛出冲突,引发观众好奇',
    example: 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)',
    duration: 3,
    script: '当你看到妻子家中的监控画面时,你会发现,这一切远比想象的更可怕……',
  },
  {
    id: 'p2', name: '冲突反转',
    desc: '上一秒平静,下一秒爆发',
    example: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    duration: 5,
    script: '三年前,他含冤入狱;三年后,他强势归来。而她,跪在门外,哭得撕心裂肺。',
  },
  {
    id: 'p3', name: '治愈瞬间',
    desc: '暖心片段,情绪反差',
    example: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    duration: 3,
    script: '在最深的绝望里,她看到了他温柔的笑。这一笑,胜过千言万语。',
  },
  {
    id: 'p4', name: '搞笑反差',
    desc: '出其不意,引人发笑',
    example: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    duration: 1,
    script: '谁说反派一定要聪明?这个反派智商下线,笑点拉满!',
  },
  {
    id: 'p5', name: '高能预警',
    desc: '节奏感拉满,预告精彩',
    example: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)',
    duration: 5,
    script: '前方高能!这是一个关于复仇、关于救赎、关于真爱的故事。请系好安全带,我们发车了。',
  },
];
