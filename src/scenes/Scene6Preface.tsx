import { useState } from 'react';
import { Button, Empty, Row, Col, message, Radio, Input, Card, Tag } from 'antd';
import {
  ThunderboltOutlined,
  RocketOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import VideoUploader from '../components/VideoUploader';
import PreviewPlayer from '../components/PreviewPlayer';
import ProgressPanel, { type Step } from '../components/ProgressPanel';
import TopSteps from '../components/TopSteps';
import FinalPreviewPanel from '../components/FinalPreviewPanel';
import { prefaceStyles } from '../mock/prefaceStyles';
import { useApp } from '../context/AppContext';

const Scene6Preface = () => {
  const { uploadedFiles } = useApp();
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [duration, setDuration] = useState<1 | 3 | 5 | 10>(3);
  const [styleId, setStyleId] = useState(prefaceStyles[0].id);
  const [customScript, setCustomScript] = useState('');

  const style = prefaceStyles.find(s => s.id === styleId)!;

  const goAnalyze = () => {
    if (!uploadedFiles.length) return message.warning('请先上传素材');
    setPhase(2);
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 8;
      if (p >= 100) { p = 100; clearInterval(t); setPhase(3); }
      setProgress(p);
    }, 80);
  };

  const goGenerate = () => {
    setPhase(3);
    setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += 6;
      if (p >= 100) { p = 100; clearInterval(t); setDone(true); message.success('生成完成'); }
      setProgress(p);
    }, 100);
  };

  const reset = () => { setPhase(1); setProgress(0); setDone(false); };

  const steps: Step[] = [
    { key: '1', label: '上传素材', status: phase > 1 ? 'finish' : phase === 1 ? 'process' : 'wait' },
    { key: '2', label: '配置前贴', status: phase > 2 ? 'finish' : phase === 2 ? 'process' : 'wait' },
    { key: '3', label: '生成视频', status: phase === 3 ? 'process' : 'wait' },
  ];

  return (
    <div>
      <TopSteps current={phase} steps={['上传素材', '配置前贴', '生成视频']} />

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
              <div style={{ fontWeight: 600, marginBottom: 12 }}>
                <RocketOutlined style={{ color: '#6366f1' }} /> 前贴设置
              </div>

              <div style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>前贴时长</div>
              <Radio.Group
                value={duration}
                onChange={e => setDuration(e.target.value)}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}
              >
                {[1, 3, 5, 10].map(v => (
                  <Radio.Button key={v} value={v} style={{ borderRadius: 6 }}>{v}秒</Radio.Button>
                ))}
              </Radio.Group>

              <div style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>前贴风格</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
                {prefaceStyles.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setStyleId(p.id)}
                    style={{
                      border: `2px solid ${styleId === p.id ? '#6366f1' : '#e5e7eb'}`,
                      borderRadius: 8,
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ height: 60, background: p.example, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>
                      {p.name}
                    </div>
                    <div style={{ padding: 6, fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
                      {p.desc}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>推荐脚本(可修改)</div>
              <Input.TextArea
                value={customScript || style.script}
                onChange={e => setCustomScript(e.target.value)}
                rows={3}
              />

              <Button
                type="primary"
                className="gradient-btn"
                block
                size="large"
                style={{ marginTop: 16 }}
                onClick={goGenerate}
              >
                一键生成前贴
              </Button>
            </div>
          )}
        </Col>

        <Col span={10}>
          {phase === 1 && (
            <div className="section-card" style={{ textAlign: 'center', padding: 60 }}>
              <Empty description="上传素材视频后,选择前贴时长与风格">
                <Button type="primary" className="gradient-btn" size="large" onClick={goAnalyze}>
                  开始配置 <CaretRightOutlined />
                </Button>
              </Empty>
            </div>
          )}

          {phase === 2 && (
            <ProgressPanel steps={steps} progress={progress} estimatedSeconds={60} />
          )}

          {phase === 3 && !done && (
            <ProgressPanel steps={steps} progress={progress} estimatedSeconds={600} />
          )}

          {done && (
            <FinalPreviewPanel
              scene="preface"
              title="前贴已生成"
              sceneDesc={`${style.name} · ${duration}秒 · 已叠加到原素材`}
              url={uploadedFiles[0]?.url}
              overlays={[
                <div
                  key="preface"
                  style={{
                    position: 'absolute', inset: 0,
                    background: style.example,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    textAlign: 'center', padding: 20,
                  }}
                >
                  <div>
                    <Tag color="processing" style={{ marginBottom: 12 }}>AI 前贴 · {duration}s</Tag>
                    <div style={{ lineHeight: 1.6 }}>{customScript || style.script}</div>
                  </div>
                </div>,
              ]}
              onExport={() => message.success('已发送导出任务(演示)')}
              onRedo={reset}
            />
          )}
        </Col>

        <Col span={7}>
          <Card title="风格预览">
            <div
              style={{
                height: 240,
                background: style.example,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                padding: 24,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>{style.name}</div>
                <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
                  {customScript || style.script}
                </div>
                <div style={{ marginTop: 16, fontSize: 11, opacity: 0.6 }}>
                  时长 {duration} 秒
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 12, lineHeight: 1.6 }}>
              <strong>风格说明:</strong>{style.desc}
            </div>
          </Card>

          <Card title="原素材预览" style={{ marginTop: 12 }}>
            <PreviewPlayer url={uploadedFiles[0]?.url} height={240} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Scene6Preface;
