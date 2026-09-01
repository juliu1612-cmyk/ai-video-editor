import { useMemo, useState } from 'react';
import { Button, Tag, Row, Col, message, Card, Divider, Select, Skeleton } from 'antd';
import {
  ThunderboltOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  VideoCameraOutlined,
  SettingOutlined,
  LoadingOutlined,
  ApiOutlined,
  FileTextOutlined,
  TagsOutlined,
  StarFilled,
  BulbOutlined,
} from '@ant-design/icons';
import VideoUploader from '../components/VideoUploader';
import HighlightTimeline from '../components/HighlightTimeline';
import PreviewPlayer from '../components/PreviewPlayer';
import ProgressPanel, { type Step } from '../components/ProgressPanel';
import TopSteps from '../components/TopSteps';
import ScriptPlanCard from '../components/ScriptPlanCard';
import FinalPreviewPanel from '../components/FinalPreviewPanel';
import { scriptSets, type ScriptSet } from '../mock/highlights';
import { useApp } from '../context/AppContext';

// 四个状态页:上传 → 分析 → 创意方案 → 生成
// 顶部的 TopSteps 始终按 3 个语义步骤渲染(理解分析/创意方案/生成解说视频)
const Phase = {
  Upload: 1,
  Analyze: 2,
  Plans: 3,
  Generate: 4,
} as const;
type PhaseValue = (typeof Phase)[keyof typeof Phase];

// 分析完成后,基于当前剧集高光片段扩展为 10 条卖点(参考图)
const buildSellingPoints = (s: ScriptSet): string[] => {
  const points: string[] = [];
  s.highlights.forEach(h => {
    points.push(h.desc);
  });
  // 高光不足 10 条时,用情感类型 + 高光类型组合补足
  let i = 0;
  while (points.length < 10) {
    const emo = s.emotionTypes[i % s.emotionTypes.length]?.name ?? '强冲突';
    const t = s.highlights[i % s.highlights.length]?.type ?? '钩子';
    points.push(`${emo}驱动的「${t}」高光,极具话题传播度`);
    i++;
  }
  return points.slice(0, 10);
};

// ---------- 第一页:混剪配置 ----------
interface MixConfig {
  originLang: string;   // 原视频语言
  narratorLang: string; // 解说语言
  voice: string;        // 音色
  duration: number;     // 生产视频时长(秒)
}

const originLangOptions = [
  { label: '中文', value: '中文' },
  { label: '粤语', value: '粤语' },
  { label: '英文', value: '英文' },
  { label: '日文', value: '日文' },
  { label: '韩文', value: '韩文' },
  { label: '泰语', value: '泰语' },
];

const narratorLangOptions = [
  { label: '中文', value: '中文' },
  { label: '英文', value: '英文' },
  { label: '日文', value: '日文' },
  { label: '韩文', value: '韩文' },
  { label: '西班牙文', value: '西班牙文' },
];

const voiceOptions = [
  { label: '知性女声', value: '知性女声' },
  { label: '磁性男声', value: '磁性男声' },
  { label: '活泼甜音', value: '活泼甜音' },
  { label: '沉稳大叔音', value: '沉稳大叔音' },
  { label: '旁白主播音', value: '旁白主播音' },
];

const durationOptions = [
  { label: '1 分钟', value: 60 },
  { label: '3 分钟', value: 180 },
  { label: '5 分钟', value: 300 },
  { label: '10 分钟', value: 600 },
];

const defaultConfig: MixConfig = {
  originLang: '中文',
  narratorLang: '中文',
  voice: '知性女声',
  duration: 180,
};

const Scene1MixedCut = () => {
  const { uploadedFiles } = useApp();
  const [phase, setPhase] = useState<PhaseValue>(1);

  // 第一页:理解分析进度(由独立分析页使用)
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzed, setAnalyzed] = useState(false);

  // 第一页:混剪配置(原视频语言/解说语言/音色/生产视频时长)
  const [config, setConfig] = useState<MixConfig>(defaultConfig);

  // 第二页:创意方案选择
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(scriptSets[0].id);
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);

  // 第三页:生成状态
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [done, setDone] = useState(false);

  const script = useMemo(
    () => scriptSets.find(s => s.id === selectedScriptId) ?? scriptSets[0],
    [selectedScriptId]
  );

  const toggleHighlight = (id: string) => {
    setSelectedHighlights(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // 第一页:点击「开始理解分析」→ 跳到独立分析页(Phase.Analyze),
  // 分析动画在分析页内完成,完成 100% 后停留 900ms 让用户看清完成态,再自动跳到 Phase.Plans
  const runAnalyze = () => {
    if (!uploadedFiles.length) return message.warning('请先上传素材');
    setAnalyzed(false);
    setAnalyzeProgress(0);
    setSelectedHighlights(script.highlights.map(h => h.id));
    setPhase(Phase.Analyze);
    let p = 0;
    const t = setInterval(() => {
      p += 2 + Math.random() * 3; // 节奏更慢,给用户看清骨架动画
      if (p >= 100) {
        p = 100;
        clearInterval(t);
        setAnalyzeProgress(100);
        setAnalyzed(true);
        message.success('剧情分析完成,自动进入创意方案');
        setTimeout(() => setPhase(Phase.Plans), 900);
      } else {
        setAnalyzeProgress(p);
      }
    }, 140);
  };

  // 创意方案 → 生成:开始生成解说视频
  const runGenerate = () => {
    setPhase(Phase.Generate);
    setGenerating(true);
    setGenProgress(0);
    setDone(false);
    let p = 0;
    const t = setInterval(() => {
      p += 4 + Math.random() * 6;
      if (p >= 100) {
        p = 100;
        clearInterval(t);
        setGenerating(false);
        setDone(true);
        message.success('生成完成');
      }
      setGenProgress(p);
    }, 140);
  };

  // 完成后重新制作:回到第一页并清空
  const reset = () => {
    setPhase(Phase.Upload);
    setAnalyzed(false);
    setAnalyzeProgress(0);
    setGenerating(false);
    setGenProgress(0);
    setDone(false);
    setSelectedHighlights([]);
  };

  // TopSteps 步骤状态(始终按 3 个语义步骤渲染)
  const topCurrent =
    phase === Phase.Upload ? 1 :
    phase === Phase.Analyze ? 1 :
    phase === Phase.Plans ? 2 :
    3;
  const topSteps: Step[] = [
    { key: '1', label: '理解分析', status: phase === Phase.Upload || phase === Phase.Analyze ? (analyzed ? 'finish' : 'process') : 'finish' },
    { key: '2', label: '创意方案', status: phase === Phase.Plans ? 'process' : phase === Phase.Generate ? 'finish' : 'wait' },
    { key: '3', label: '生成解说视频', status: phase === Phase.Generate ? 'process' : 'wait' },
  ];

  // 页脚按钮(与替换 Logo 场景同款风格)
  const footer = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 16,
        borderTop: '1px solid #f3f4f6',
      }}
    >
      {phase === Phase.Upload && (
        <>
          <span />
          <Button
            type="primary"
            className="gradient-btn"
            size="large"
            disabled={!uploadedFiles.length}
            onClick={runAnalyze}
          >
            开始理解分析 <ArrowRightOutlined />
          </Button>
        </>
      )}
      {phase === Phase.Plans && (
        <>
          <Button icon={<ArrowLeftOutlined />} onClick={() => setPhase(Phase.Upload)}>
            上一步
          </Button>
          <Button type="primary" className="gradient-btn" size="large" onClick={runGenerate}>
            生成解说视频 <ArrowRightOutlined />
          </Button>
        </>
      )}
      {phase === Phase.Generate && <span />}
      {phase === Phase.Analyze && <span />}
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <TopSteps
        current={topCurrent}
        steps={['理解分析', '创意方案', '生成解说视频']}
      />

      {/* ============ 第一页:上传素材 + 混剪配置 + 理解分析 ============ */}
      {phase === 1 && (
        <div className="section-card" style={{ padding: 28 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              <ThunderboltOutlined style={{ color: '#6366f1', marginRight: 8 }} />
              上传剧集视频,完成后开始理解分析
            </div>
            <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 6 }}>
              左侧上传视频素材(可多个);右侧设置原视频语言、解说语言、音色与生产视频时长
            </div>
          </div>

          <Row gutter={16}>
            {/* 左:上传视频素材 */}
            <Col xs={24} md={12}>
              <div
                style={{
                  border: `2px solid ${uploadedFiles.length ? '#10b981' : '#e5e7eb'}`,
                  borderRadius: 14,
                  padding: 16,
                  height: '100%',
                  position: 'relative',
                }}
              >
                {uploadedFiles.length > 0 && (
                  <CheckCircleFilled
                    style={{ position: 'absolute', top: 10, right: 10, color: '#10b981', fontSize: 16 }}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <VideoCameraOutlined style={{ color: '#6366f1', fontSize: 18 }} />
                  <strong>① 视频素材</strong>
                  <span style={{ fontSize: 11, color: '#ef4444' }}>必填</span>
                </div>
                <VideoUploader
                  multiple
                  title="上传视频素材(可多选)"
                  desc="支持批量上传多个视频,mp4/mov,单个≤2G"
                />
              </div>
            </Col>

            {/* 右:混剪配置 */}
            <Col xs={24} md={12}>
              <div
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: 14,
                  padding: 16,
                  height: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <SettingOutlined style={{ color: '#f59e0b', fontSize: 18 }} />
                  <strong>② 混剪配置</strong>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>影响解说生成</span>
                </div>
                <Row gutter={[12, 14]}>
                  <Col span={12}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>原视频语言</div>
                    <Select
                      value={config.originLang}
                      options={originLangOptions}
                      onChange={v => setConfig(c => ({ ...c, originLang: v }))}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>解说语言</div>
                    <Select
                      value={config.narratorLang}
                      options={narratorLangOptions}
                      onChange={v => setConfig(c => ({ ...c, narratorLang: v }))}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>解说音色</div>
                    <Select
                      value={config.voice}
                      options={voiceOptions}
                      onChange={v => setConfig(c => ({ ...c, voice: v }))}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>生产视频时长</div>
                    <Select
                      value={config.duration}
                      options={durationOptions}
                      onChange={v => setConfig(c => ({ ...c, duration: v }))}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          {footer}
        </div>
      )}

      {/* ============ 分析页(参考图风格):原片缩略图 + 进度行 + 4 个分析子卡 ============ */}
      {phase === Phase.Analyze && (
        <AnalyzePage
          fileName={uploadedFiles[0]?.name ?? '原片 剧集'}
          cover={uploadedFiles[0]?.cover}
          duration={uploadedFiles[0]?.duration ?? 0}
          progress={analyzeProgress}
          script={script}
          done={analyzed}
        />
      )}

      {/* ============ 第三页:创意方案 ============ */}
      {phase === Phase.Plans && (
        <div className="section-card" style={{ padding: 28 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              <CheckCircleFilled style={{ color: '#10b981', marginRight: 8 }} />
              理解分析完成,请选择创意方案
            </div>
            <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 6 }}>
              共 {scriptSets.length} 个方案;选择后可在时间轴上勾选/取消高光片段
            </div>
          </div>

          <Row gutter={16}>
            {/* 左:分析结果 + 预览 */}
            <Col span={8}>
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 10 }}>剧集类型</div>
                <Tag color="purple">都市 / 复仇 / 爽剧</Tag>
                <div style={{ marginTop: 10, fontSize: 12.5, color: '#374151', lineHeight: 1.6 }}>
                  {script.summary}
                </div>
                <Divider style={{ margin: '12px 0 10px' }} />
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  情感类型 <span style={{ color: '#6366f1' }}>{script.emotionTypes.length}</span>
                </div>
                <Row gutter={[8, 8]}>
                  {script.emotionTypes.map(e => (
                    <Col span={12} key={e.name}>
                      <div
                        style={{
                          padding: 10, background: '#fff', borderRadius: 8,
                          fontSize: 12, height: '100%', border: '1px solid #f3f4f6',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{e.name}</div>
                        <div style={{ color: '#6b7280', lineHeight: 1.5 }}>{e.desc}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>

              <Card title="预览" size="small">
                <PreviewPlayer url={uploadedFiles[0]?.url} />
              </Card>
            </Col>

            {/* 右:创意方案 + 高光时间轴 */}
            <Col span={16}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>
                创意方案 <span style={{ color: '#6366f1' }}>{scriptSets.length}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                {scriptSets.map(s => (
                  <div key={s.id} style={{ minWidth: 280, maxWidth: 280 }}>
                    <ScriptPlanCard
                      title={s.title}
                      highlights={s.highlights}
                      totalDuration={s.duration}
                      selected={selectedScriptId === s.id}
                      onSelect={() => setSelectedScriptId(s.id)}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>高光片段</div>
                <HighlightTimeline
                  highlights={script.highlights}
                  totalDuration={script.duration}
                  selectedIds={selectedHighlights}
                  onToggle={toggleHighlight}
                />
              </div>
            </Col>
          </Row>

          {footer}
        </div>
      )}

      {/* ============ 第四页:生成解说视频 ============ */}
      {phase === Phase.Generate && (
        <div className="section-card" style={{ padding: 28 }}>
          {generating && (
            <div style={{ padding: 40 }}>
              <ProgressPanel
                steps={topSteps}
                progress={genProgress}
                estimatedSeconds={Math.round(config.duration * 2.4)}
              />
            </div>
          )}

          {done && (
            <FinalPreviewPanel
              scene="mixed-cut"
              title={script.title}
              sceneDesc="AI 已自动识别剧情高光并混剪"
              url={uploadedFiles[0]?.url}
              onExport={() => message.success('已发送导出任务(演示)')}
              onRedo={reset}
            />
          )}

          {footer}
        </div>
      )}
    </div>
  );
};

/**
 * 独立分析页(参考图风格):
 * - 顶部:原片 剧集 N + 视频缩略图(显示文件名 + 时长)
 * - 进度行:分析中 "AI 正在逐集分析剧情,已完成 X%,预计还需 N 分钟";
 *         分析完成 "剧情分析完成"(绿色对勾)
 * - 4 个分析子卡(白底圆角边框):
 *   1) 剧集类型   2) 剧情概览   3) 情感类型 N(2x2)   4) 卖点内容 10(编号列表)
 *   - 分析中:渲染骨架条(Skeleton)
 *   - 完成:渲染真实内容
 */
const AnalyzePage = ({
  fileName,
  cover,
  duration,
  progress,
  script,
  done,
}: {
  fileName: string;
  cover?: string;
  duration: number;
  progress: number;
  script: ScriptSet;
  done: boolean;
}) => {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  // 预计还需 N 分钟:总耗时约 5 分钟(模拟),根据当前进度反算剩余
  const totalSeconds = 300;
  const remainSec = done ? 0 : Math.max(1, Math.round(totalSeconds * (1 - progress / 100)));
  const remainMin = Math.max(1, Math.ceil(remainSec / 60));
  const sellingPoints = useMemo(() => buildSellingPoints(script), [script]);

  return (
    <div className="section-card" style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      {/* 顶部:原片 剧集 1 + 缩略图 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <FileTextOutlined style={{ color: '#6366f1', fontSize: 16 }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>原片 剧集 1</span>
      </div>
      <div
        style={{
          position: 'relative',
          width: 88,
          height: 56,
          borderRadius: 6,
          background: cover || 'linear-gradient(135deg, #6366f1, #a855f7)',
          overflow: 'hidden',
          marginBottom: 18,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            padding: '2px 6px',
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            fontSize: 11,
            fontFamily: 'monospace',
            borderTopRightRadius: 6,
          }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {fileName}
      </div>

      {/* 进度行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <BulbOutlined style={{ color: '#6366f1', fontSize: 16 }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>剧情分析</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12.5,
          color: done ? '#10b981' : '#6366f1',
          marginBottom: 20,
        }}
      >
        {done ? (
          <CheckCircleFilled style={{ color: '#10b981' }} />
        ) : (
          <LoadingOutlined />
        )}
        {done
          ? '剧情分析完成'
          : `AI 正在逐集分析剧情,已完成 ${progress.toFixed(0)}%,预计还需 ${remainMin} 分钟`}
      </div>

      {/* 4 个分析子卡 */}
      <AnalyzeCard icon={<TagsOutlined />} title="剧集类型">
        {done ? (
          <Tag color="purple" style={{ marginTop: 4 }}>
            都市 / 复仇 / 爽剧
          </Tag>
        ) : (
          <Skeleton.Input active size="small" style={{ width: 220, marginTop: 8 }} />
        )}
      </AnalyzeCard>

      <AnalyzeCard icon={<FileTextOutlined />} title="剧情概览">
        {done ? (
          <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.7, marginTop: 4 }}>
            {script.summary}
          </div>
        ) : (
          <div style={{ marginTop: 4 }}>
            <Skeleton active paragraph={{ rows: 3 }} title={false} />
          </div>
        )}
      </AnalyzeCard>

      <AnalyzeCard
        icon={<ApiOutlined />}
        title={`情感类型 ${done ? script.emotionTypes.length : ''}`}
      >
        {done ? (
          <Row gutter={[10, 10]} style={{ marginTop: 4 }}>
            {script.emotionTypes.map(e => (
              <Col span={12} key={e.name}>
                <div
                  style={{
                    padding: 10,
                    background: '#f9fafb',
                    borderRadius: 8,
                    fontSize: 12,
                    height: '100%',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{e.name}</div>
                  <div style={{ color: '#6b7280', lineHeight: 1.55 }}>{e.desc}</div>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Skeleton.Input active size="small" style={{ height: 60 }} />
            <Skeleton.Input active size="small" style={{ height: 60 }} />
            <Skeleton.Input active size="small" style={{ height: 60 }} />
            <Skeleton.Input active size="small" style={{ height: 60 }} />
          </div>
        )}
      </AnalyzeCard>

      <AnalyzeCard
        icon={<StarFilled style={{ color: '#f59e0b' }} />}
        title={`卖点内容 ${done ? sellingPoints.length : ''}`}
      >
        {done ? (
          <ol style={{ margin: '4px 0 0 0', padding: 0, listStyle: 'none' }}>
            {sellingPoints.map((p, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '8px 10px',
                  background: i % 2 ? '#f9fafb' : '#fff',
                  border: '1px solid #f3f4f6',
                  borderRadius: 6,
                  fontSize: 12.5,
                  color: '#374151',
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ flex: 1, lineHeight: 1.6 }}>{p}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton.Input key={i} active size="small" style={{ height: 18, width: '100%' }} />
            ))}
          </div>
        )}
      </AnalyzeCard>
    </div>
  );
};

/** 单个分析子卡:左 icon + 标题,内容由 children 渲染 */
const AnalyzeCard = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #eef0f4',
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
        <span style={{ color: '#6366f1' }}>{icon}</span>
        {title}
      </div>
      {children}
    </div>
  );
};

export default Scene1MixedCut;
