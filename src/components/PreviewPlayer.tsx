import { useEffect, useRef, useState } from 'react';
import { Button } from 'antd';
import { PlayCircleOutlined, PauseOutlined } from '@ant-design/icons';

interface PreviewPlayerProps {
  url?: string;
  poster?: string;
  overlays?: React.ReactNode[];
  height?: number;
}

const PreviewPlayer = ({
  url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  overlays,
  height = 360,
}: PreviewPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (v.duration) setProgress((v.currentTime / v.duration) * 100);
    };
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.pause();
    } else {
      v.play().catch(() => {/* autoplay block */});
    }
    setPlaying(!playing);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '9 / 16',
        maxHeight: height,
        background: '#000',
        borderRadius: 12,
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      <video
        ref={videoRef}
        src={url}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        playsInline
        muted
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* 覆盖层 */}
      {overlays?.map((o, i) => (
        <div key={i} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {o}
        </div>
      ))}

      {/* 中心播放按钮 */}
      {!playing && (
        <div
          onClick={toggle}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: 'rgba(0,0,0,0.2)',
          }}
        >
          <PlayCircleOutlined style={{ fontSize: 64, color: '#fff' }} />
        </div>
      )}

      {/* 底部进度条 */}
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          padding: '12px 16px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Button
          type="text"
          icon={playing ? <PauseOutlined /> : <PlayCircleOutlined />}
          onClick={toggle}
          style={{ color: '#fff' }}
        />
        <div
          style={{
            flex: 1,
            height: 3,
            background: 'rgba(255,255,255,0.3)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1, #a855f7)',
              transition: 'width .2s',
            }}
          />
        </div>
        <span style={{ color: '#fff', fontSize: 12 }}>{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default PreviewPlayer;
