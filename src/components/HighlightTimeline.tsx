import { type Highlight, typeColorMap } from '../mock/highlights';
import { formatTime } from '../utils/format';

interface HighlightTimelineProps {
  highlights: Highlight[];
  totalDuration: number;
  selectedIds?: string[];
  onToggle?: (id: string) => void;
}

const HighlightTimeline = ({
  highlights,
  totalDuration,
  selectedIds = [],
  onToggle,
}: HighlightTimelineProps) => {
  return (
    <div style={{ background: '#f9fafb', padding: 16, borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontWeight: 600 }}>高光时间轴</span>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          总时长 {formatTime(totalDuration)} · 共 {highlights.length} 个高光
        </span>
      </div>

      {/* 时间刻度 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#9ca3af',
          marginBottom: 6,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i}>{formatTime((totalDuration / 5) * i)}</span>
        ))}
      </div>

      {/* 时间轴主体 */}
      <div
        style={{
          position: 'relative',
          height: 36,
          background: '#e5e7eb',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        {highlights.map(h => {
          const left = (h.start / totalDuration) * 100;
          const width = ((h.end - h.start) / totalDuration) * 100;
          const selected = selectedIds.includes(h.id);
          return (
            <div
              key={h.id}
              onClick={() => onToggle?.(h.id)}
              title={h.desc}
              style={{
                position: 'absolute',
                left: `${left}%`,
                width: `${width}%`,
                top: 0,
                bottom: 0,
                background: typeColorMap[h.type],
                opacity: selected ? 1 : 0.55,
                border: selected ? '2px solid #1f2937' : '1px solid rgba(255,255,255,0.5)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                paddingLeft: 4,
                transition: 'opacity .2s',
              }}
            >
              {h.type}
            </div>
          );
        })}
      </div>

      {/* 图例 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          marginTop: 12,
        }}
      >
        {Object.entries(typeColorMap).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span
              style={{
                display: 'inline-block',
                width: 12, height: 12,
                borderRadius: 3,
                background: color,
              }}
            />
            {type}
          </div>
        ))}
      </div>

      {/* 片段列表 */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {highlights.map(h => (
          <div
            key={h.id}
            onClick={() => onToggle?.(h.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              background: '#fff',
              border: `1px solid ${selectedIds.includes(h.id) ? '#6366f1' : '#e5e7eb'}`,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                background: typeColorMap[h.type],
                color: '#fff',
                fontSize: 11,
                borderRadius: 4,
                fontWeight: 600,
                minWidth: 36,
                textAlign: 'center',
              }}
            >
              {h.type}
            </span>
            <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 80 }}>
              {formatTime(h.start)} - {formatTime(h.end)}
            </span>
            <span style={{ fontSize: 13, flex: 1 }}>{h.desc}</span>
            <input
              type="checkbox"
              checked={selectedIds.includes(h.id)}
              onChange={() => onToggle?.(h.id)}
              onClick={e => e.stopPropagation()}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HighlightTimeline;
