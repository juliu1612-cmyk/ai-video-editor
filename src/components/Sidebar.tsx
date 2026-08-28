import { ShopOutlined, AppstoreFilled, VideoCameraFilled } from '@ant-design/icons';
import { useApp, type NavKey } from '../context/AppContext';

const Sidebar = () => {
  const { nav, setNav, generatedVideos } = useApp();

  const items: { key: NavKey; icon: React.ReactNode; label: string }[] = [
    { key: 'home', icon: <AppstoreFilled />, label: '功能' },
    { key: 'videos', icon: <VideoCameraFilled />, label: '成片' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '16px 0',
        height: '100%',
        background: '#fff',
      }}
    >
      <div
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          color: '#fff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 700, marginBottom: 24,
          flexShrink: 0,
        }}
      >
        AI
      </div>

      {items.map(it => (
        <div
          key={it.key}
          onClick={() => setNav(it.key)}
          title={it.label}
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4,
            padding: '10px 6px',
            borderRadius: 8,
            cursor: 'pointer',
            color: nav === it.key ? '#6366f1' : '#9ca3af',
            background: nav === it.key ? '#eef2ff' : 'transparent',
            width: 48, marginBottom: 8,
            flexShrink: 0,
            transition: 'all .2s',
            position: 'relative',
          }}
        >
          <div style={{ fontSize: 18 }}>{it.icon}</div>
          <div style={{ fontSize: 11 }}>{it.label}</div>
          {/* 成片角标 */}
          {it.key === 'videos' && generatedVideos.length > 0 && (
            <span
              style={{
                position: 'absolute', top: 2, right: 2,
                minWidth: 15, height: 15,
                padding: '0 4px',
                borderRadius: 8,
                background: '#ef4444', color: '#fff',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {generatedVideos.length > 99 ? '99+' : generatedVideos.length}
            </span>
          )}
        </div>
      ))}

      <div style={{ flex: 1 }} />
      <div
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, marginBottom: 8,
          flexShrink: 0,
        }}
      >
        用户
      </div>
      <div
        style={{
          fontSize: 10, color: '#9ca3af', marginBottom: 6,
          display: 'flex', alignItems: 'center', gap: 4,
          flexShrink: 0,
        }}
      >
        <ShopOutlined /> 60
      </div>
    </div>
  );
};

export default Sidebar;
