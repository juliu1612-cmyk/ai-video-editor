import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';

interface TopStepsProps {
  current: number;           // 1-based
  steps: string[];
}

const TopSteps = ({ current, steps }: TopStepsProps) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        padding: '12px 24px',
        background: '#fff',
        borderRadius: 999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        margin: '0 auto 16px',
        width: 'fit-content',
      }}
    >
      {steps.map((label, i) => {
        const idx = i + 1;
        const status =
          idx < current ? 'finish' : idx === current ? 'process' : 'wait';
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 24, height: 24,
                borderRadius: '50%',
                background:
                  status === 'finish' ? '#10b981' :
                  status === 'process' ? '#6366f1' : '#e5e7eb',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {status === 'finish' ? <CheckCircleFilled /> :
               status === 'process' ? <LoadingOutlined /> : idx}
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: status === 'process' ? 600 : 400,
                color: status === 'wait' ? '#9ca3af' : '#1f2937',
              }}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div
                style={{
                  width: 32, height: 1,
                  background: idx < current ? '#10b981' : '#e5e7eb',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TopSteps;
