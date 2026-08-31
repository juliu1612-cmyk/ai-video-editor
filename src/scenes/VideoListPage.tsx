import { useMemo, useState } from 'react';
import { Button, Checkbox, Empty, Modal, Select, Tag, message } from 'antd';
import {
  PlayCircleFilled,
  DownloadOutlined,
  DeleteOutlined,
  VideoCameraOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useApp, sceneMeta, type GeneratedVideo } from '../context/AppContext';
import { downloadVideo, downloadVideosBatch } from '../utils/download';

/** 绝对时间:YYYY-MM-DD HH:mm */
const formatDateTime = (ts: number): string => {
  const d = new Date(ts);
  const p = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** 相对时间(作为辅助信息) */
const formatRelative = (ts: number): string => {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  return `${d} 天前`;
};

/** 时间档位 → 起始时间戳("今天"取自然日零点) */
const timeRangeStart = (mode: string): number => {
  switch (mode) {
    case 'today': return new Date().setHours(0, 0, 0, 0);
    case '3d': return Date.now() - 3 * 86400000;
    case '7d': return Date.now() - 7 * 86400000;
    case '30d': return Date.now() - 30 * 86400000;
    default: return -Infinity; // 全部时间
  }
};

const timeOptions = [
  { value: 'today', label: '今天' },
  { value: '3d', label: '近3天' },
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
];

const VideoListPage = () => {
  const { generatedVideos, removeGeneratedVideo, setNav } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewVideo, setPreviewVideo] = useState<GeneratedVideo | null>(null);

  // ===== 筛选状态 =====
  const [sceneFilter, setSceneFilter] = useState<string[]>([]);   // 多选场景 key
  const [timeFilter, setTimeFilter] = useState<string>('all');    // 时间档位
  const [makerFilter, setMakerFilter] = useState<string | undefined>(undefined); // 制作人

  // 筛选变更时清空勾选,避免选中不可见行
  const changeFilter = (fn: () => void) => {
    fn();
    setSelectedIds([]);
  };

  const resetFilters = () => {
    setSceneFilter([]);
    setTimeFilter('all');
    setMakerFilter(undefined);
    setSelectedIds([]);
  };

  // 场景选项:全部 6 大场景(固定顺序)
  const sceneOptions = useMemo(
    () => Object.entries(sceneMeta).map(([key, m]) => ({ value: key, label: m.label })),
    []
  );

  // 制作人选项:从现有成片动态去重
  const makerOptions = useMemo(
    () => [...new Set(generatedVideos.map(v => v.maker).filter(Boolean))],
    [generatedVideos]
  );

  // 筛选结果
  const filtered = useMemo(
    () => generatedVideos.filter(v => {
      if (sceneFilter.length > 0 && !sceneFilter.includes(v.scene)) return false;
      if (v.createdAt < timeRangeStart(timeFilter)) return false;
      if (makerFilter && v.maker !== makerFilter) return false;
      return true;
    }),
    [generatedVideos, sceneFilter, timeFilter, makerFilter]
  );

  const hasFilter = sceneFilter.length > 0 || timeFilter !== 'all' || makerFilter !== undefined;

  const allChecked = filtered.length > 0 && filtered.every(v => selectedIds.includes(v.id));

  const toggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // 全选/取消仅作用于当前筛选后的可见行
  const toggleAll = () => {
    if (allChecked) {
      const visibleIds = new Set(filtered.map(v => v.id));
      setSelectedIds(prev => prev.filter(id => !visibleIds.has(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...filtered.map(v => v.id)])]);
    }
  };

  const selectedVideos = useMemo(
    () => generatedVideos.filter(v => selectedIds.includes(v.id)),
    [generatedVideos, selectedIds]
  );

  const onBatchDownload = () => {
    if (!selectedVideos.length) return message.warning('请先选择要下载的视频');
    downloadVideosBatch(selectedVideos.map(v => ({ url: v.url, title: v.title })));
  };

  const removeOne = (id: string) => {
    removeGeneratedVideo(id);
    setSelectedIds(prev => prev.filter(x => x !== id));
  };

  // 表头/行单元格统一布局
  const cellFlex = { display: 'flex', alignItems: 'center', gap: 10 };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 32 }}>
      {/* 顶部工具栏 */}
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #e5e7eb',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <VideoCameraOutlined style={{ fontSize: 20, color: '#6366f1' }} />
        <div style={{ fontSize: 17, fontWeight: 700 }}>成片列表</div>
        <span style={{ fontSize: 12.5, color: '#9ca3af' }}>
          共 {generatedVideos.length} 个{hasFilter ? ` · 筛选出 ${filtered.length} 个` : ''} · 已选 {selectedIds.length} 个
        </span>
        <div style={{ flex: 1 }} />
        <Checkbox checked={allChecked} onChange={toggleAll} disabled={!filtered.length}>
          全选
        </Checkbox>
        <Button
          type="primary"
          className="gradient-btn"
          icon={<DownloadOutlined />}
          onClick={onBatchDownload}
          disabled={!selectedIds.length}
        >
          批量下载{selectedIds.length ? `(${selectedIds.length})` : ''}
        </Button>
      </div>

      {/* 筛选栏:场景 / 制作时间 / 制作人 */}
      {generatedVideos.length > 0 && (
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #e5e7eb',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 16,
          }}
        >
          <FilterOutlined style={{ fontSize: 16, color: '#6366f1' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', flexShrink: 0 }}>
            筛选
          </span>

          {/* 场景(多选) */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>场景</span>
            <Select
              mode="multiple"
              allowClear
              placeholder="全部场景"
              value={sceneFilter}
              onChange={vals => changeFilter(() => setSceneFilter(vals))}
              options={sceneOptions}
              maxTagCount="responsive"
              style={{ minWidth: 170, maxWidth: 300 }}
              size="middle"
            />
          </span>

          {/* 制作时间(快捷档,可清除) */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>制作时间</span>
            <Select
              allowClear
              placeholder="全部时间"
              value={timeFilter === 'all' ? undefined : timeFilter}
              onChange={v => changeFilter(() => setTimeFilter(v ?? 'all'))}
              options={timeOptions}
              style={{ width: 110 }}
              size="middle"
            />
          </span>

          {/* 制作人 */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>制作人</span>
            <Select
              allowClear
              showSearch
              placeholder="全部制作人"
              value={makerFilter}
              onChange={v => changeFilter(() => setMakerFilter(v))}
              options={makerOptions.map(m => ({ value: m, label: m }))}
              style={{ width: 130 }}
              size="middle"
            />
          </span>

          <div style={{ flex: 1 }} />

          {hasFilter && (
            <Button size="small" onClick={resetFilters}>
              重置筛选
            </Button>
          )}
        </div>
      )}

      {/* 空状态:无成片 */}
      {generatedVideos.length === 0 && (
        <div className="section-card" style={{ padding: 60, textAlign: 'center' }}>
          <Empty description="还没有成片,去创作一个吧">
            <Button type="primary" className="gradient-btn" onClick={() => setNav('home')}>
              去创作
            </Button>
          </Empty>
        </div>
      )}

      {/* 空状态:筛选无结果 */}
      {generatedVideos.length > 0 && filtered.length === 0 && (
        <div className="section-card" style={{ padding: 60, textAlign: 'center' }}>
          <Empty description="没有符合筛选条件的成片">
            <Button type="primary" className="gradient-btn" onClick={resetFilters}>
              清除筛选
            </Button>
          </Empty>
        </div>
      )}

      {/* 列表 */}
      {filtered.length > 0 && (
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          {/* 表头 */}
          <div
            style={{
              ...cellFlex,
              padding: '12px 16px',
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              fontSize: 12,
              fontWeight: 600,
              color: '#6b7280',
            }}
          >
            <span style={{ width: 28 }} />
            <span style={{ flex: 1, minWidth: 0 }}>成片</span>
            <span style={{ width: 110 }}>场景</span>
            <span style={{ width: 150 }}>制作时间</span>
            <span style={{ width: 120 }}>制作人</span>
            <span style={{ width: 190, textAlign: 'right' }}>操作</span>
          </div>

          {/* 行 */}
          {filtered.map(v => {
            const checked = selectedIds.includes(v.id);
            return (
              <div
                key={v.id}
                style={{
                  ...cellFlex,
                  padding: '12px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  background: checked ? '#f5f3ff' : '#fff',
                  borderLeft: `3px solid ${checked ? '#6366f1' : 'transparent'}`,
                  transition: 'background .15s',
                  cursor: 'default',
                }}
                onMouseEnter={e => { if (!checked) e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={e => { e.currentTarget.style.background = checked ? '#f5f3ff' : '#fff'; }}
              >
                {/* 选择 */}
                <span style={{ width: 28 }}>
                  <Checkbox checked={checked} onChange={() => toggle(v.id)} />
                </span>

                {/* 封面 + 标题 */}
                <span style={{ flex: 1, minWidth: 0, ...cellFlex }}>
                  <span
                    style={{
                      position: 'relative', width: 88, height: 52, flexShrink: 0,
                      borderRadius: 6, overflow: 'hidden', background: v.cover,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,.92)', fontSize: 22, cursor: 'pointer',
                    }}
                    onClick={() => setPreviewVideo(v)}
                    title="点击预览"
                  >
                    <PlayCircleFilled />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 13, fontWeight: 600, color: '#1f2937',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: 320, cursor: 'pointer',
                      }}
                      title={v.title}
                      onClick={() => setPreviewVideo(v)}
                    >
                      {v.title}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      {formatRelative(v.createdAt)}
                    </span>
                  </span>
                </span>

                {/* 场景 */}
                <span style={{ width: 110 }}>
                  <Tag color="processing" style={{ margin: 0 }}>{v.sceneLabel}</Tag>
                </span>

                {/* 制作时间 */}
                <span style={{ width: 150, fontSize: 12.5, color: '#6b7280' }}>
                  {formatDateTime(v.createdAt)}
                </span>

                {/* 制作人 */}
                <span style={{ width: 120, ...cellFlex }}>
                  <span
                    style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,#6366f1,#a855f7)',
                      color: '#fff', fontSize: 11,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {(v.maker ?? '未').slice(0, 1)}
                  </span>
                  <span style={{ fontSize: 12.5, color: '#374151' }}>
                    {v.maker ?? '未知'}
                  </span>
                </span>

                {/* 操作 */}
                <span style={{ width: 190, textAlign: 'right' }}>
                  <Button size="small" icon={<PlayCircleFilled />} onClick={() => setPreviewVideo(v)}>
                    查看
                  </Button>
                  <Button
                    size="small"
                    style={{ marginLeft: 8 }}
                    icon={<DownloadOutlined />}
                    onClick={() => downloadVideo(v.url, v.title)}
                  >
                    下载
                  </Button>
                  <Button
                    size="small"
                    type="text"
                    danger
                    style={{ marginLeft: 4 }}
                    icon={<DeleteOutlined />}
                    onClick={() => removeOne(v.id)}
                  />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 预览 Modal */}
      <Modal
        open={previewVideo !== null}
        onCancel={() => setPreviewVideo(null)}
        width={420}
        title={previewVideo?.title}
        footer={[
          <Button key="back" onClick={() => setPreviewVideo(null)}>
            <ArrowLeftOutlined /> 关闭
          </Button>,
          <Button
            key="download"
            type="primary"
            className="gradient-btn"
            icon={<DownloadOutlined />}
            onClick={() => previewVideo && downloadVideo(previewVideo.url, previewVideo.title)}
          >
            下载视频
          </Button>,
        ]}
      >
        {previewVideo && (
          <div>
            <video
              src={previewVideo.url}
              controls
              autoPlay
              style={{ width: '100%', borderRadius: 8, background: '#000', maxHeight: 480 }}
            />
            <div
              style={{
                marginTop: 10, fontSize: 12, color: '#6b7280',
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              }}
            >
              <span>
                制作时间:{formatDateTime(previewVideo.createdAt)}({formatRelative(previewVideo.createdAt)})
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <UserOutlined />
                制作人:{previewVideo.maker ?? '未知'}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VideoListPage;
