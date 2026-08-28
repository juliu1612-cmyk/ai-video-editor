import { useMemo, useState } from 'react';
import { Button, Empty, Tag, Row, Col, Card, message, Select } from 'antd';
import {
  ThunderboltOutlined,
  CaretRightOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import VideoUploader from '../components/VideoUploader';
import HighlightTimeline from '../components/HighlightTimeline';
import PreviewPlayer from '../components/PreviewPlayer';
import ProgressPanel, { type Step } from '../components/ProgressPanel';
import TopSteps from '../components/TopSteps';
import ScriptPlanCard from '../components/ScriptPlanCard';
import FinalPreviewPanel from '../components/FinalPreviewPanel';
import BgmPicker from '../components/BgmPicker';
import { scriptSets } from '../mock/highlights';
import { bgmList } from '../mock/bgm';
import { useApp } from '../context/AppContext';

type Phase = 1 | 2 | 3 | 4;

const Scene2MixedCutBgm = () => {
  const { uploadedFiles } = useApp();
  const [phase, setPhase] = useState<Phase>(1);
  const [progress, setProgress] = useState(0);
  const [selectedScriptId, setSelectedScriptId] = useState<string>(scriptSets[0].id);
  const [mood, setMood] = useState<string>('全部');
  const [selectedBgmId, setSelectedBgmId] = useState<string | null>('b1');
  const [done, setDone] = useState(false);

  const script = useMemo(
    () => scriptSets.find(s => s.id === selectedScriptId) ?? scriptSets[0],
    [selectedScriptId]
  );

  const filteredBgms = mood === '全部' ? bgmList : bgmList.filter(b => b.mood === mood);

  const goAnalyze = () => {
    if (!uploadedFiles.length) return message.warning('请先上传素材');
    setPhase(2);
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 6;
      if (p >= 100) {
        p = 100; clearInterval(t); setPhase(3);
      }
      setProgress(p);
    }, 100);
  };

  const goBgmPick = () => {
    if (!selectedBgmId) return message.warning('请选择一首 BGM');
    setPhase(4);
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 5;
      if (p >= 100) {
        p = 100; clearInterval(t); setDone(true); message.success('生成完成');
      }
      setProgress(p);
    }, 120);
  };

  const reset = () => { setPhase(1); setProgress(0); setDone(false); };

  const steps: Step[] = [
    { key: '1', label: '理解分析', status: phase > 1 ? 'finish' : phase === 1 ? 'process' : 'wait' },
    { key: '2', label: '创意方案', status: phase > 2 ? 'finish' : phase === 2 ? 'process' : 'wait' },
    { key: '3', label: '选择BGM', status: phase > 3 ? 'finish' : phase === 3 ? 'process' : 'wait' },
    { key: '4', label: '生成视频', status: phase === 4 ? 'process' : 'wait' },
  ];

  return (
    <div>
      <TopSteps current={phase} steps={['理解分析', '创意方案', '选择BGM', '生成视频']} />

      <Row gutter={16}>
        <Col span={8}>
          <div className="section-card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>
              <ThunderboltOutlined style={{ color: '#6366f1' }} /> 上传剧集视频
            </div>
            <VideoUploader />
          </div>
          {phase >= 2 && (
            <div className="section-card">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>剧集概览</div>
              <Tag color="purple">都市 / 复仇</Tag>
              <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                {script.summary}
              </div>
            </div>
          )}
        </Col>

        <Col span={9}>
          {phase === 1 && (
            <div className="section-card" style={{ textAlign: 'center', padding: 60 }}>
              <Empty description="先上传剧集视频,系统将自动分析剧情">
                <Button type="primary" className="gradient-btn" size="large" onClick={goAnalyze}>
                  开始理解分析 <CaretRightOutlined />
                </Button>
              </Empty>
            </div>
          )}

          {phase === 2 && !done && (
            <ProgressPanel steps={steps} progress={progress} estimatedSeconds={180} />
          )}

          {phase === 3 && !done && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>创意方案</div>
                <Button size="small" onClick={() => setPhase(4)} disabled={!selectedBgmId}>
                  跳过BGM选择 →
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
              <div style={{ marginTop: 12 }}>
                <HighlightTimeline
                  highlights={script.highlights}
                  totalDuration={script.duration}
                  selectedIds={script.highlights.map(h => h.id)}
                />
              </div>
            </div>
          )}

          {phase === 3 && (
            <div style={{ marginTop: 16 }} className="section-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>
                  <SoundOutlined style={{ color: '#6366f1' }} /> 适配 BGM 推荐
                </div>
                <Select
                  size="small"
                  value={mood}
                  onChange={setMood}
                  style={{ width: 100 }}
                  options={['全部', '激烈', '治愈', '悬疑', '搞笑', '悲伤', '史诗'].map(m => ({ label: m, value: m }))}
                />
              </div>
              <BgmPicker
                bgms={filteredBgms}
                selectedId={selectedBgmId ?? undefined}
                onSelect={b => setSelectedBgmId(b.id)}
              />
              <Button
                type="primary"
                className="gradient-btn"
                block
                size="large"
                style={{ marginTop: 16 }}
                onClick={goBgmPick}
              >
                使用选定BGM生成视频
              </Button>
            </div>
          )}

          {phase === 4 && !done && (
            <ProgressPanel steps={steps} progress={progress} estimatedSeconds={900} />
          )}

          {done && (
            <FinalPreviewPanel
              scene="mixed-cut-bgm"
              title={script.title}
              sceneDesc={`已配乐:${bgmList.find(b => b.id === selectedBgmId)?.name ?? '未选择'}`}
              url={uploadedFiles[0]?.url}
              onExport={() => message.success('已发送导出任务(演示)')}
              onRedo={reset}
            />
          )}
        </Col>

        <Col span={7}>
          <Card title="预览">
            <PreviewPlayer
              url={uploadedFiles[0]?.url}
              overlays={
                selectedBgmId
                  ? [
                      <div
                        key="wave"
                        style={{
                          position: 'absolute', bottom: 56, left: 16, right: 16,
                          display: 'flex', gap: 2, alignItems: 'end', height: 24,
                        }}
                      >
                        {Array.from({ length: 30 }).map((_, i) => (
                          <span
                            key={i}
                            style={{
                              flex: 1, height: `${20 + Math.sin(i / 2) * 30}%`,
                              background: 'linear-gradient(180deg, #6366f1, #a855f7)',
                              borderRadius: 2,
                            }}
                          />
                        ))}
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

export default Scene2MixedCutBgm;
