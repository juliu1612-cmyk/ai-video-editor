import { createContext, useContext, useState, type ReactNode } from 'react';
import { uid } from '../utils/format';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;        // MB
  duration: number;    // 秒
  url: string;         // mock URL
  cover?: string;      // 缩略图
}

export interface WatermarkItem {
  id: string;
  text: string;
  fontSize: number;
  color: string;
  opacity: number;     // 0-100
  position: { xPct: number; yPct: number }; // 百分比 0-100
  start: number;       // 出现秒
  end: number;         // 消失秒
}

export interface GeneratedVideo {
  id: string;
  title: string;
  scene: string;        // 场景 key: mixed-cut / replace-logo / ...
  sceneLabel: string;   // 场景中文名
  url: string;
  cover: string;        // CSS 渐变封面
  createdAt: number;    // 时间戳
  maker?: string;       // 制作人
}

export type NavKey = 'home' | 'workbench' | 'videos';

interface AppState {
  activeScene: string;             // 当前激活的场景 key
  setActiveScene: (k: string) => void;
  nav: NavKey;
  setNav: (k: NavKey) => void;
  uploadedFiles: UploadedFile[];
  addUploadedFile: (f: UploadedFile) => void;
  removeUploadedFile: (id: string) => void;
  selectedScriptId: string | null;
  setSelectedScriptId: (id: string) => void;
  credits: number;
  setCredits: (n: number) => void;
  generatedVideos: GeneratedVideo[];
  addGeneratedVideo: (v: Omit<GeneratedVideo, 'id' | 'createdAt'>) => void;
  removeGeneratedVideo: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

// 场景 key -> 中文名 + 封面渐变
export const sceneMeta: Record<string, { label: string; cover: string }> = {
  'mixed-cut':     { label: '剧情混剪',       cover: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' },
  'mixed-cut-bgm': { label: '剧情混剪+BGM',   cover: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' },
  'title':         { label: '混剪+小标题',    cover: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' },
  'replace-logo':  { label: 'Logo 替换',      cover: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
  'watermark':     { label: '水印打码',       cover: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)' },
  'preface':       { label: 'AI 前贴',        cover: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' },
};

const now = Date.now();

// 预置几条 mock 成片,方便演示列表功能
const initialVideos: GeneratedVideo[] = [
  {
    id: 'mv1',
    title: '豪宠私人会竟成直播,总裁反击太解气',
    scene: 'mixed-cut',
    sceneLabel: '剧情混剪',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    cover: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
    createdAt: now - 1000 * 60 * 5,
    maker: '李晓婷',
  },
  {
    id: 'mv2',
    title: '豪门复仇片段 · 已去除原片 Logo',
    scene: 'replace-logo',
    sceneLabel: 'Logo 替换',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    cover: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    createdAt: now - 1000 * 60 * 60 * 2,
    maker: '陈志远',
  },
  {
    id: 'mv3',
    title: '前妻再嫁豪门,前夫带娃上门讨说法',
    scene: 'title',
    sceneLabel: '混剪+小标题',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    cover: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    createdAt: now - 1000 * 60 * 60 * 26,
    maker: '王雅静',
  },
];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [activeScene, setActiveScene] = useState('scene1');
  const [nav, setNav] = useState<NavKey>('home');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([
    // 默认一个 mock 素材,让演示更直观
    {
      id: 'default1',
      name: '示例剧集片段.mp4',
      size: 128.4,
      duration: 75,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      cover: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    },
  ]);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [credits, setCredits] = useState(60);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>(initialVideos);

  const addUploadedFile = (f: UploadedFile) => {
    setUploadedFiles(prev => [...prev, f]);
  };
  const removeUploadedFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // 5 秒内同标题+同 URL 去重(防 StrictMode 双挂载重复记录)
  const addGeneratedVideo = (v: Omit<GeneratedVideo, 'id' | 'createdAt'>) => {
    setGeneratedVideos(prev => {
      const dup = prev.some(
        p => p.title === v.title && p.url === v.url && Date.now() - p.createdAt < 5000
      );
      if (dup) return prev;
      return [{ ...v, id: uid(), createdAt: Date.now() }, ...prev];
    });
  };
  const removeGeneratedVideo = (id: string) => {
    setGeneratedVideos(prev => prev.filter(v => v.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        activeScene, setActiveScene,
        nav, setNav,
        uploadedFiles, addUploadedFile, removeUploadedFile,
        selectedScriptId, setSelectedScriptId,
        credits, setCredits,
        generatedVideos, addGeneratedVideo, removeGeneratedVideo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppState => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
