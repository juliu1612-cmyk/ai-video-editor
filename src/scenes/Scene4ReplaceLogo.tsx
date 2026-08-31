import { useEffect, useRef, useState } from 'react';
import { Button, Row, Col, message, Upload, ColorPicker } from 'antd';
import {
  PictureOutlined,
  VideoCameraOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  CloudUploadOutlined,
  SwapOutlined,
  DownloadOutlined,
  RedoOutlined,
  BgColorsOutlined,
  PlusOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import VideoUploader from '../components/VideoUploader';
import ProgressPanel, { type Step } from '../components/ProgressPanel';
import TopSteps from '../components/TopSteps';
import { useApp, sceneMeta } from '../context/AppContext';
import { downloadVideo, downloadVideosBatch } from '../utils/download';

type StepNum = 1 | 2 | 3;

interface LogoFile {
  name: string;
  url: string;
}

interface LogoBox {
  id: string; // 框唯一标识:一个视频可有多个红框(手动添加/删除)
  fileId: string;
  fileName: string;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

const Scene4ReplaceLogo = () => {
  const { uploadedFiles, addGeneratedVideo, setNav } = useApp();
  const [step, setStep] = useState<StepNum>(1);

  // 新 Logo 图片:组件内部状态,不进入源素材列表
  const [logoFile, setLogoFile] = useState<LogoFile | null>(null);

  // 遮挡色块颜色(全局):未上传新 Logo 时,红框区域以该色块盖住原 Logo
  const [blockColor, setBlockColor] = useState('#000000');

  // Step2 内部状态
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzed, setAnalyzed] = useState(false);

  // 每个视频的 Logo 区域(一个视频可有多个框,支持手动添加/删除)
  const [logoBoxes, setLogoBoxes] = useState<LogoBox[]>([]);

  const updateLogoBox = (id: string, patch: Partial<LogoBox>) => {
    setLogoBoxes(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b));
  };

  // 手动添加红框:默认大小 14x10,按该视频已有框数错开位置避免完全重叠
  const addLogoBox = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;
    setLogoBoxes(prev => {
      const count = prev.filter(b => b.fileId === fileId).length;
      const offset = (count % 4) * 7;
      return [
        ...prev,
        {
          id: `${fileId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fileId,
          fileName: file.name,
          xPct: Math.min(38 + offset, 100 - 14),
          yPct: Math.min(40 + offset, 100 - 10),
          wPct: 14,
          hPct: 10,
        },
      ];
    });
    message.success('已添加红框');
  };

  // 删除指定红框
  const removeLogoBox = (id: string) => {
    setLogoBoxes(prev => prev.filter(b => b.id !== id));
  };

  // Step3 内部状态
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [done, setDone] = useState(false);

  // 生成完成:把每个成片入库(context 内置 5 秒同标题+URL 去重,防 StrictMode 双挂载)
  useEffect(() => {
    if (!done) return;
    const meta = sceneMeta['replace-logo'];
    uploadedFiles.forEach(f => {
      addGeneratedVideo({
        title: `${f.name}(去Logo)`,
        scene: 'replace-logo',
        sceneLabel: meta.label,
        url: f.url,
        cover: meta.cover,
        maker: '我',
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const hasOrigin = uploadedFiles.length > 0;
  const hasLogo = logoFile !== null;

  const goStep2 = () => {
    if (!hasOrigin) return message.warning('请先上传原素材视频');
    setStep(2);
    setAnalyzed(false);
    setAnalyzeProgress(0);
    setAnalyzing(true);
    let p = 0;
    const t = setInterval(() => {
      p += 7;
      if (p >= 100) {
        p = 100;
        clearInterval(t);
        // 分析完成后,为每个视频初始化一组默认 Logo 位置(供用户调整/增删)
        setLogoBoxes(prev => {
          if (prev.length > 0) return prev;
          return uploadedFiles.map((f, i) => {
            const seed = (i + 1) * 7;
            return {
              id: `${f.id}-auto`,
              fileId: f.id,
              fileName: f.name,
              xPct: 70 + (seed % 20),
              yPct: 8 + (seed % 12),
              wPct: 14,
              hPct: 10,
            };
          });
        });
        setAnalyzing(false);
        setAnalyzed(true);
        message.success('识别完成');
      }
      setAnalyzeProgress(p);
    }, 90);
  };

  const goStep3 = () => {
    if (logoBoxes.length === 0) return message.warning('请至少保留一个 Logo 识别框,可点击视频卡片下方「添加红框」');
    setStep(3);
    setDone(false);
    setGenProgress(0);
    setGenerating(true);
    let p = 0;
    const t = setInterval(() => {
      p += 5;
      if (p >= 100) {
        p = 100;
        clearInterval(t);
        setGenerating(false);
        setDone(true);
        message.success('生成完成');
      }
      setGenProgress(p);
    }, 120);
  };

  const restart = () => {
    setStep(1);
    setDone(false);
    setAnalyzed(false);
    setGenProgress(0);
    setAnalyzeProgress(0);
  };

  const progressSteps: Step[] = [
    { key: '1', label: '上传素材', status: step > 1 ? 'finish' : 'process' },
    { key: '2', label: '识别 Logo', status: step > 1 ? 'finish' : step === 2 ? 'process' : 'wait' },
  ];

  const footer = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: 24,
        paddingTop: 16,
        borderTop: '1px solid #f3f4f6',
      }}
    >
      {step === 1 && (
        <Button type="primary" className="gradient-btn" size="large" onClick={goStep2}>
          开始识别 <ArrowRightOutlined />
        </Button>
      )}
      {step === 2 && analyzed && (
        <Button type="primary" className="gradient-btn" size="large" onClick={goStep3}>
          生成视频 <ArrowRightOutlined />
        </Button>
      )}
      {step === 2 && !analyzed && <span />}
      {step === 3 && <span />}
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <TopSteps current={step} steps={['上传素材', '识别 Logo', '生成视频']} />

      {/* ============ 第一步:上传素材 ============ */}
      {step === 1 && (
        <div className="section-card" style={{ padding: 28 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              上传原素材,完成后开始识别
            </div>
            <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 6 }}>
              原素材视频必填;新 Logo 图片选填,可在识别后再上传替换
            </div>
          </div>

          <Row gutter={[16, 16]}>
            {/* 原素材 */}
            <Col xs={24} md={12}>
              <div
                style={{
                  border: `2px solid ${hasOrigin ? '#10b981' : '#e5e7eb'}`,
                  borderRadius: 14,
                  padding: 16,
                  height: '100%',
                  position: 'relative',
                }}
              >
                {hasOrigin && (
                  <CheckCircleFilled
                    style={{ position: 'absolute', top: 10, right: 10, color: '#10b981', fontSize: 16 }}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <VideoCameraOutlined style={{ color: '#6366f1', fontSize: 18 }} />
                  <strong>① 原素材视频</strong>
                  <span style={{ fontSize: 11, color: '#ef4444' }}>必填</span>
                </div>
                <VideoUploader
                  multiple
                  title="上传视频(可多选)"
                  desc="支持批量上传多个视频,mp4/mov,单个≤2G"
                  showCloudBtn={false}
                />
              </div>
            </Col>

            {/* 新 Logo */}
            <Col xs={24} md={12}>
              <div
                style={{
                  border: `2px solid ${hasLogo ? '#10b981' : '#e5e7eb'}`,
                  borderRadius: 14,
                  padding: 16,
                  height: '100%',
                  position: 'relative',
                }}
              >
                {hasLogo && (
                  <CheckCircleFilled
                    style={{ position: 'absolute', top: 10, right: 10, color: '#10b981', fontSize: 16 }}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <PictureOutlined style={{ color: '#f59e0b', fontSize: 18 }} />
                  <strong>② 新 Logo 图片</strong>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>选填</span>
                </div>
                {logoFile ? (
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: 12, background: '#fafafa',
                      border: '1px dashed #d1d5db', borderRadius: 12,
                    }}
                  >
                    <img
                      src={logoFile.url}
                      alt={logoFile.name}
                      style={{ width: 48, height: 48, objectFit: 'contain', borderRadius: 6, background: '#fff' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13, fontWeight: 500,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}
                      >
                        {logoFile.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>已就绪</div>
                    </div>
                    <Button
                      size="small"
                      type="text"
                      danger
                      onClick={() => setLogoFile(null)}
                    >
                      移除
                    </Button>
                  </div>
                ) : (
                  <Upload.Dragger
                    beforeUpload={file => {
                      setLogoFile({ name: file.name, url: URL.createObjectURL(file) });
                      message.success(`已上传 ${file.name}`);
                      return false;
                    }}
                    showUploadList={false}
                    accept="image/*"
                    style={{ borderRadius: 12, background: '#fafafa' }}
                  >
                    <CloudUploadOutlined style={{ fontSize: 28, color: '#f59e0b' }} />
                    <div style={{ marginTop: 8, fontSize: 13 }}>点击/拖拽上传</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                      PNG(推荐透明底)/JPG · 选填,可跳过
                    </div>
                  </Upload.Dragger>
                )}
              </div>
            </Col>
          </Row>

          {footer}
        </div>
      )}

      {/* ============ 第二步:识别 Logo ============ */}
      {step === 2 && (
        <div className="section-card" style={{ padding: 28 }}>
          {analyzing && (
            <div style={{ padding: 40 }}>
              <ProgressPanel
                steps={progressSteps}
                progress={analyzeProgress}
                estimatedSeconds={60}
              />
            </div>
          )}

          {analyzed && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  <CheckCircleFilled style={{ color: '#10b981', marginRight: 8 }} />
                  识别完成,可调整、添加或删除红框
                </div>
                <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 6 }}>
                  共 {uploadedFiles.length} 个视频,支持播放预览;拖动红框调整遮挡区域,点击「添加红框」新增,点击红框右上角 × 删除;红框内以色块盖住原 Logo,新 Logo 叠加在色块上方
                </div>
              </div>

              {/* 顶部全局操作:新 Logo + 遮挡色块(影响所有视频) */}
              <GlobalLogoBar
                logoFile={logoFile}
                onChange={setLogoFile}
                blockColor={blockColor}
                onBlockColorChange={setBlockColor}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                    {uploadedFiles.map(file => {
                      // 该视频当前的所有红框(识别默认生成,可手动增删)
                      const boxes = logoBoxes.filter(b => b.fileId === file.id);
                      return (
                        <div
                          key={file.id}
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: 10,
                            overflow: 'hidden',
                            background: '#f9fafb',
                          }}
                        >
                          <div
                            style={{
                              position: 'relative',
                              width: '100%',
                              paddingBottom: ' 177.7%',
                              background: '#000',
                            }}
                          >
                            <video
                              src={file.url}
                              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                              controls
                              preload="metadata"
                              playsInline
                            />
                            {/* 每视频可挂多个 Logo 框:拖动改位置、拖角改大小,右上角删除 */}
                            {boxes.map((box, idx) => (
                              <LogoBoxOverlay
                                key={box.id}
                                box={box}
                                index={idx}
                                logoUrl={logoFile?.url}
                                blockColor={blockColor}
                                onChange={next => updateLogoBox(box.id, next)}
                                onRemove={() => removeLogoBox(box.id)}
                              />
                            ))}
                            {/* 该视频红框被全部删除时的提示 */}
                            {boxes.length === 0 && (
                              <div
                                style={{
                                  position: 'absolute', inset: 0,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  pointerEvents: 'none',
                                }}
                              >
                                <span
                                  style={{
                                    color: '#fff', background: 'rgba(0,0,0,0.55)',
                                    padding: '4px 12px', borderRadius: 6, fontSize: 11,
                                  }}
                                >
                                  暂无识别框,点击下方「添加红框」
                                </span>
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              padding: '8px 12px',
                              fontSize: 12,
                              color: '#374151',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                flex: 1,
                              }}
                              title={file.name}
                            >
                              {file.name}
                            </span>
                            <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>
                              {boxes.length} 个红框
                            </span>
                            <Button
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() => addLogoBox(file.id)}
                              style={{ flexShrink: 0 }}
                            >
                              添加红框
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
            </div>
          )}

          {footer}
        </div>
      )}

      {/* ============ 第三步:生成视频 ============ */}
      {step === 3 && (
        <div className="section-card" style={{ padding: 28 }}>
          {generating && (
            <div style={{ padding: 40 }}>
              <ProgressPanel steps={progressSteps} progress={genProgress} estimatedSeconds={480} />
            </div>
          )}

          {done && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  <CheckCircleFilled style={{ color: '#10b981', marginRight: 8 }} />
                  Logo 已替换,生成 {uploadedFiles.length} 个成片
                </div>
                <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 6 }}>
                  每个源视频对应一个成片,可播放预览、单独下载,或批量下载全部
                </div>
              </div>

              {/* 工具栏:批量下载 / 重新制作 / 查看成片列表 */}
              <div
                style={{
                  display: 'flex', justifyContent: 'center', gap: 10,
                  flexWrap: 'wrap', marginBottom: 20,
                }}
              >
                <Button
                  type="primary"
                  className="gradient-btn"
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    downloadVideosBatch(
                      uploadedFiles.map(f => ({ url: f.url, title: `${f.name}(去Logo)` }))
                    )
                  }
                >
                  批量下载全部({uploadedFiles.length})
                </Button>
                <Button icon={<RedoOutlined />} onClick={restart}>重新制作</Button>
                <Button type="link" icon={<VideoCameraOutlined />} onClick={() => setNav('videos')}>
                  查看成片列表
                </Button>
              </div>

              {/* 成片网格:每个源视频一个成片卡 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
                {uploadedFiles.map(f => {
                  const vTitle = `${f.name}(去Logo)`;
                  return (
                    <div
                      key={f.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: 10,
                        overflow: 'hidden',
                        background: '#f9fafb',
                      }}
                    >
                      <div
                        style={{
                          position: 'relative', width: '100%',
                          paddingBottom: '56.25%', background: '#000',
                        }}
                      >
                        <video
                          src={f.url}
                          controls
                          preload="metadata"
                          playsInline
                          style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%', objectFit: 'contain',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          padding: '10px 12px',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                      >
                        <span
                          style={{
                            flex: 1, minWidth: 0,
                            fontSize: 12.5, color: '#374151',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}
                          title={vTitle}
                        >
                          {vTitle}
                        </span>
                        <Button
                          size="small"
                          type="primary"
                          icon={<DownloadOutlined />}
                          onClick={() => downloadVideo(f.url, vTitle)}
                        >
                          下载
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {footer}
        </div>
      )}
    </div>
  );
};

/**
 * 单个视频上的 Logo 框:可整体拖动改位置,右下角控制柄可改大小,右上角 × 删除;
 * 框内始终以全局色块盖住原 Logo,新 Logo(若上传)叠加在色块上方
 */
const LogoBoxOverlay = ({
  box, index, logoUrl, blockColor, onChange, onRemove,
}: {
  box: LogoBox;
  index: number;
  logoUrl?: string | null;
  blockColor?: string;
  onChange: (next: Partial<LogoBox>) => void;
  onRemove: () => void;
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  type Mode = 'move' | 'resize-br' | null;
  const modeRef = useRef<Mode>(null);
  const startRef = useRef<{ x: number; y: number; xPct: number; yPct: number; wPct: number; hPct: number }>(
    { x: 0, y: 0, xPct: 0, yPct: 0, wPct: 0, hPct: 0 }
  );

  const onPointerDown = (mode: Mode) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    modeRef.current = mode;
    startRef.current = {
      x: e.clientX, y: e.clientY,
      xPct: box.xPct, yPct: box.yPct, wPct: box.wPct, hPct: box.hPct,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!modeRef.current) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dxPct = ((e.clientX - startRef.current.x) / rect.width) * 100;
    const dyPct = ((e.clientY - startRef.current.y) / rect.height) * 100;

    if (modeRef.current === 'move') {
      onChange({
        xPct: clamp(startRef.current.xPct + dxPct, 0, 100 - startRef.current.wPct),
        yPct: clamp(startRef.current.yPct + dyPct, 0, 100 - startRef.current.hPct),
      });
    } else if (modeRef.current === 'resize-br') {
      onChange({
        wPct: clamp(startRef.current.wPct + dxPct, 4, 100 - startRef.current.xPct),
        hPct: clamp(startRef.current.hPct + dyPct, 4, 100 - startRef.current.yPct),
      });
    }
  };

  const onPointerUp = () => { modeRef.current = null; };

  return (
    <div
      ref={wrapRef}
      // pointerEvents: none 让空白区域点击穿透到视频控制条;
      // 红框自身恢复 auto,拖拽/缩放不受影响
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        onPointerDown={onPointerDown('move')}
        style={{
          position: 'absolute',
          pointerEvents: 'auto',
          left: `${box.xPct}%`,
          top: `${box.yPct}%`,
          width: `${box.wPct}%`,
          height: `${box.hPct}%`,
          border: '2px solid #ef4444',
          background: 'rgba(239,68,68,0.10)',
          cursor: 'move',
          borderRadius: 2,
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* 色块:始终渲染,盖住原 Logo;新 Logo(若有)叠加在色块上方 */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: blockColor ?? '#000000',
            pointerEvents: 'none',
          }}
        />
        {logoUrl && (
          <img
            src={logoUrl}
            alt="新 Logo"
            draggable={false}
            style={{
              position: 'relative', zIndex: 1,
              maxWidth: '100%', maxHeight: '100%',
              width: '100%', height: '100%',
              objectFit: 'contain',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )}
        {/* 尺寸手柄 */}
        <div
          onPointerDown={onPointerDown('resize-br')}
          style={{
            position: 'absolute',
            right: -5, bottom: -5,
            width: 10, height: 10,
            background: '#fff',
            border: '2px solid #ef4444',
            borderRadius: 2,
            cursor: 'nwse-resize',
          }}
        />
        {/* 删除按钮(右上角):stopPropagation 避免触发拖动 */}
        <div
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onRemove(); }}
          title="删除该红框"
          style={{
            position: 'absolute',
            top: -9, right: -9,
            width: 18, height: 18,
            background: '#ef4444',
            color: '#fff',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
            zIndex: 2,
          }}
        >
          <CloseOutlined style={{ fontSize: 10 }} />
        </div>
        <div
          style={{
            position: 'absolute', top: -20, left: 0,
            background: '#ef4444', color: '#fff',
            fontSize: 10, padding: '1px 6px', borderRadius: 3,
            whiteSpace: 'nowrap', pointerEvents: 'none',
          }}
        >
          Logo {index + 1}
        </div>
      </div>
    </div>
  );
};

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/**
 * 全局设置栏:放在识别完成后的页面顶部
 * - 行 1:全局新 Logo(上传后红框内展示新 Logo)
 * - 行 2:遮挡色块颜色(未上传新 Logo 时,红框内以色块盖住原 Logo)
 */
const GlobalLogoBar = ({
  logoFile, onChange, blockColor, onBlockColorChange,
}: {
  logoFile: LogoFile | null;
  onChange: (f: LogoFile | null) => void;
  blockColor: string;
  onBlockColorChange: (c: string) => void;
}) => {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: 0,
        marginBottom: 16,
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* 行 1:全局新 Logo */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <SwapOutlined style={{ color: '#f59e0b', fontSize: 18 }} />
        <strong style={{ fontSize: 13 }}>全局新 Logo</strong>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>上传后红框内以新 Logo 替换,所有视频同步更新</span>

        <div style={{ flex: 1 }} />

        {logoFile ? (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '4px 10px', background: '#fafafa',
              border: '1px dashed #d1d5db', borderRadius: 8,
            }}
          >
            <img
              src={logoFile.url}
              alt={logoFile.name}
              style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4, background: '#fff' }}
            />
            <div style={{ fontSize: 12, color: '#374151', maxWidth: 160,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              title={logoFile.name}
            >
              {logoFile.name}
            </div>
            <Button size="small" type="text" danger onClick={() => onChange(null)}>
              移除
            </Button>
          </div>
        ) : (
          <Upload.Dragger
            beforeUpload={file => {
              onChange({ name: file.name, url: URL.createObjectURL(file) });
              message.success(`已上传 ${file.name}`);
              return false;
            }}
            showUploadList={false}
            accept="image/*"
            style={{ width: 220, padding: '6px 10px', borderRadius: 8 }}
          >
            <CloudUploadOutlined style={{ fontSize: 18, color: '#f59e0b', marginRight: 6 }} />
            <span style={{ fontSize: 12.5 }}>点击上传新 Logo</span>
          </Upload.Dragger>
        )}
      </div>

      {/* 行 2:遮挡色块颜色(全局) */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px',
          background: '#fafafa',
        }}
      >
        <BgColorsOutlined style={{ color: '#6366f1', fontSize: 18 }} />
        <strong style={{ fontSize: 13 }}>遮挡色块颜色</strong>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          色块始终盖住原 Logo,新 Logo 将叠加在色块上方(全局生效)
        </span>

        <div style={{ flex: 1 }} />

        <ColorPicker
          value={blockColor}
          onChange={(_, hex) => onBlockColorChange(hex)}
          size="small"
          presets={[
            {
              label: '常用色',
              colors: [
                '#000000', '#111827', '#1f2937', '#374151',
                '#6b7280', '#9ca3af', '#d1d5db', '#ffffff',
              ],
            },
          ]}
        />
        <span
          style={{
            fontSize: 11.5, color: '#6b7280',
            fontFamily: 'monospace', minWidth: 64,
          }}
        >
          {blockColor.toUpperCase()}
        </span>
      </div>
    </div>
  );
};

export default Scene4ReplaceLogo;
