import { Row, Col, message } from 'antd';
import {
  ScissorOutlined,
  SoundOutlined,
  FontSizeOutlined,
  PictureOutlined,
  HighlightOutlined,
  RocketOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';

interface HomePageProps {
  onStart: (scene: string) => void;
}

interface Feature {
  key: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
  desc: string;
  steps: string[];
  color: string;
  gradient: string;
  soft: string;
  shadow: string;
  /** 是否已上线;未上线的卡片点击后只提示,不会进入场景页 */
  available: boolean;
}

// 六大剪辑功能;available 标记是否已上线(替换 Logo、混剪剧情)
const features: Feature[] = [
  {
    key: 'scene1', icon: <ScissorOutlined />,
    label: '混剪剧情', sub: 'Mixed Cut',
    desc: '上传剧集视频,自动提取高光片段,生成一个素材视频',
    steps: ['上传视频', 'AI 提取高光', '生成素材'],
    color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#818cf8)',
    soft: '#eef2ff', shadow: 'rgba(99,102,241,.32)',
    available: true,
  },
  {
    key: 'scene2', icon: <SoundOutlined />,
    label: '混剪剧情 + BGM', sub: 'Mixed Cut & BGM',
    desc: '提取高光片段后智能推荐适配 BGM,选曲后生成素材视频',
    steps: ['上传视频', 'AI 提取高光', '选择 BGM', '生成素材'],
    color: '#ef4444', gradient: 'linear-gradient(135deg,#ef4444,#f97316)',
    soft: '#fef2f2', shadow: 'rgba(239,68,68,.32)',
    available: false,
  },
  {
    key: 'scene3', icon: <FontSizeOutlined />,
    label: '混剪 + 引流小标题', sub: 'Mixed Cut & Title',
    desc: '提取高光片段,输入标题生成素材;标题可拖动定位、设置时长',
    steps: ['上传视频', 'AI 提取高光', '编辑标题', '生成素材'],
    color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
    soft: '#fffbeb', shadow: 'rgba(245,158,11,.32)',
    available: false,
  },
  {
    key: 'scene4', icon: <PictureOutlined />,
    label: '替换 Logo', sub: 'Logo & Outro Replace',
    desc: '上传原素材与新 Logo,自动识别 Logo 位置,生成去 Logo 视频',
    steps: ['上传素材', '识别 Logo', '生成素材'],
    color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#34d399)',
    soft: '#ecfdf5', shadow: 'rgba(16,185,129,.32)',
    available: true,
  },
  {
    key: 'scene6', icon: <RocketOutlined />,
    label: 'AI 前贴风格化', sub: 'AI Preface',
    desc: '设置前贴时长与风格,AI 按风格生成前贴并叠加到素材视频',
    steps: ['上传素材', '生成视频'],
    color: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#f472b6)',
    soft: '#fdf2f8', shadow: 'rgba(236,72,153,.32)',
    available: true,
  },
  {
    key: 'scene5', icon: <HighlightOutlined />,
    label: '水印打码', sub: 'Watermark Mosaic',
    desc: '输入马赛文字,设置大小、颜色、透明度与展示位置,按规则生成',
    steps: ['上传素材', '配置水印', '生成素材'],
    color: '#a855f7', gradient: 'linear-gradient(135deg,#a855f7,#c084fc)',
    soft: '#faf5ff', shadow: 'rgba(168,85,247,.32)',
    available: false,
  },
];

// 功能分类:素材加工在上,混剪创作在下;编号 01-06 按展示顺序连续
const processGroup = features.filter(f => ['scene4', 'scene5', 'scene6'].includes(f.key));
const mixGroup = features.filter(f => ['scene1', 'scene2', 'scene3'].includes(f.key));

const formatNum = (n: number) => (n < 10 ? `0${n}` : `${n}`);

const FeatureCard = ({
  f, index, onStart,
}: {
  f: Feature;
  index: number;
  onStart: (k: string) => void;
}) => {
  const num = formatNum(index + 1);
  return (
    <div
      className="feature-card"
      style={{
        // @ts-expect-error CSS custom properties
        '--fc-color': f.color,
        '--fc-gradient': f.gradient,
        '--fc-soft': f.soft,
        '--fc-shadow': f.shadow,
        opacity: f.available ? 1 : 0.65,
      }}
      onClick={() => {
        if (!f.available) {
          message.warning('该功能暂未上线,敬请期待');
          return;
        }
        onStart(f.key);
      }}
    >
      <span className="feature-num">{num}</span>

      <div className="feature-icon">{f.icon}</div>

      <div style={{ marginTop: 14, position: 'relative', zIndex: 2 }}>
        <div
          style={{
            fontSize: 16, fontWeight: 700, color: '#1f2937',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {f.label}
          {!f.available && (
            <span
              style={{
                fontSize: 11, fontWeight: 600,
                padding: '2px 8px', borderRadius: 10,
                background: '#fef3c7', color: '#b45309',
                display: 'inline-flex', alignItems: 'center',
              }}
            >
              敬请期待
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#c0c4cc', marginTop: 2, letterSpacing: .3 }}>{f.sub}</div>
      </div>

      <div
        style={{
          fontSize: 12.5, color: '#6b7280', lineHeight: 1.65,
          marginTop: 8, minHeight: 42, position: 'relative', zIndex: 2,
        }}
      >
        {f.desc}
      </div>

      {/* 步骤链 */}
      <div
        style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap',
          gap: 6, marginTop: 10, position: 'relative', zIndex: 2,
        }}
      >
        {f.steps.map((s, i) => (
          <span
            key={s}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}
          >
            {i > 0 && <span className="feature-step-dot" />}
            <span style={{ color: '#4b5563' }}>{s}</span>
          </span>
        ))}
      </div>

      {/* CTA */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: 12,
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative', zIndex: 2,
        }}
      >
        <span style={{ fontSize: 11, color: '#b0b5bd' }}>MP4 / MOV</span>
        <span
          style={{
            fontSize: 13, fontWeight: 600,
            color: f.available ? f.color : '#cbd5e1',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}
        >
          {f.available ? <>开始使用 <ArrowRightOutlined className="feature-arrow" /></> : '即将上线'}
        </span>
      </div>
    </div>
  );
};

const HomePage = ({ onStart }: HomePageProps) => {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 32 }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '44px 0 28px' }}>
        <h1 style={{ fontSize: 30, margin: 0, fontWeight: 700, letterSpacing: .5 }}>
          选择一个<span className="gradient-text">剪辑功能</span>开始创作
        </h1>
        <p style={{ fontSize: 13.5, color: '#9ca3af', marginTop: 10, letterSpacing: .2 }}>
          六大 AI 剪辑场景 · 从素材到成片一步到位
        </p>
      </div>

      {/* 素材加工 */}
      <div className="feature-group-title">
        <span className="bar" style={{ background: 'linear-gradient(180deg,#10b981,#34d399)' }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>素材加工</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>替换 Logo、水印打码、AI 前贴等素材处理</span>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        {processGroup.map((f, i) => (
          <Col xs={24} sm={12} md={8} key={f.key} style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}>
              <FeatureCard f={f} index={i} onStart={onStart} />
            </div>
          </Col>
        ))}
      </Row>

      {/* 混剪创作 */}
      <div className="feature-group-title">
        <span className="bar" style={{ background: 'linear-gradient(180deg,#6366f1,#818cf8)' }} />
        <span style={{ fontSize: 16, fontWeight: 700 }}>混剪创作</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>从剧集中提取高光并混剪成新素材</span>
      </div>
      <Row gutter={[16, 16]}>
        {mixGroup.map((f, i) => (
          <Col xs={24} sm={12} md={8} key={f.key} style={{ display: 'flex' }}>
            <div style={{ flex: 1 }}>
              <FeatureCard f={f} index={processGroup.length + i} onStart={onStart} />
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default HomePage;