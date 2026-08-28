/**
 * BGM 列表 - 8 首,按情绪分类
 */
export interface Bgm {
  id: string;
  name: string;
  mood: '激烈' | '治愈' | '悬疑' | '搞笑' | '悲伤' | '史诗';
  duration: number;     // 秒
  bpm: number;
  cover: string;        // CSS 渐变
  tags: string[];
}

export const bgmList: Bgm[] = [
  {
    id: 'b1', name: '暗涌', mood: '激烈', duration: 152, bpm: 128,
    cover: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    tags: ['节奏感强', '高潮迭起'],
  },
  {
    id: 'b2', name: '午夜追凶', mood: '悬疑', duration: 178, bpm: 90,
    cover: 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)',
    tags: ['低沉', '紧张感'],
  },
  {
    id: 'b3', name: '春日序曲', mood: '治愈', duration: 165, bpm: 75,
    cover: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    tags: ['温暖', '轻快'],
  },
  {
    id: 'b4', name: '小丑登场', mood: '搞笑', duration: 92, bpm: 140,
    cover: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    tags: ['俏皮', '戏剧化'],
  },
  {
    id: 'b5', name: '雨夜告白', mood: '悲伤', duration: 210, bpm: 65,
    cover: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    tags: ['钢琴', '催泪'],
  },
  {
    id: 'b6', name: '王者归来', mood: '史诗', duration: 240, bpm: 110,
    cover: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)',
    tags: ['弦乐', '燃'],
  },
  {
    id: 'b7', name: '暴风雨前', mood: '激烈', duration: 124, bpm: 135,
    cover: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    tags: ['鼓点密集', '肾上腺素'],
  },
  {
    id: 'b8', name: '温柔陷阱', mood: '悬疑', duration: 156, bpm: 80,
    cover: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    tags: ['暗流涌动', '心理压迫'],
  },
];

export const moodColorMap: Record<string, string> = {
  激烈: '#ef4444',
  治愈: '#10b981',
  悬疑: '#1f2937',
  搞笑: '#f59e0b',
  悲伤: '#6366f1',
  史诗: '#a855f7',
};
