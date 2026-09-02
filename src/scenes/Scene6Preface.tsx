import { useEffect, useRef, useState } from 'react';
import { Button, message, Radio } from 'antd';
import {
  RocketOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  DownloadOutlined,
  LoadingOutlined,
  PlayCircleFilled,
  PlusCircleFilled,
} from '@ant-design/icons';
import VideoUploader from '../components/VideoUploader';
import TopSteps from '../components/TopSteps';
import { prefaceStyles } from '../mock/prefaceStyles';
import { useApp } from '../context/AppContext';

type StepNum = 1 | 2;

interface GenTask {
  fileId: string;
  title: string;
  progress: number;
  done: boolean;
}

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const Scene6Preface = () => {
  const { uploadedFiles, setNav } = useApp();
  const [step, setStep] = useState<StepNum>(1);

  // 前贴配置(上传素材页内直接设置)
  const [duration, setDuration] = useState<20 | 30 | 40>(30);
  const [styleId, setStyleId] = useState(prefaceStyles[0].id);

  // 第二步:按素材逐个生成任务
  const [genTasks, setGenTasks] = useState<GenTask[]>([]);
  const timersRef = useRef<number[]>([]);

  const style = prefaceStyles.find(s => s.id === styleId)!;
  const hasFiles = uploadedFiles.length > 0;

  // 全部任务完成 → 切换为成片列表视图
  const genAllFinished = genTasks.length > 0 && genTasks.every(t => t.done);
  const doneTasks = genTasks.filter(t => t.done);

  // 卸载时清理计时器
  useEffect(() => () => timersRef.current.forEach(t => clearInterval(t)), []);

  // 全部生成完成后提示一次
  useEffect(() => {
    if (genAllFinished) message.success('前贴视频生成完成');
  }, [genAllFinished]);

  const stopTimers = () => {
    timersRef.current.forEach(t => clearInterval(t));
    timersRef.current = [];
  };

  // 进入第二步:按当前上传素材初始化并发生成任务
  const goGenerate = () => {
    if (!hasFiles) return message.warning('请先上传素材视频');
    stopTimers();

    const tasks: GenTask[] = uploadedFiles.map(f => ({
      fileId: f.id,
      title: f.name.replace(/\.[^.]+$/, ''),
      progress: 0,
      done: false,
    }));
    setGenTasks(tasks);
    setStep(2);

    // 每个任务独立推进(不同速率,演示并发生成)
    tasks.forEach((task, i) => {
      const speed = 4 + (i % 3) * 2; // 4/6/8 每档
      let p = 0;
      const t = window.setInterval(() => {
        p = Math.min(100, p + speed);
        const finished = p >= 100;
        setGenTasks(prev =>
          prev.map(g =>
            g.fileId === task.fileId
              ? {
                  ...g,
                  progress: p,
                  done: finished,
                }
              : g
          )
        );
        if (finished) clearInterval(t);
      }, 120);
      timersRef.current.push(t);
    });
  };

  // 返回第一步重新配置
  const backToUpload = () => {
    stopTimers();
    setGenTasks([]);
    setStep(1);
  };

  const downloadOne = (title: string) =>
    message.success(`开始下载「${title}」(前贴 ${duration}s · ${style.name})`);

  const downloadAll = () =>
    message.success(`开始批量下载 ${doneTasks.length} 个前贴视频(前贴 ${duration}s · ${style.name})`);

  const footer = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: 24,
        paddingTop: 16,
        borderTop: '1px solid #f3f4f6',
      }}
    >
      {step === 1 && (
        <Button type="primary" className="gradient-btn" size="large" onClick={goGenerate}>
          生成视频 <ArrowRightOutlined />
        </Button>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <TopSteps current={step} steps={['上传素材', '生成视频']} />

      {/* ============ 第一步:上传素材 + 时长/风格设置 ============ */}
      {step === 1 && (
        <div className="section-card" style={{ padding: 28 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              <RocketOutlined style={{ color: '#ec4899', marginRight: 8 }} />
              上传素材视频,设置前贴时长与风格
            </div>
            <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 6 }}>
              支持批量上传多个视频;AI 将按所选风格生成前贴,并叠加到每个素材视频开头
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {/* 左侧:素材上传(批量) */}
            <div style={{ flex: '1 1 52%', minWidth: 0 }}>
              <VideoUploader multiple />
            </div>

            {/* 右侧:前贴设置 */}
            <div style={{ flex: '1 1 48%', minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>前贴时长</div>
              <Radio.Group
                value={duration}
                onChange={e => setDuration(e.target.value)}
                style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}
              >
                {[20, 30, 40].map(v => (
                  <Radio.Button key={v} value={v} style={{ borderRadius: 6 }}>{v}秒</Radio.Button>
                ))}
              </Radio.Group>

              <div style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>前贴风格化</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
                {prefaceStyles.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setStyleId(p.id)}
                    style={{
                      border: `2px solid ${styleId === p.id ? '#ec4899' : '#e5e7eb'}`,
                      borderRadius: 8,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'border-color .15s',
                    }}
                  >
                    <div style={{ height: 46, background: p.example, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>
                      {p.name}
                    </div>
                    <div style={{ padding: '5px 6px', fontSize: 10.5, color: '#6b7280', lineHeight: 1.4 }}>
                      {p.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {footer}
        </div>
      )}

      {/* ============ 第二步(生成中):逐素材并发生成卡 ============ */}
      {step === 2 && !genAllFinished && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 0 20px',
              fontSize: 13.5,
              color: '#ec4899',
              fontWeight: 600,
            }}
          >
            <PlusCircleFilled style={{ color: '#ec4899' }} />
            {genTasks.length} 个前贴视频创作中…
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}
          >
            {genTasks.map(g => (
              <PrefaceGenCard
                key={g.fileId}
                title={g.title}
                styleName={style.name}
                duration={duration}
                progress={g.progress}
                done={g.done}
              />
            ))}
          </div>
        </div>
      )}

      {/* ============ 第二步(完成态):成片视频列表(一行 3 个,单个/批量下载) ============ */}
      {step === 2 && genAllFinished && (
        <div className="section-card" style={{ padding: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1f2937' }}>
              <CheckCircleFilled style={{ color: '#10b981', marginRight: 8 }} />
              视频生成完成
              <span style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 400, marginLeft: 10 }}>
                共生成 {doneTasks.length} 个前贴视频 · {style.name} · {duration}秒
              </span>
            </div>
            <Button
              type="primary"
              className="gradient-btn"
              icon={<DownloadOutlined />}
              disabled={!doneTasks.length}
              onClick={downloadAll}
            >
              批量下载{doneTasks.length ? `(${doneTasks.length})` : ''}
            </Button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}
          >
            {doneTasks.map(g => {
              const src = uploadedFiles.find(f => f.id === g.fileId);
              return (
                <PrefaceResultCard
                  key={g.fileId}
                  title={g.title}
                  styleName={style.name}
                  duration={duration}
                  totalSec={(src?.duration ?? 60) + duration}
                  gradient={style.example}
                  onDownload={() => downloadOne(g.title)}
                />
              );
            })}
          </div>
          <div
            style={{
              textAlign: 'center',
              marginTop: 24,
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <Button onClick={backToUpload}>返回上传素材</Button>
            <Button type="primary" className="gradient-btn" onClick={() => setNav('home')}>
              返回首页
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 生成中的任务卡:渐变头部 + 进度 + 子步骤列表 + 标题
 */
const PrefaceGenCard = ({
  title,
  styleName,
  duration,
  progress,
  done,
}: {
  title: string;
  styleName: string;
  duration: number;
  progress: number;
  done: boolean;
}) => {
  const remainSec = Math.max(5, Math.round((1 - progress / 100) * 30));
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* 上半部:渐变 + loading 圈 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)',
          padding: '30px 16px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {done ? (
          <CheckCircleFilled style={{ fontSize: 36, color: '#10b981' }} />
        ) : (
          <LoadingOutlined style={{ fontSize: 32, color: '#ec4899' }} />
        )}
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginTop: 12 }}>
          {done ? '生成完成' : `创作中 ${progress.toFixed(0)}%`}
        </div>
        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 4 }}>
          {done ? '已加入成片列表' : `预计还需 ${remainSec} 秒`}
        </div>
      </div>

      {/* 底部:标题 + 风格/时长 */}
      <div style={{ padding: '16px 16px 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{title}</div>
        <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>
          前贴 {styleName} · {duration}秒
        </div>
      </div>
    </div>
  );
};

/**
 * 生成完成后的成片卡:16:9 渐变封面 + 播放按钮 + 总时长角标 + 单个下载
 */
const PrefaceResultCard = ({
  title,
  styleName,
  duration,
  totalSec,
  gradient,
  onDownload,
}: {
  title: string;
  styleName: string;
  duration: number;
  totalSec: number;
  gradient: string;
  onDownload: () => void;
}) => {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* 封面:风格渐变 + 播放按钮 + 总时长角标 */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '16 / 9',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PlayCircleFilled
          style={{
            fontSize: 42,
            color: 'rgba(255,255,255,0.92)',
            textShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
        />
        {/* 前贴角标 */}
        <div
          style={{
            position: 'absolute',
            left: 8,
            top: 8,
            padding: '1px 7px',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: 10.5,
            borderRadius: 4,
          }}
        >
          AI 前贴 {duration}s
        </div>
        {/* 总时长角标 */}
        <div
          style={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            padding: '1px 7px',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: 10.5,
            fontFamily: 'monospace',
            borderRadius: 4,
          }}
        >
          {fmtTime(totalSec)}
        </div>
      </div>
      {/* 信息 + 单个下载 */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div
          title={title}
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: '#1f2937',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 4 }}>
          前贴 {styleName} · {duration}秒 · 总时长 {fmtTime(totalSec)}
        </div>
        <Button
          block
          size="small"
          icon={<DownloadOutlined />}
          onClick={onDownload}
          style={{ marginTop: 10 }}
        >
          下载视频
        </Button>
      </div>
    </div>
  );
};

export default Scene6Preface;
