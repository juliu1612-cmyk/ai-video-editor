import { useRef, useState, useEffect } from 'react';
import { Button, Empty, Row, Col, message, Slider, Segmented, Input } from 'antd';
import {
  ThunderboltOutlined,
  HighlightOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import VideoUploader from '../components/VideoUploader';
import PreviewPlayer from '../components/PreviewPlayer';
import ProgressPanel, { type Step } from '../components/ProgressPanel';
import TopSteps from '../components/TopSteps';
import FinalPreviewPanel from '../components/FinalPreviewPanel';
import { useApp } from '../context/AppContext';
import { uid } from '../utils/format';
import type { WatermarkItem } from '../context/AppContext';

type Mode = 'floating' | 'marquee';

const Scene5Watermark = () => {
  const { uploadedFiles } = useApp();
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState<Mode>('floating');
  const [items, setItems] = useState<WatermarkItem[]>([
    {
      id: uid(),
      text: '禁止搬运',
      fontSize: 32,
      color: '#ffffff',
      opacity: 80,
      position: { xPct: 50, yPct: 88 },
      start: 0, end: 60,
    },
  ]);

  const playerWrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string | null; active: boolean; ox: number; oy: number }>({
    id: null, active: false, ox: 0, oy: 0,
  });

  const onWmPointerDown = (id: string, e: React.PointerEvent) => {
    e.preventDefault();
    const rect = playerWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const wm = items.find(i => i.id === id);
    if (!wm) return;
    const xPx = (wm.position.xPct / 100) * rect.width;
    const yPx = (wm.position.yPct / 100) * rect.height;
    dragRef.current = {
      id, active: true,
      ox: e.clientX - rect.left - xPx,
      oy: e.clientY - rect.top - yPx,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onWmPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active || !dragRef.current.id) return;
    const rect = playerWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xPx = e.clientX - rect.left - dragRef.current.ox;
    const yPx = e.clientY - rect.top - dragRef.current.oy;
    const xPct = Math.max(0, Math.min(100, (xPx / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (yPx / rect.height) * 100));
    const id = dragRef.current.id;
    setItems(prev => prev.map(i => i.id === id ? { ...i, position: { xPct, yPct } } : i));
  };

  const onWmPointerUp = () => { dragRef.current = { id: null, active: false, ox: 0, oy: 0 }; };

  useEffect(() => {
    const up = () => onWmPointerUp();
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  const addItem = () => {
    setItems(prev => [...prev, {
      id: uid(),
      text: '示例水印',
      fontSize: 32,
      color: '#ffffff',
      opacity: 60,
      position: { xPct: 50, yPct: 50 },
      start: 0, end: 60,
    }]);
  };
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id: string, patch: Partial<WatermarkItem>) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));

  const goAnalyze = () => {
    if (!uploadedFiles.length) return message.warning('请先上传素材');
    setPhase(2);
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 12;
      if (p >= 100) { p = 100; clearInterval(t); setPhase(3); }
      setProgress(p);
    }, 60);
  };

  const goGenerate = () => {
    setPhase(3);
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 5;
      if (p >= 100) { p = 100; clearInterval(t); setDone(true); message.success('生成完成'); }
      setProgress(p);
    }, 100);
  };

  const reset = () => { setPhase(1); setProgress(0); setDone(false); };

  const steps: Step[] = [
    { key: '1', label: '上传素材', status: phase > 1 ? 'finish' : phase === 1 ? 'process' : 'wait' },
    { key: '2', label: '配置水印', status: phase > 2 ? 'finish' : phase === 2 ? 'process' : 'wait' },
    { key: '3', label: '生成视频', status: phase === 3 ? 'process' : 'wait' },
  ];

  return (
    <div>
      <TopSteps current={phase} steps={['上传素材', '配置水印', '生成视频']} />

      <Row gutter={16}>
        <Col span={7}>
          <div className="section-card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>
              <ThunderboltOutlined style={{ color: '#6366f1' }} /> 上传素材视频
            </div>
            <VideoUploader multiple />
          </div>

          {phase >= 2 && (
            <div className="section-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>
                  <HighlightOutlined style={{ color: '#6366f1' }} /> 水印配置 ({items.length})
                </div>
                <Button size="small" icon={<PlusOutlined />} onClick={addItem}>添加</Button>
              </div>

              <Segmented
                value={mode}
                onChange={v => setMode(v as Mode)}
                options={[{ label: '漂浮', value: 'floating' }, { label: '跑马灯', value: 'marquee' }]}
                block
                style={{ marginBottom: 12 }}
              />

              {items.map((it, idx) => (
                <div
                  key={it.id}
                  style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>水印 #{idx + 1}</strong>
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(it.id)} />
                  </div>
                  <Input
                    value={it.text}
                    onChange={e => updateItem(it.id, { text: e.target.value })}
                    placeholder="水印文字"
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>字号 {it.fontSize}px</div>
                  <Slider min={16} max={64} value={it.fontSize} onChange={v => updateItem(it.id, { fontSize: v })} />
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>透明度 {it.opacity}%</div>
                  <Slider min={0} max={100} value={it.opacity} onChange={v => updateItem(it.id, { opacity: v })} />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>颜色</div>
                      <Input type="color" value={it.color} onChange={e => updateItem(it.id, { color: e.target.value })} style={{ height: 28 }} />
                    </div>
                    <div style={{ flex: 1, fontSize: 11, color: '#9ca3af' }}>
                      <div>位置 {Math.round(it.position.xPct)},{Math.round(it.position.yPct)}</div>
                      <div style={{ fontSize: 11 }}>在右侧预览拖动调整</div>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="primary"
                className="gradient-btn"
                block
                size="large"
                style={{ marginTop: 16 }}
                onClick={goGenerate}
              >
                生成打码视频
              </Button>
            </div>
          )}
        </Col>

        <Col span={10}>
          {phase === 1 && (
            <div className="section-card" style={{ textAlign: 'center', padding: 60 }}>
              <Empty description="先上传素材视频,开始配置水印">
                <Button type="primary" className="gradient-btn" size="large" onClick={goAnalyze}>
                  上传并配置
                </Button>
              </Empty>
            </div>
          )}

          {phase === 2 && (
            <ProgressPanel steps={steps} progress={progress} estimatedSeconds={120} />
          )}

          {phase === 3 && !done && (
            <ProgressPanel steps={steps} progress={progress} estimatedSeconds={300} />
          )}

          {done && (
            <FinalPreviewPanel
              scene="watermark"
              title={`已添加 ${items.length} 段水印`}
              sceneDesc={mode === 'floating' ? '漂浮模式 · 固定位置' : '跑马灯模式 · 从右向左滚动'}
              url={uploadedFiles[0]?.url}
              onExport={() => message.success('已发送导出任务(演示)')}
              onRedo={reset}
            />
          )}
        </Col>

        <Col span={7}>
          <div className="section-card">
            <div style={{ fontWeight: 600, marginBottom: 8 }}>实时预览</div>
            <div ref={playerWrapRef} style={{ position: 'relative' }}>
              <PreviewPlayer
                url={uploadedFiles[0]?.url}
                overlays={[
                  ...items.map(it => (
                    <div
                      key={it.id}
                      onPointerDown={e => onWmPointerDown(it.id, e)}
                      onPointerMove={onWmPointerMove}
                      onPointerUp={onWmPointerUp}
                      style={{
                        position: 'absolute',
                        left: `${it.position.xPct}%`,
                        top: `${it.position.yPct}%`,
                        transform: mode === 'marquee' ? 'translateY(-50%)' : 'translate(-50%, -50%)',
                        color: it.color,
                        fontSize: it.fontSize / 3,
                        fontWeight: 700,
                        opacity: it.opacity / 100,
                        cursor: 'move',
                        pointerEvents: 'auto',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        userSelect: 'none',
                        border: '1px dashed #6366f1',
                        padding: '2px 8px',
                        borderRadius: 4,
                        ...(mode === 'marquee' && {
                          animation: 'wm-marquee 8s linear infinite',
                          whiteSpace: 'nowrap',
                        }),
                      }}
                    >
                      {it.text}
                    </div>
                  )),
                  <style key="css">{`
                    @keyframes wm-marquee {
                      from { left: 100%; }
                      to { left: -50%; }
                    }
                  `}</style>,
                ]}
              />
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
              提示:在预览画面上拖动水印框调整位置
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Scene5Watermark;
