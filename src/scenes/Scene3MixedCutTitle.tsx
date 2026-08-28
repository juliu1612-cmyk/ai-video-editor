import { useRef, useState, useEffect } from 'react';
import { Button, Input, Slider, Row, Col, Empty, message, Select } from 'antd';
import {
  ThunderboltOutlined,
  FontSizeOutlined,
  DragOutlined,
} from '@ant-design/icons';
import VideoUploader from '../components/VideoUploader';
import PreviewPlayer from '../components/PreviewPlayer';
import ProgressPanel, { type Step } from '../components/ProgressPanel';
import TopSteps from '../components/TopSteps';
import HighlightTimeline from '../components/HighlightTimeline';
import FinalPreviewPanel from '../components/FinalPreviewPanel';
import { scriptSets } from '../mock/highlights';
import { titleStyles } from '../mock/titles';
import { useApp } from '../context/AppContext';

const presetPositions = [
  { key: 'tl', xPct: 10, yPct: 8, label: '左上' },
  { key: 'tc', xPct: 50, yPct: 8, label: '顶部居中' },
  { key: 'tr', xPct: 90, yPct: 8, label: '右上' },
  { key: 'ml', xPct: 10, yPct: 50, label: '左中' },
  { key: 'mc', xPct: 50, yPct: 50, label: '居中' },
  { key: 'mr', xPct: 90, yPct: 50, label: '右中' },
  { key: 'bl', xPct: 10, yPct: 92, label: '左下' },
  { key: 'bc', xPct: 50, yPct: 92, label: '底部居中' },
  { key: 'br', xPct: 90, yPct: 92, label: '右下' },
];

const Scene3MixedCutTitle = () => {
  const { uploadedFiles } = useApp();
  const script = scriptSets[0];
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const [title, setTitle] = useState('豪门阔太家中偷情,总裁带记者破门!');
  const [styleId, setStyleId] = useState(titleStyles[0].id);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState(titleStyles[0].color);
  const [strokeColor, setStrokeColor] = useState(titleStyles[0].stroke);
  const [shadow] = useState(true);

  const [pos, setPos] = useState({ xPct: 50, yPct: 50 });
  const [showDur, setShowDur] = useState(3);     // 展示时长(秒)
  const [startAt, setStartAt] = useState(0);    // 出现秒

  const playerWrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ active: boolean; offsetX: number; offsetY: number }>({
    active: false, offsetX: 0, offsetY: 0,
  });

  // 拖拽标题
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const rect = playerWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const curXPx = (pos.xPct / 100) * rect.width;
    const curYPx = (pos.yPct / 100) * rect.height;
    dragRef.current = {
      active: true,
      offsetX: e.clientX - rect.left - curXPx,
      offsetY: e.clientY - rect.top - curYPx,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const rect = playerWrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const xPx = e.clientX - rect.left - dragRef.current.offsetX;
    const yPx = e.clientY - rect.top - dragRef.current.offsetY;
    const newX = Math.max(0, Math.min(100, (xPx / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, (yPx / rect.height) * 100));
    setPos({ xPct: newX, yPct: newY });
  };

  const onPointerUp = () => { dragRef.current.active = false; };

  useEffect(() => {
    window.addEventListener('pointerup', onPointerUp);
    return () => window.removeEventListener('pointerup', onPointerUp);
  }, []);

  const style = titleStyles.find(s => s.id === styleId)!;

  const goAnalyze = () => {
    if (!uploadedFiles.length) return message.warning('请先上传素材');
    setPhase(2);
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 8;
      if (p >= 100) {
        p = 100; clearInterval(t);
        // 分析完成,直接开始生成
        setPhase(3);
        setProgress(0);
        let q = 0;
        const t2 = setInterval(() => {
          q += 5;
          if (q >= 100) {
            q = 100; clearInterval(t2); setDone(true); message.success('生成完成');
          }
          setProgress(q);
        }, 120);
      }
      setProgress(p);
    }, 80);
  };

  const reset = () => { setPhase(1); setProgress(0); setDone(false); };

  const steps: Step[] = [
    { key: '1', label: '理解分析', status: phase > 1 ? 'finish' : phase === 1 ? 'process' : 'wait' },
    { key: '2', label: '创意方案', status: phase > 2 ? 'finish' : phase === 2 ? 'process' : 'wait' },
    { key: '3', label: '生成视频', status: phase === 3 ? 'process' : 'wait' },
  ];

  return (
    <div>
      <TopSteps current={phase} steps={['理解分析', '创意方案', '生成视频']} />

      <Row gutter={16}>
        <Col span={7}>
          <div className="section-card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>
              <ThunderboltOutlined style={{ color: '#6366f1' }} /> 上传剧集视频
            </div>
            <VideoUploader />
          </div>

          {phase >= 2 && (
            <>
              <div className="section-card" style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>
                  <FontSizeOutlined style={{ color: '#6366f1' }} /> 引流小标题设置
                </div>

                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>标题文案</div>
                <Input.TextArea
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  rows={2}
                  placeholder="输入引流标题,如:豪门复仇太解气!"
                />

                <div style={{ fontSize: 12, color: '#6b7280', margin: '12px 0 4px' }}>样式预设</div>
                <Select
                  value={styleId}
                  onChange={(v: string) => {
                    setStyleId(v);
                    const s = titleStyles.find(x => x.id === v)!;
                    setColor(s.color);
                    setStrokeColor(s.stroke);
                    setFontSize(s.fontSize);
                  }}
                  options={titleStyles.map(s => ({ label: s.name, value: s.id }))}
                  style={{ width: '100%' }}
                />

                <div style={{ fontSize: 12, color: '#6b7280', margin: '12px 0 4px' }}>
                  字号 {fontSize}px
                </div>
                <Slider min={24} max={72} value={fontSize} onChange={setFontSize} />

                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>颜色</div>
                    <Input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ height: 36 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>描边</div>
                    <Input type="color" value={strokeColor} onChange={e => setStrokeColor(e.target.value)} style={{ height: 36 }} />
                  </div>
                </div>

                <div style={{ fontSize: 12, color: '#6b7280', margin: '12px 0 4px' }}>
                  展示时长 {showDur} 秒
                </div>
                <Slider min={1} max={15} value={showDur} onChange={setShowDur} />

                <div style={{ fontSize: 12, color: '#6b7280', margin: '12px 0 4px' }}>
                  出现时间 {startAt}s (开始于第几秒)
                </div>
                <Slider min={0} max={30} value={startAt} onChange={setStartAt} />
              </div>

              <div className="section-card">
                <div style={{ fontWeight: 600, marginBottom: 8 }}>位置预设(点击快速定位)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                  {presetPositions.map(p => (
                    <Button
                      key={p.key}
                      size="small"
                      onClick={() => setPos({ xPct: p.xPct, yPct: p.yPct })}
                      style={{
                        fontSize: 11,
                        background: Math.abs(pos.xPct - p.xPct) < 5 && Math.abs(pos.yPct - p.yPct) < 5
                          ? '#6366f1' : undefined,
                        color: Math.abs(pos.xPct - p.xPct) < 5 && Math.abs(pos.yPct - p.yPct) < 5
                          ? '#fff' : undefined,
                      }}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
                  <DragOutlined /> 或在右侧预览画面拖动标题框
                </div>
              </div>
            </>
          )}
        </Col>

        <Col span={10}>
          {phase === 1 && (
            <div className="section-card" style={{ textAlign: 'center', padding: 60 }}>
              <Empty description="先上传剧集视频,系统将自动分析剧情">
                <Button type="primary" className="gradient-btn" size="large" onClick={goAnalyze}>
                  开始理解分析
                </Button>
              </Empty>
            </div>
          )}

          {phase === 2 && (
            <ProgressPanel steps={steps} progress={progress} estimatedSeconds={180} />
          )}

          {phase === 3 && !done && (
            <ProgressPanel steps={steps} progress={progress} estimatedSeconds={900} />
          )}

          {done && (
            <FinalPreviewPanel
              scene="title"
              title={title}
              sceneDesc={`展示时长 ${showDur} 秒 · 位置 ${Math.round(pos.xPct)}%,${Math.round(pos.yPct)}%`}
              url={uploadedFiles[0]?.url}
              overlays={[
                <div
                  key="t"
                  style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <div style={{ ...style, fontSize: fontSize / 3, color, WebkitTextStroke: strokeColor !== 'transparent' ? `2px ${strokeColor}` : undefined, textShadow: shadow ? style.shadow : 'none', padding: '0 16px', textAlign: 'center' }}>
                    {title}
                  </div>
                </div>,
              ]}
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
                  <div
                    key="t-drag"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    style={{
                      position: 'absolute',
                      left: `${pos.xPct}%`,
                      top: `${pos.yPct}%`,
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'auto',
                      cursor: 'move',
                      userSelect: 'none',
                      background: shadow ? style.shadow : 'none',
                      padding: '4px 12px',
                      color,
                      WebkitTextStroke: strokeColor !== 'transparent' ? `2px ${strokeColor}` : undefined,
                      fontWeight: style.fontWeight,
                      fontSize: fontSize / 3,
                      fontFamily: style.fontFamily,
                      border: '1px dashed #6366f1',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                      maxWidth: '90%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {title || '双击编辑标题'}
                  </div>,
                ]}
              />
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
              提示:在预览上拖动标题框调整位置,使用左侧表单调整样式
            </div>
          </div>

          {phase >= 2 && (
            <div className="section-card" style={{ marginTop: 12 }}>
              <HighlightTimeline
                highlights={script.highlights}
                totalDuration={script.duration}
                selectedIds={script.highlights.map(h => h.id)}
              />
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Scene3MixedCutTitle;
