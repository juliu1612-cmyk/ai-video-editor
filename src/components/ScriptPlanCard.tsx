import { type Highlight, typeColorMap } from '../mock/highlights';
import { Checkbox } from 'antd';
import { formatTime } from '../utils/format';

interface ScriptPlanCardProps {
  title: string;
  highlights: Highlight[];
  totalDuration: number;
  selected: boolean;
  onSelect: () => void;
}

const ScriptPlanCard = ({
  title,
  highlights,
  totalDuration,
  selected,
  onSelect,
}: ScriptPlanCardProps) => {
  return (
    <div
      onClick={onSelect}
      style={{
        background: '#fff',
        border: `2px solid ${selected ? '#6366f1' : '#e5e7eb'}`,
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        boxShadow: selected ? '0 4px 16px rgba(99,102,241,0.15)' : 'none',
        transition: 'all .2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Checkbox checked={selected} onChange={onSelect} onClick={e => e.stopPropagation()} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
      </div>

      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
        视频结构故事线
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {highlights.map(h => (
          <div
            key={h.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 8px',
              background: '#f9fafb',
              borderRadius: 6,
              fontSize: 12,
            }}
          >
            <span
              style={{
                padding: '1px 6px',
                background: typeColorMap[h.type],
                color: '#fff',
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {h.type}
            </span>
            <span style={{ color: '#9ca3af', flexShrink: 0, fontSize: 11 }}>
              {formatTime(h.start)}-{formatTime(h.end)}
            </span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {h.desc}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid #f3f4f6',
          fontSize: 11,
          color: '#9ca3af',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>总时长 {formatTime(totalDuration)}</span>
        <span>{highlights.length} 个高光</span>
      </div>
    </div>
  );
};

export default ScriptPlanCard;
