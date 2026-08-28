/**
 * 标题样式预设
 */
export interface TitleStyle {
  id: string;
  name: string;
  fontSize: number;       // px
  fontWeight: number;
  color: string;
  stroke: string;
  shadow: string;
  background: string;     // CSS background or 'transparent'
  fontFamily: string;
}

export const titleStyles: TitleStyle[] = [
  {
    id: 't1', name: '霸气黑金',
    fontSize: 56, fontWeight: 900,
    color: '#fbbf24',
    stroke: '#1f2937',
    shadow: '4px 4px 0 #000',
    background: 'transparent',
    fontFamily: 'Impact, sans-serif',
  },
  {
    id: 't2', name: '柔光白',
    fontSize: 48, fontWeight: 700,
    color: '#ffffff',
    stroke: 'transparent',
    shadow: '0 2px 8px rgba(0,0,0,0.5)',
    background: 'transparent',
    fontFamily: '"PingFang SC", sans-serif',
  },
  {
    id: 't3', name: '紫渐变',
    fontSize: 52, fontWeight: 800,
    color: '#a855f7',
    stroke: '#fff',
    shadow: '0 4px 12px rgba(168,85,247,0.4)',
    background: 'transparent',
    fontFamily: '"PingFang SC", sans-serif',
  },
  {
    id: 't4', name: '漫画气泡',
    fontSize: 42, fontWeight: 700,
    color: '#1f2937',
    stroke: 'transparent',
    shadow: '0 2px 0 #000',
    background: '#fbbf24',
    fontFamily: '"PingFang SC", sans-serif',
  },
  {
    id: 't5', name: '霓虹',
    fontSize: 50, fontWeight: 800,
    color: '#f472b6',
    stroke: 'transparent',
    shadow: '0 0 8px #f472b6, 0 0 16px #f472b6',
    background: 'transparent',
    fontFamily: '"PingFang SC", sans-serif',
  },
];
