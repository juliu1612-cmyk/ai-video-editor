import { useEffect } from 'react';
import { Button } from 'antd';
import { CheckCircleFilled, DownloadOutlined, RedoOutlined, VideoCameraOutlined } from '@ant-design/icons';
import PreviewPlayer from './PreviewPlayer';
import { useApp, sceneMeta } from '../context/AppContext';
import { downloadVideo } from '../utils/download';

export type SceneKey = 'mixed-cut' | 'mixed-cut-bgm' | 'title' | 'replace-logo' | 'watermark' | 'preface';

interface FinalPreviewPanelProps {
  title: string;
  subtitle?: string;
  url?: string;
  overlays?: React.ReactNode[];
  /** 当前场景,决定顶部"已为你创建 …"的文案 */
  scene?: SceneKey | string;
  /** 顶部副标题(场景描述),如"AI 已自动识别剧情高光并混剪" */
  sceneDesc?: string;
  /** 批量数量,默认 1 */
  count?: number;
  onExport?: () => void;
  onRedo?: () => void;
}

const sceneCopy: Record<string, { noun: string; label: string }> = {
  'mixed-cut':    { noun: '解说视频',  label: '剧情混剪' },
  'mixed-cut-bgm':{ noun: '解说视频',  label: '剧情混剪+BGM' },
  'title':        { noun: '解说视频',  label: '剧情混剪+小标题' },
  'replace-logo': { noun: '去 Logo 视频', label: 'Logo 替换' },
  'watermark':    { noun: '打码视频',  label: '水印打码' },
  'preface':      { noun: '带前贴视频', label: 'AI 前贴' },
};

const FinalPreviewPanel = ({
  title, subtitle, url, overlays, scene, sceneDesc, count = 1, onExport, onRedo,
}: FinalPreviewPanelProps) => {
  const copy = scene && sceneCopy[scene] ? sceneCopy[scene] : { noun: '成片', label: '生成视频' };
  const { addGeneratedVideo, setNav } = useApp();
  const meta = scene && sceneMeta[scene] ? sceneMeta[scene] : { label: copy.label, cover: 'linear-gradient(135deg,#6366f1,#a855f7)' };

  // 生成完成(mount)时,把成片记录到全局列表(自动去重)
  useEffect(() => {
    if (!url) return;
    addGeneratedVideo({
      title,
      scene: scene ?? 'unknown',
      sceneLabel: meta.label,
      url,
      cover: meta.cover,
      maker: '我',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        border: '1px solid #e5e7eb',
        maxWidth: 380,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          color: '#10b981',
          fontWeight: 600,
          fontSize: 14,
          marginBottom: 8,
        }}
      >
        <CheckCircleFilled /> 已为你创建 {count} 个{copy.noun}
      </div>
      {(sceneDesc || subtitle) && (
        <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
          {sceneDesc || subtitle}
        </div>
      )}
      <PreviewPlayer url={url} overlays={overlays} />
      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ marginTop: 4, textAlign: 'center', fontSize: 11, color: '#9ca3af' }}>
        {copy.label}
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <Button block icon={<RedoOutlined />} onClick={onRedo}>重新创作</Button>
        <Button
          block
          type="primary"
          className="gradient-btn"
          icon={<DownloadOutlined />}
          onClick={() => {
            if (url) downloadVideo(url, title);
            onExport?.();
          }}
        >
          下载成片
        </Button>
      </div>
      <Button
        block
        type="link"
        icon={<VideoCameraOutlined />}
        onClick={() => setNav('videos')}
        style={{ marginTop: 8 }}
      >
        查看成片列表
      </Button>
    </div>
  );
};

export default FinalPreviewPanel;