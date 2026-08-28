import { type Bgm, moodColorMap } from '../mock/bgm';
import { formatDuration } from '../utils/format';
import { Button } from 'antd';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';

interface BgmPickerProps {
  bgms: Bgm[];
  selectedId?: string;
  onSelect: (bgm: Bgm) => void;
}

const BgmPicker = ({ bgms, selectedId, onSelect }: BgmPickerProps) => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {bgms.map(b => {
        const isSelected = selectedId === b.id;
        return (
          <div
            key={b.id}
            onClick={() => onSelect(b)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              background: '#fff',
              border: `2px solid ${isSelected ? '#6366f1' : '#e5e7eb'}`,
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all .15s',
              boxShadow: isSelected ? '0 4px 12px rgba(99,102,241,0.15)' : 'none',
            }}
          >
            <div
              style={{
                width: 56, height: 56,
                borderRadius: 10,
                background: b.cover,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Button
                type="text"
                shape="circle"
                icon={
                  playingId === b.id ?
                    <PauseCircleOutlined style={{ color: '#fff', fontSize: 24 }} /> :
                    <PlayCircleOutlined style={{ color: '#fff', fontSize: 24 }} />
                }
                onClick={e => {
                  e.stopPropagation();
                  setPlayingId(playingId === b.id ? null : b.id);
                }}
                style={{ background: 'rgba(0,0,0,0.25)' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{b.name}</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 6px',
                    background: moodColorMap[b.mood],
                    color: '#fff',
                    borderRadius: 3,
                  }}
                >
                  {b.mood}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                {formatDuration(b.duration)} · BPM {b.bpm} · {b.tags.join(' / ')}
              </div>
            </div>
            {isSelected && (
              <div
                style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: '#6366f1', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                }}
              >
                ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BgmPicker;
