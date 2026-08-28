import { CheckCircleFilled, LoadingOutlined, ClockCircleOutlined } from '@ant-design/icons';

export interface Step {
  key: string;
  label: string;
  status: 'wait' | 'process' | 'finish';
}

interface ProgressPanelProps {
  steps: Step[];
  progress?: number;       // 0-100, 当前进度
  estimatedSeconds?: number;
}

const iconMap = {
  wait: <ClockCircleOutlined style={{ color: '#d1d5db', fontSize: 22 }} />,
  process: <LoadingOutlined style={{ color: '#6366f1', fontSize: 22 }} />,
  finish: <CheckCircleFilled style={{ color: '#10b981', fontSize: 22 }} />,
};

const ProgressPanel = ({ steps, progress = 0, estimatedSeconds = 960 }: ProgressPanelProps) => {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 24,
        border: '1px solid #e5e7eb',
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
        识别中 <span style={{ color: '#6366f1' }}>{progress}%</span>
      </div>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
        预计还需 {Math.ceil(estimatedSeconds / 60)} 分钟
      </div>

      {/* 进度条 */}
      <div
        style={{
          height: 6,
          background: '#f3f4f6',
          borderRadius: 3,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #a855f7)',
            transition: 'width .4s',
          }}
        />
      </div>

      {/* 步骤列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {steps.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {iconMap[s.status]}
            <span
              style={{
                fontSize: 14,
                color: s.status === 'finish' ? '#1f2937' : s.status === 'process' ? '#6366f1' : '#9ca3af',
                fontWeight: s.status === 'process' ? 600 : 400,
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressPanel;
