import { useMemo, useState } from 'react';
import { Button, Tag, Row, Col, message, Card, Divider } from 'antd';
import {
  ThunderboltOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import VideoUploader from '../components/VideoUploader';
import HighlightTimeline from '../components/HighlightTimeline';
import PreviewPlayer from '../components/PreviewPlayer';
import ProgressPanel, { type Step } from '../components/ProgressPanel';
import TopSteps from '../components/TopSteps';
import ScriptPlanCard from '../components/ScriptPlanCard';
import FinalPreviewPanel from '../components/FinalPreviewPanel';
import { scriptSets } from '../mock/highlights';
import { useApp } from '../context/AppContext';

// 三页:第一页 上传+理解分析 / 第二页 创意方案 / 第三页 生成解说视频
const Phase = {
  Upload: 1,
  Plans: 2,
  Generate: 3,
} as const;
type PhaseValue = (typeof Phase)[keyof typeof Phase];

const Scene1MixedCut = () => {
  const { uploadedFiles } = useApp();
  const [phase, setPhase] = useState<PhaseValue>(1);

  // 第一页:理解分析状态
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzed, setAnalyzed] = useState(false);

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

  // 第一页:开始理解分析(进度动画在本页内完成)
  const runAnalyze = () => {
    if (!uploadedFiles.length) return message.warning('请先上传素材');
    setAnalyzing(true);
    setAnalyzed(false);
    setAnalyzeProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 5 + Math.random() * 6;
      if (p >= 100) {
        p = 100;
        clearInterval(t);
        setAnalyzing(false);
        setAnalyzed(true);
        setSelectedHighlights(script.highlights.map(h => h.id));
        message.success('理解分析完成');
      }
      setAnalyzeProgress(p);
    }, 120);
  };

  // 第一页 → 第二页
  const goPlans = () => setPhase(Phase.Plans);

  // 第二页 → 第三页:开始生成
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
    setAnalyzing(false);
    setAnalyzed(false);
    setAnalyzeProgress(0);
    setGenerating(false);
    setGenProgress(0);
    setDone(false);
    setSelectedHighlights([]);
  };

  // ProgressPanel 步骤状态(分析/生成共用)
  const progressSteps: Step[] = [
    { key: '1', label: '理解分析', status: phase === 1 ? (analyzed ? 'finish' : 'process') : 'finish' },
    { key: '2', label: '创意方案', status: phase === 2 ? 'process' : phase > 2 ? 'finish' : 'wait' },
    { key: '3', label: '生成解说视频', status: phase === 3 ? 'process' : 'wait' },
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
      {phase === 1 && (
        <>
          <span />
          <Button
            type="primary"
            className="gradient-btn"
            size="large"
            disabled={analyzing}
            onClick={analyzed ? goPlans : runAnalyze}
          >
            {analyzed ? '查看创意方案' : '开始理解分析'}
            <ArrowRightOutlined />
          </Button>
        </>
      )}
      {phase === 2 && (
        <>
          <Button icon={<ArrowLeftOutlined />} onClick={() => setPhase(Phase.Upload)}>
            上一步
          </Button>
          <Button type="primary" className="gradient-btn" size="large" onClick={runGenerate}>
            生成解说视频 <ArrowRightOutlined />
          </Button>
        </>
      )}
      {phase === 3 && <span />}
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <TopSteps
        current={phase}
        steps={['理解分析', '创意方案', '生成解说视频']}
      />

      {/* ============ 第一页:上传素材 + 理解分析 ============ */}
      {phase === 1 && (
        <div className="section-card" style={{ padding: 28 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              <ThunderboltOutlined style={{ color: '#6366f1', marginRight: 8 }} />
              上传剧集视频,完成后开始理解分析
            </div>
            <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 6 }}>
              支持批量上传多个视频,mp4/mov,单个≤2G;AI 将自动提取剧情高光片段
            </div>
          </div>

          <VideoUploader
            multiple
            title="上传视频素材(可多选)"
            desc="支持批量上传多个视频,mp4/mov,单个≤2G"
          />

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
            <div
              style={{
                textAlign: 'center',
                marginTop: 20,
                fontSize: 13,
                color: '#10b981',
                fontWeight: 600,
              }}
            >
              <CheckCircleFilled style={{ marginRight: 6 }} />
              理解分析完成,已识别 {scriptSets.length} 个创意方案
            </div>
          )}

          {footer}
        </div>
      )}

      {/* ============ 第二页:创意方案 ============ */}
      {phase === 2 && (
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

      {/* ============ 第三页:生成解说视频 ============ */}
      {phase === 3 && (
        <div className="section-card" style={{ padding: 28 }}>
          {generating && (
            <div style={{ padding: 40 }}>
              <ProgressPanel
                steps={progressSteps}
                progress={genProgress}
                estimatedSeconds={960}
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

export default Scene1MixedCut;
