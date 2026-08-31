import { useMemo, useState } from 'react';
import { Button, Empty, Tag, Card, Row, Col, message, Select, Divider } from 'antd';
import { ThunderboltOutlined, CaretRightOutlined } from '@ant-design/icons';
import VideoUploader from '../components/VideoUploader';
import HighlightTimeline from '../components/HighlightTimeline';
import PreviewPlayer from '../components/PreviewPlayer';
import ProgressPanel, { type Step } from '../components/ProgressPanel';
import TopSteps from '../components/TopSteps';
import ScriptPlanCard from '../components/ScriptPlanCard';
import FinalPreviewPanel from '../components/FinalPreviewPanel';
import { scriptSets } from '../mock/highlights';
import { useApp } from '../context/AppContext';

const Phase = {
  Upload: 1,
  Analyze: 2,
  Generate: 3,
} as const;
type PhaseValue = (typeof Phase)[keyof typeof Phase];

// ---------- 第一步:混剪配置 ----------
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
  const [progress, setProgress] = useState(0);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(scriptSets[0].id);
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  // 第一步配置
  const [config, setConfig] = useState<MixConfig>(defaultConfig);

  const script = useMemo(
    () => scriptSets.find(s => s.id === selectedScriptId) ?? scriptSets[0],
    [selectedScriptId]
  );

  const toggleHighlight = (id: string) => {
    setSelectedHighlights(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const runAnalyze = () => {
    if (!uploadedFiles.length) return message.warning('请先上传素材');
    setPhase(Phase.Analyze);
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 5 + Math.random() * 6;
      if (p >= 100) {
        p = 100;
        clearInterval(t);
        setPhase(Phase.Generate);
        setSelectedHighlights(script.highlights.map(h => h.id));
      }
      setProgress(p);
    }, 120);
  };

  const runGenerate = () => {
    if (!config.originLang || !config.narratorLang || !config.voice || !config.duration) {
      return message.warning('请先完成第一步的混剪配置');
    }
    setPhase(Phase.Generate);
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 4 + Math.random() * 6;
      if (p >= 100) {
        p = 100;
        clearInterval(t);
        setDone(true);
        message.success('生成完成');
      }
      setProgress(p);
    }, 140);
  };

  const reset = () => {
    setPhase(Phase.Upload);
    setProgress(0);
    setDone(false);
  };

  const steps: Step[] = phase >= 1
    ? [
        { key: '1', label: '理解分析', status: phase > 1 ? 'finish' : 'process' },
        { key: '2', label: '创意方案', status: phase === 2 ? 'process' : phase > 2 ? 'finish' : 'wait' },
        { key: '3', label: '生成解说视频', status: phase === 3 ? 'process' : 'wait' },
      ]
    : [];

  return (
    <div>
      <TopSteps
        current={phase}
        steps={['理解分析', '创意方案', '生成解说视频']}
      />

      <Row gutter={16}>
        {/* 左: 上传 + 混剪配置 */}
        <Col span={8}>
          <div className="section-card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>
              <ThunderboltOutlined style={{ color: '#6366f1' }} /> 上传剧集视频
            </div>
            <VideoUploader
              multiple
              title="上传视频素材(可多选)"
              desc="支持批量上传多个视频,mp4/mov,单个≤2G"
            />

            {/* 第一步:混剪配置 */}
            <Divider style={{ margin: '16px 0 12px' }} />
            <div style={{ fontWeight: 600, marginBottom: 12 }}>混剪配置</div>
            <ConfigFields config={config} onChange={setConfig} />
          </div>

          {phase >= 2 && (
            <div className="section-card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>剧集类型</div>
              <Tag color="purple">都市 / 复仇 / 爽剧</Tag>
              <div style={{ marginTop: 12, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                {script.summary}
              </div>

              {/* 第一步配置摘要 */}
              <Divider style={{ margin: '14px 0 10px' }} />
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 13 }}>本次混剪配置</div>
              <ConfigSummary config={config} />
            </div>
          )}

          {phase >= 2 && (
            <div className="section-card">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                情感类型 <span style={{ color: '#6366f1' }}>{script.emotionTypes.length}</span>
              </div>
              <Row gutter={[8, 8]}>
                {script.emotionTypes.map(e => (
                  <Col span={12} key={e.name}>
                    <div
                      style={{
                        padding: 10, background: '#f9fafb', borderRadius: 8,
                        fontSize: 12, height: '100%',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{e.name}</div>
                      <div style={{ color: '#6b7280', lineHeight: 1.5 }}>{e.desc}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Col>

        {/* 中: 时间轴 / 创意方案 */}
        <Col span={9}>
          {phase === 1 && (
            <div className="section-card" style={{ textAlign: 'center', padding: 40 }}>
              <Empty description="上传素材并完成混剪配置后开始分析">
                <Button type="primary" className="gradient-btn" size="large" onClick={runAnalyze}>
                  开始理解分析 <CaretRightOutlined />
                </Button>
              </Empty>
            </div>
          )}

          {phase === 2 && !done && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>创意方案 <span style={{ color: '#6366f1' }}>{scriptSets.length}</span></div>
                <Button type="primary" className="gradient-btn" onClick={runGenerate}>
                  生成解说视频
                </Button>
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
                <HighlightTimeline
                  highlights={script.highlights}
                  totalDuration={script.duration}
                  selectedIds={selectedHighlights}
                  onToggle={toggleHighlight}
                />
              </div>
            </div>
          )}

          {phase === 3 && !done && (
            <Card>
              <ProgressPanel
                steps={steps}
                progress={progress}
                estimatedSeconds={Math.round(config.duration * 2.4)}
              />
            </Card>
          )}

          {done && (
            <Card>
              <FinalPreviewPanel
                scene="mixed-cut"
                title={script.title}
                sceneDesc="AI 已自动识别剧情高光并混剪"
                url={uploadedFiles[0]?.url}
                onExport={() => message.success('已发送导出任务(演示)')}
                onRedo={reset}
              />
            </Card>
          )}
        </Col>

        {/* 右: 预览 */}
        <Col span={7}>
          <Card title="预览">
            <PreviewPlayer
              url={uploadedFiles[0]?.url}
              overlays={
                done
                  ? [
                      <div
                        key="title"
                        style={{
                          position: 'absolute',
                          top: 24, left: 0, right: 0,
                          textAlign: 'center',
                          color: '#fbbf24',
                          fontWeight: 900,
                          fontSize: 22,
                          textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                        }}
                      >
                        豪宠私人会竟成直播?
                      </div>,
                    ]
                  : []
              }
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

/** 配置表单项的通用样式 */
const fieldStyle: React.CSSProperties = { width: '100%' };

/** 第一步:混剪配置四项(原视频语言 / 解说语言 / 音色 / 生产视频时长) */
const ConfigFields = ({
  config,
  onChange,
}: {
  config: MixConfig;
  onChange: (c: MixConfig) => void;
}) => {
  const set = (patch: Partial<MixConfig>) => onChange({ ...config, ...patch });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>原视频语言</div>
        <Select
          value={config.originLang}
          options={originLangOptions}
          onChange={v => set({ originLang: v })}
          style={fieldStyle}
          placeholder="选择原视频对白语言"
        />
      </div>

      <div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>解说语言</div>
        <Select
          value={config.narratorLang}
          options={narratorLangOptions}
          onChange={v => set({ narratorLang: v })}
          style={fieldStyle}
          placeholder="选择 AI 解说语言"
        />
      </div>

      <div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>解说音色</div>
        <Select
          value={config.voice}
          options={voiceOptions}
          onChange={v => set({ voice: v })}
          style={fieldStyle}
          placeholder="选择解说音色"
        />
      </div>

      <div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>生产视频时长</div>
        <Select
          value={config.duration}
          options={durationOptions}
          onChange={v => set({ duration: v })}
          style={fieldStyle}
          placeholder="选择成片目标时长"
        />
      </div>
    </div>
  );
};

/** 配置摘要:进入分析/生成阶段后,在左侧展示本次的混剪配置 */
const ConfigSummary = ({ config }: { config: MixConfig }) => {
  const rows: { label: string; value: string }[] = [
    { label: '原视频语言', value: config.originLang },
    { label: '解说语言', value: config.narratorLang },
    { label: '解说音色', value: config.voice },
    { label: '生产视频时长', value: `${config.duration / 60} 分钟` },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map(r => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
          <span style={{ color: '#9ca3af' }}>{r.label}</span>
          <span style={{ color: '#374151', fontWeight: 500 }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
};

export default Scene1MixedCut;
