import { useMemo, useState } from 'react';
import { Button, Empty, Tag, Card, Row, Col, message } from 'antd';
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

const Scene1MixedCut = () => {
  const { uploadedFiles } = useApp();
  const [phase, setPhase] = useState<PhaseValue>(1);
  const [progress, setProgress] = useState(0);
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(scriptSets[0].id);
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([]);
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
        {/* 左: 上传 + 分析结果 */}
        <Col span={8}>
          <div className="section-card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>
              <ThunderboltOutlined style={{ color: '#6366f1' }} /> 上传剧集视频
            </div>
            <VideoUploader />
          </div>

          {phase >= 2 && (
            <div className="section-card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>剧集类型</div>
              <Tag color="purple">都市 / 复仇 / 爽剧</Tag>
              <div style={{ marginTop: 12, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                {script.summary}
              </div>
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
            <div className="section-card" style={{ textAlign: 'center', padding: 60 }}>
              <Empty description="请先上传视频并开始分析">
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
              <ProgressPanel steps={steps} progress={progress} estimatedSeconds={960} />
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

export default Scene1MixedCut;
