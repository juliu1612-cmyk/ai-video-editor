import { useMemo, useState } from 'react';
import { Button, Tag, Row, Col, message, Card, Divider, Select, Skeleton, Checkbox } from 'antd';
import {
  ThunderboltOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  CheckCircleFilled,
  VideoCameraOutlined,
  SettingOutlined,
  LoadingOutlined,
  ApiOutlined,
  FileTextOutlined,
  TagsOutlined,
  StarFilled,
  BulbOutlined,
  PlusCircleFilled,
  TeamOutlined,
  FireOutlined,
  ThunderboltFilled,
  HeartFilled,
  CrownOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import VideoUploader from '../components/VideoUploader';
import PreviewPlayer from '../components/PreviewPlayer';
import TopSteps from '../components/TopSteps';
import { scriptSets, type ScriptSet } from '../mock/highlights';
import { useApp } from '../context/AppContext';

// 四个状态页:上传 → 分析 → 创意方案 → 生成
// 顶部的 TopSteps 始终按 3 个语义步骤渲染(理解分析/创意方案/生成解说视频)
const Phase = {
  Upload: 1,
  Analyze: 2,
  Plans: 3,
  Generate: 4,
} as const;
type PhaseValue = (typeof Phase)[keyof typeof Phase];

// 分析完成后,基于当前剧集高光片段扩展为 10 条卖点(参考图)
const buildSellingPoints = (s: ScriptSet): string[] => {
  const points: string[] = [];
  s.highlights.forEach(h => {
    points.push(h.desc);
  });
  // 高光不足 10 条时,用情感类型 + 高光类型组合补足
  let i = 0;
  while (points.length < 10) {
    const emo = s.emotionTypes[i % s.emotionTypes.length]?.name ?? '强冲突';
    const t = s.highlights[i % s.highlights.length]?.type ?? '钩子';
    points.push(`${emo}驱动的「${t}」高光,极具话题传播度`);
    i++;
  }
  return points.slice(0, 10);
};

// 第二步参考图:每张方案卡片顶部都有「人物关系 / 冲突升级」类分类标签
const CATEGORIES = ['人物关系', '冲突升级', '情感拉扯', '反转向', '权谋暗战', '草根逆袭'];

// 第二步参考图:每个方案 4 段解说词(中文 1/2/3/4),基于高光衍生
const buildNarrations = (s: ScriptSet): string[] => {
  // 取前 4 个高光描述展开为 4 段;不足则用情感类型补足
  const segs: string[] = [];
  s.highlights.slice(0, 4).forEach(h => {
    segs.push(`本集剧情中,${h.desc};镜头从${h.type}切入,层层递进,牢牢抓住观众眼球。`);
  });
  let i = 0;
  while (segs.length < 4) {
    const emo = s.emotionTypes[i % s.emotionTypes.length]?.name ?? '强冲突';
    segs.push(`${emo}持续升温,主线剧情加速推进,期待下一集的爆发时刻。`);
    i++;
  }
  return segs.slice(0, 4);
};

// ---------- 第一页:混剪配置 ----------
interface MixConfig {
  originLang: string;   // 原视频语言
  narratorLang: string; // 解说语言
  voice: string;        // 音色
  duration: number;     // 生产视频时长(秒)
}

const originLangOptions = [
  { label: '中文', value: '中文' },
  { label: '粤语', value: '粤语' },
  { label: '英文', value: '英文' },
  { label: '日文', value: '日文' },
  { label: '韩文', value: '韩文' },
  { label: '泰语', value: '泰语' },
];

const narratorLangOptions = [
  { label: '中文', value: '中文' },
  { label: '英文', value: '英文' },
  { label: '日文', value: '日文' },
  { label: '韩文', value: '韩文' },
  { label: '西班牙文', value: '西班牙文' },
];

const voiceOptions = [
  { label: '知性女声', value: '知性女声' },
  { label: '磁性男声', value: '磁性男声' },
  { label: '活泼甜音', value: '活泼甜音' },
  { label: '沉稳大叔音', value: '沉稳大叔音' },
  { label: '旁白主播音', value: '旁白主播音' },
];

const durationOptions = [
  { label: '1 分钟', value: 60 },
  { label: '3 分钟', value: 180 },
  { label: '5 分钟', value: 300 },
  { label: '10 分钟', value: 600 },
];

const defaultConfig: MixConfig = {
  originLang: '中文',
  narratorLang: '中文',
  voice: '知性女声',
  duration: 180,
};

const Scene1MixedCut = () => {
  const { uploadedFiles, setNav } = useApp();
  const [phase, setPhase] = useState<PhaseValue>(1);

  // 第一页:理解分析进度(由独立分析页使用,0-100)
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  // 第一页:混剪配置(原视频语言/解说语言/音色/生产视频时长)
  const [config, setConfig] = useState<MixConfig>(defaultConfig);

  // 第二页:创意方案选择
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(scriptSets[0].id);

  // 第三页:多文件并发生成状态(每素材一卡)
  interface GenFile {
    fileId: string;
    title: string;
    progress: number;
    stepIndex: number; // 0..3 高光片段提取/解说字幕/解说音频/解说视频
    done: boolean;
    failed: boolean;
  }
  const [genFiles, setGenFiles] = useState<GenFile[]>([]);

  const script = useMemo(
    () => scriptSets.find(s => s.id === selectedScriptId) ?? scriptSets[0],
    [selectedScriptId]
  );

  // 第一页:点击「开始理解分析」→ 跳到独立分析页(Phase.Analyze),
  // 分析动画在分析页内完成:4 个子卡随进度阈值(25/50/75/100%)从上到下依次填充;
  // 全部填充完成后停留 900ms,自动跳到 Phase.Plans
  const runAnalyze = () => {
    if (!uploadedFiles.length) return message.warning('请先上传素材');
    setAnalyzeProgress(0);
    setPhase(Phase.Analyze);
    let p = 0;
    const t = setInterval(() => {
      p += 2 + Math.random() * 3; // 节奏更慢,给用户看清填充过程
      if (p >= 100) {
        p = 100;
        clearInterval(t);
        setAnalyzeProgress(100);
        message.success('剧情分析完成,自动进入创意方案');
        setTimeout(() => setPhase(Phase.Plans), 900);
      } else {
        setAnalyzeProgress(p);
      }
    }, 140);
  };

  // 第二页:一键全选 = 选中所有方案的高光片段(取最后一个作为 selectedScriptId)
  const selectAllScripts = () => {
    message.success(`已全选 ${scriptSets.length} 个方案的全部高光`);
  };

  // 创意方案 → 生成:每个素材一张并发生成卡(参考图)
  const runGenerate = () => {
    // 初始化:每个 uploadedFile 一张卡
    const initFiles: GenFile[] = uploadedFiles.map(f => ({
      fileId: f.id,
      title: f.name.replace(/\.[^/.]+$/, '') || f.name, // 去后缀
      progress: 0,
      stepIndex: 0,
      done: false,
      failed: false,
    }));
    setGenFiles(initFiles);
    setPhase(Phase.Generate);

    // 每个文件独立 interval 推进
    const newTimers: Record<string, ReturnType<typeof setInterval>> = {};
    initFiles.forEach(f => {
      const t = setInterval(() => {
        setGenFiles(prev => {
          const cur = prev.find(x => x.fileId === f.fileId);
          if (!cur || cur.done) return prev;
          let p = cur.progress + 4 + Math.random() * 6;
          let stepIndex = cur.stepIndex;
          // 进度阈值推进到下一步
          if (p >= 25 && stepIndex === 0) stepIndex = 1;
          if (p >= 55 && stepIndex === 1) stepIndex = 2;
          if (p >= 85 && stepIndex === 2) stepIndex = 3;
          if (p >= 100) {
            p = 100;
            stepIndex = 3;
            // 失败概率 8% 模拟
            const failed = Math.random() < 0.08;
            const tm = newTimers[f.fileId];
            if (tm) clearInterval(tm);
            return prev.map(x => x.fileId === f.fileId ? { ...x, progress: 100, stepIndex, done: !failed, failed } : x);
          }
          return prev.map(x => x.fileId === f.fileId ? { ...x, progress: p, stepIndex } : x);
        });
      }, 220);
      newTimers[f.fileId] = t;
    });
  };

  // 全部生成完成时显示返回首页按钮
  const allGenDone = genFiles.length > 0 && genFiles.every(g => g.done);
  const goToHome = () => setNav('home');

  // TopSteps 步骤状态(始终按 3 个语义步骤渲染)
  const topCurrent =
    phase === Phase.Upload ? 1 :
    phase === Phase.Analyze ? 1 :
    phase === Phase.Plans ? 2 :
    3;

  // 页脚按钮(与替换 Logo 场景同款风格)
  const footer = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 16,
        borderTop: '1px solid #f3f4f6',
      }}
    >
      {phase === Phase.Upload && (
        <>
          <span />
          <Button
            type="primary"
            className="gradient-btn"
            size="large"
            disabled={!uploadedFiles.length}
            onClick={runAnalyze}
          >
            开始理解分析 <ArrowRightOutlined />
          </Button>
        </>
      )}
      {phase === Phase.Plans && (
        <>
          <Button icon={<ArrowLeftOutlined />} onClick={() => setPhase(Phase.Upload)}>
            上一步
          </Button>
          <Button type="primary" className="gradient-btn" size="large" onClick={runGenerate}>
            生成解说视频 <ArrowRightOutlined />
          </Button>
        </>
      )}
      {phase === Phase.Generate && <span />}
      {phase === Phase.Analyze && <span />}
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <TopSteps
        current={topCurrent}
        steps={['理解分析', '创意方案', '生成解说视频']}
      />

      {/* ============ 第一页:上传素材 + 混剪配置 + 理解分析 ============ */}
      {phase === 1 && (
        <div className="section-card" style={{ padding: 28 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              <ThunderboltOutlined style={{ color: '#6366f1', marginRight: 8 }} />
              上传剧集视频,完成后开始理解分析
            </div>
            <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 6 }}>
              左侧上传视频素材(可多个);右侧设置原视频语言、解说语言、音色与生产视频时长
            </div>
          </div>

          <Row gutter={16}>
            {/* 左:上传视频素材 */}
            <Col xs={24} md={12}>
              <div
                style={{
                  border: `2px solid ${uploadedFiles.length ? '#10b981' : '#e5e7eb'}`,
                  borderRadius: 14,
                  padding: 16,
                  height: '100%',
                  position: 'relative',
                }}
              >
                {uploadedFiles.length > 0 && (
                  <CheckCircleFilled
                    style={{ position: 'absolute', top: 10, right: 10, color: '#10b981', fontSize: 16 }}
                  />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <VideoCameraOutlined style={{ color: '#6366f1', fontSize: 18 }} />
                  <strong>① 视频素材</strong>
                  <span style={{ fontSize: 11, color: '#ef4444' }}>必填</span>
                </div>
                <VideoUploader
                  multiple
                  title="上传视频素材(可多选)"
                  desc="支持批量上传多个视频,mp4/mov,单个≤2G"
                />
              </div>
            </Col>

            {/* 右:混剪配置 */}
            <Col xs={24} md={12}>
              <div
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: 14,
                  padding: 16,
                  height: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <SettingOutlined style={{ color: '#f59e0b', fontSize: 18 }} />
                  <strong>② 混剪配置</strong>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>影响解说生成</span>
                </div>
                <Row gutter={[12, 14]}>
                  <Col span={12}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>原视频语言</div>
                    <Select
                      value={config.originLang}
                      options={originLangOptions}
                      onChange={v => setConfig(c => ({ ...c, originLang: v }))}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>解说语言</div>
                    <Select
                      value={config.narratorLang}
                      options={narratorLangOptions}
                      onChange={v => setConfig(c => ({ ...c, narratorLang: v }))}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>解说音色</div>
                    <Select
                      value={config.voice}
                      options={voiceOptions}
                      onChange={v => setConfig(c => ({ ...c, voice: v }))}
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={12}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>生产视频时长</div>
                    <Select
                      value={config.duration}
                      options={durationOptions}
                      onChange={v => setConfig(c => ({ ...c, duration: v }))}
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          {footer}
        </div>
      )}

      {/* ============ 分析页(参考图风格):原片缩略图 + 进度行 + 4 个分析子卡从上到下依次填充 ============ */}
      {phase === Phase.Analyze && (
        <AnalyzePage
          fileName={uploadedFiles[0]?.name ?? '原片 剧集'}
          cover={uploadedFiles[0]?.cover}
          duration={uploadedFiles[0]?.duration ?? 0}
          progress={analyzeProgress}
          script={script}
          filledCount={
            analyzeProgress >= 100 ? 4 :
            analyzeProgress >= 75 ? 3 :
            analyzeProgress >= 50 ? 2 :
            analyzeProgress >= 25 ? 1 : 0
          }
        />
      )}

      {/* ============ 第三页:创意方案 ============ */}
      {phase === Phase.Plans && (
        <div className="section-card" style={{ padding: 28 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              <CheckCircleFilled style={{ color: '#10b981', marginRight: 8 }} />
              理解分析完成,请选择创意方案
            </div>
            <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 6 }}>
              共 {scriptSets.length} 个方案;选择后可在时间轴上勾选/取消高光片段
            </div>
          </div>

          <Row gutter={16}>
            {/* 左:分析结果 + 预览 */}
            <Col span={8}>
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 10 }}>剧集类型</div>
                <Tag color="purple">都市 / 复仇 / 爽剧</Tag>
                <div style={{ marginTop: 10, fontSize: 12.5, color: '#374151', lineHeight: 1.6 }}>
                  {script.summary}
                </div>
                <Divider style={{ margin: '12px 0 10px' }} />
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  情感类型 <span style={{ color: '#6366f1' }}>{script.emotionTypes.length}</span>
                </div>
                <Row gutter={[8, 8]}>
                  {script.emotionTypes.map(e => (
                    <Col span={12} key={e.name}>
                      <div
                        style={{
                          padding: 10, background: '#fff', borderRadius: 8,
                          fontSize: 12, height: '100%', border: '1px solid #f3f4f6',
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{e.name}</div>
                        <div style={{ color: '#6b7280', lineHeight: 1.5 }}>{e.desc}</div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>

              <Card title="预览" size="small">
                <PreviewPlayer url={uploadedFiles[0]?.url} />
              </Card>
            </Col>

            {/* 右:创意方案横向卡片(参考图风格) */}
            <Col span={16}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <div style={{ fontWeight: 600 }}>
                  创意方案 <span style={{ color: '#6366f1' }}>{scriptSets.length}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="small" onClick={selectAllScripts}>
                    一键全选
                  </Button>
                  <Button
                    type="primary"
                    className="gradient-btn"
                    size="small"
                    onClick={runGenerate}
                  >
                    生成解说
                  </Button>
                </div>
              </div>

              <div
                id="plans-scroll"
                style={{
                  display: 'flex',
                  gap: 12,
                  overflowX: 'auto',
                  paddingBottom: 8,
                  position: 'relative',
                }}
              >
                {scriptSets.map((s, idx) => {
                  const selected = selectedScriptId === s.id;
                  const cat = CATEGORIES[idx % CATEGORIES.length];
                  return (
                    <div
                      key={s.id}
                      style={{ minWidth: 280, maxWidth: 280, flex: '0 0 280px' }}
                    >
                      <PlanCard
                        category={cat}
                        title={s.title}
                        script={s}
                        selected={selected}
                        onSelect={() => setSelectedScriptId(s.id)}
                        voice={config.voice}
                        narratorLang={config.narratorLang}
                      />
                    </div>
                  );
                })}
                {/* 右侧滚动提示按钮 */}
                <div
                  style={{
                    position: 'sticky',
                    right: 0,
                    alignSelf: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    background: 'rgba(99,102,241,0.92)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                    flex: '0 0 36px',
                  }}
                  onClick={() => {
                    const el = document.getElementById('plans-scroll');
                    if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
                  }}
                >
                  →
                </div>
              </div>
            </Col>
          </Row>

          {footer}
        </div>
      )}

      {/* ============ 第四页:生成解说视频(参考图风格:多卡并发生成) ============ */}
      {phase === Phase.Generate && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 0 20px',
              fontSize: 13.5,
              color: '#6366f1',
              fontWeight: 600,
            }}
          >
            <PlusCircleFilled style={{ color: '#6366f1' }} />
            {genFiles.length} 个解说视频创作中…
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
              maxWidth: 760,
              margin: '0 auto',
            }}
          >
            {genFiles.map(g => (
              <GenerateCard
                key={g.fileId}
                title={g.title}
                language={config.narratorLang}
                progress={g.progress}
                stepIndex={g.stepIndex}
                estimatedSec={Math.round(config.duration * 2.4)}
                done={g.done}
                failed={g.failed}
              />
            ))}
          </div>
          {allGenDone && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button type="primary" className="gradient-btn" onClick={goToHome}>
                返回首页
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 独立分析页(参考图风格):
 * - 顶部:原片 剧集 N + 视频缩略图(显示文件名 + 时长)
 * - 进度行:分析中 "AI 正在逐集分析剧情,已完成 X%,预计还需 N 分钟";
 *         分析完成 "剧情分析完成"(绿色对勾)
 * - 4 个分析子卡(白底圆角边框):
 *   1) 剧集类型   2) 剧情概览   3) 情感类型 N(2x2)   4) 卖点内容 10(编号列表)
 *   - 分析中:渲染骨架条(Skeleton)
 *   - 完成:渲染真实内容
 */
const AnalyzePage = ({
  fileName,
  cover,
  duration,
  progress,
  script,
  filledCount,
}: {
  fileName: string;
  cover?: string;
  duration: number;
  progress: number;
  script: ScriptSet;
  /** 已从上到下完成填充的子卡数量(0-4) */
  filledCount: number;
}) => {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const allDone = filledCount >= 4;
  // 预计还需 N 分钟:总耗时约 5 分钟(模拟),根据当前进度反算剩余
  const totalSeconds = 300;
  const remainSec = allDone ? 0 : Math.max(1, Math.round(totalSeconds * (1 - progress / 100)));
  const remainMin = Math.max(1, Math.ceil(remainSec / 60));
  const sellingPoints = useMemo(() => buildSellingPoints(script), [script]);

  return (
    <div className="section-card" style={{ padding: 24, maxWidth: 760, margin: '0 auto' }}>
      {/* 顶部:原片 剧集 1 + 缩略图 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <FileTextOutlined style={{ color: '#6366f1', fontSize: 16 }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>原片 剧集 1</span>
      </div>
      <div
        style={{
          position: 'relative',
          width: 88,
          height: 56,
          borderRadius: 6,
          background: cover || 'linear-gradient(135deg, #6366f1, #a855f7)',
          overflow: 'hidden',
          marginBottom: 18,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            padding: '2px 6px',
            background: 'rgba(0,0,0,0.5)',
            color: '#fff',
            fontSize: 11,
            fontFamily: 'monospace',
            borderTopRightRadius: 6,
          }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {fileName}
      </div>

      {/* 进度行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <BulbOutlined style={{ color: '#6366f1', fontSize: 16 }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>剧情分析</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12.5,
          color: allDone ? '#10b981' : '#6366f1',
          marginBottom: 20,
        }}
      >
        {allDone ? (
          <CheckCircleFilled style={{ color: '#10b981' }} />
        ) : (
          <LoadingOutlined />
        )}
        {allDone
          ? '剧情分析完成'
          : `AI 正在逐集分析剧情,已完成 ${progress.toFixed(0)}%,预计还需 ${remainMin} 分钟`}
      </div>

      {/* 4 个分析子卡:从上到下依次填充(剧集类型 → 剧情概览 → 情感类型 → 卖点内容) */}
      <AnalyzeCard icon={<TagsOutlined />} title="剧集类型" filled={filledCount > 0}>
        {filledCount > 0 ? (
          <Tag color="purple" style={{ marginTop: 4 }}>
            都市 / 复仇 / 爽剧
          </Tag>
        ) : (
          <Skeleton.Input active size="small" style={{ width: 220, marginTop: 8 }} />
        )}
      </AnalyzeCard>

      <AnalyzeCard icon={<FileTextOutlined />} title="剧情概览" filled={filledCount > 1}>
        {filledCount > 1 ? (
          <div style={{ fontSize: 12.5, color: '#374151', lineHeight: 1.7, marginTop: 4 }}>
            {script.summary}
          </div>
        ) : (
          <div style={{ marginTop: 4 }}>
            <Skeleton active paragraph={{ rows: 3 }} title={false} />
          </div>
        )}
      </AnalyzeCard>

      <AnalyzeCard
        icon={<ApiOutlined />}
        title={`情感类型 ${filledCount > 2 ? script.emotionTypes.length : ''}`}
        filled={filledCount > 2}
      >
        {filledCount > 2 ? (
          <Row gutter={[10, 10]} style={{ marginTop: 4 }}>
            {script.emotionTypes.map(e => (
              <Col span={12} key={e.name}>
                <div
                  style={{
                    padding: 10,
                    background: '#f9fafb',
                    borderRadius: 8,
                    fontSize: 12,
                    height: '100%',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{e.name}</div>
                  <div style={{ color: '#6b7280', lineHeight: 1.55 }}>{e.desc}</div>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ marginTop: 6, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Skeleton.Input active size="small" style={{ height: 60 }} />
            <Skeleton.Input active size="small" style={{ height: 60 }} />
            <Skeleton.Input active size="small" style={{ height: 60 }} />
            <Skeleton.Input active size="small" style={{ height: 60 }} />
          </div>
        )}
      </AnalyzeCard>

      <AnalyzeCard
        icon={<StarFilled style={{ color: '#f59e0b' }} />}
        title={`卖点内容 ${filledCount > 3 ? sellingPoints.length : ''}`}
        filled={filledCount > 3}
      >
        {filledCount > 3 ? (
          <ol style={{ margin: '4px 0 0 0', padding: 0, listStyle: 'none' }}>
            {sellingPoints.map((p, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '8px 10px',
                  background: i % 2 ? '#f9fafb' : '#fff',
                  border: '1px solid #f3f4f6',
                  borderRadius: 6,
                  fontSize: 12.5,
                  color: '#374151',
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    minWidth: 22,
                    height: 22,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ flex: 1, lineHeight: 1.6 }}>{p}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton.Input key={i} active size="small" style={{ height: 18, width: '100%' }} />
            ))}
          </div>
        )}
      </AnalyzeCard>
    </div>
  );
};

/** 单个分析子卡:左 icon + 标题 + 填充完成对勾,内容由 children 渲染 */
const AnalyzeCard = ({
  icon,
  title,
  filled,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  filled?: boolean;
  children: React.ReactNode;
}) => {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${filled ? '#d1fae5' : '#eef0f4'}`,
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 12,
        transition: 'border-color .3s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#1f2937' }}>
        <span style={{ color: '#6366f1' }}>{icon}</span>
        {title}
        <span style={{ flex: 1 }} />
        {filled && (
          <CheckCircleFilled style={{ color: '#10b981', fontSize: 14 }} />
        )}
      </div>
      {children}
    </div>
  );
};

export default Scene1MixedCut;

// 分类 → emoji 映射(参考图)
const CATEGORY_ICON: Record<string, React.ReactNode> = {
  '人物关系': <TeamOutlined />,
  '冲突升级': <FireOutlined />,
  '情感拉扯': <HeartFilled />,
  '反转向': <ThunderboltFilled />,
  '权谋暗战': <CrownOutlined />,
  '草根逆袭': <RocketOutlined />,
};

// 高光类型颜色(与时间轴保持一致)
const TYPE_COLOR: Record<string, { bg: string; text: string }> = {
  '钩子': { bg: '#ecfdf5', text: '#10b981' },
  '推进': { bg: '#eff6ff', text: '#3b82f6' },
  '爽点': { bg: '#fffbeb', text: '#f59e0b' },
  '反转': { bg: '#faf5ff', text: '#a855f7' },
  '断点': { bg: '#fef2f2', text: '#ef4444' },
};

/** 格式化秒为 mm:ss */
const fmtTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * 第二步:创意方案卡片(参考图风格)
 * - 顶部:emoji 分类 + 标题(可勾选)
 * - 视频结构故事线
 * - 高光片段列表(时间 + 类型彩色标签 + 描述)
 * - 解说词(可编辑) + 语言/音色
 * - 4 段解说词文本(中文 1..4)
 */
const PlanCard = ({
  category,
  title,
  script,
  selected,
  onSelect,
  voice,
  narratorLang,
}: {
  category: string;
  title: string;
  script: ScriptSet;
  selected: boolean;
  onSelect: () => void;
  voice: string;
  narratorLang: string;
}) => {
  const narrations = useMemo(() => buildNarrations(script), [script]);
  return (
    <div
      onClick={onSelect}
      style={{
        background: selected ? '#eef2ff' : '#fff',
        border: `1.5px solid ${selected ? '#6366f1' : '#e5e7eb'}`,
        borderRadius: 10,
        padding: 12,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'all .2s',
      }}
    >
      {/* 顶部:分类 + 标题 + 勾选框 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6366f1', fontWeight: 600, marginBottom: 4 }}>
        <span style={{ fontSize: 13 }}>{CATEGORY_ICON[category] ?? <TagsOutlined />}</span>
        {category}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 6,
          fontSize: 13,
          fontWeight: 600,
          color: '#1f2937',
          lineHeight: 1.4,
          marginBottom: 8,
          minHeight: 36,
        }}
      >
        <Checkbox
          checked={selected}
          onClick={e => e.stopPropagation()}
          onChange={onSelect}
          style={{ marginTop: 2 }}
        />
        <span style={{ flex: 1 }}>{title}</span>
      </div>

      {/* 视频结构故事线 */}
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>视频结构故事线</div>

      {/* 高光片段列表 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          marginBottom: 10,
          maxHeight: 150,
          overflowY: 'auto',
        }}
      >
        {script.highlights.map(h => {
          const c = TYPE_COLOR[h.type] ?? { bg: '#f3f4f6', text: '#6b7280' };
          return (
            <div
              key={h.id}
              style={{
                display: 'flex',
                gap: 8,
                fontSize: 11.5,
                color: '#374151',
                lineHeight: 1.5,
              }}
            >
              <div style={{ minWidth: 56, fontFamily: 'monospace', color: '#6b7280' }}>
                <div>{fmtTime(h.start)}</div>
                <div>{fmtTime(h.end)}</div>
              </div>
              <div
                style={{
                  background: c.bg,
                  color: c.text,
                  fontSize: 10.5,
                  padding: '1px 6px',
                  borderRadius: 3,
                  fontWeight: 600,
                  alignSelf: 'flex-start',
                  flexShrink: 0,
                }}
              >
                {h.type}
              </div>
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {h.desc}
              </div>
            </div>
          );
        })}
      </div>

      <Divider style={{ margin: '0 0 8px' }} />

      {/* 解说词(可编辑) + 语言选择 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#374151' }}>
          <FileTextOutlined style={{ marginRight: 4 }} />
          解说词 <span style={{ color: '#9ca3af', fontWeight: 400 }}>(可编辑)</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11.5,
            color: '#6b7280',
          }}
        >
          <span>{narratorLang}</span>
          <div
            style={{
              width: 22, height: 22, borderRadius: 11,
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              color: '#fff', fontSize: 10, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            云
          </div>
          <span>{voice}</span>
        </div>
      </div>

      {/* 多段解说词 */}
      <div
        style={{
          background: '#fafafa',
          borderRadius: 6,
          padding: 8,
          maxHeight: 110,
          overflowY: 'auto',
        }}
      >
        {narrations.map((n, i) => (
          <div key={i} style={{ fontSize: 11, lineHeight: 1.6, color: '#374151', marginBottom: 4 }}>
            <div style={{ color: '#6366f1', fontWeight: 600, marginBottom: 2 }}>
              {narratorLang} {i + 1}
            </div>
            <div>{n}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 第三步:单个解说视频生成卡(参考图风格)
 * - 上半部:渐变背景 + 中心 loading 圈
 * - 进度文案 + 4 步列表
 * - 底部:标题 + 语言
 */
const GenerateCard = ({
  title,
  language,
  progress,
  stepIndex,
  estimatedSec,
  done,
  failed,
}: {
  title: string;
  language: string;
  progress: number;
  stepIndex: number;
  estimatedSec: number;
  done: boolean;
  failed: boolean;
}) => {
  const remainMin = Math.max(1, Math.ceil((estimatedSec * (1 - progress / 100)) / 60));
  const steps = ['高光片段提取', '生成解说字幕', '生成解说音频', '生成解说视频'];
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${failed ? '#fecaca' : '#e5e7eb'}`,
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* 上半部:渐变 + loading 圈 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #fbcfe8 100%)',
          padding: '32px 16px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {done ? (
          <CheckCircleFilled style={{ fontSize: 36, color: '#10b981' }} />
        ) : failed ? (
          <div style={{ color: '#ef4444', fontSize: 32 }}>✕</div>
        ) : (
          <LoadingOutlined style={{ fontSize: 32, color: '#6366f1' }} />
        )}
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', marginTop: 12 }}>
          {failed ? '生成失败' : done ? '生成完成' : `创作中 ${progress.toFixed(0)}%`}
        </div>
        <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 4 }}>
          {failed ? '请稍后重试' : done ? '已加入成片列表' : `预计还需 ${remainMin} 分钟`}
        </div>
      </div>

      {/* 步骤列表 */}
      <div style={{ padding: '12px 16px 0' }}>
        {steps.map((s, i) => {
          const finished = stepIndex > i || (done && i === 3) || (failed && i > stepIndex);
          const current = !failed && !done && stepIndex === i;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                fontSize: 12,
                color: finished ? '#6b7280' : current ? '#6366f1' : '#9ca3af',
                borderBottom: i < steps.length - 1 ? '1px dashed #f3f4f6' : 'none',
              }}
            >
              {finished ? (
                <CheckCircleFilled style={{ color: '#10b981', fontSize: 13 }} />
              ) : current ? (
                <LoadingOutlined style={{ color: '#6366f1', fontSize: 13 }} />
              ) : (
                <span
                  style={{
                    display: 'inline-block',
                    width: 13,
                    height: 13,
                    borderRadius: 7,
                    border: '1.5px solid #d1d5db',
                  }}
                />
              )}
              <span style={{ flex: 1, fontWeight: current ? 600 : 400 }}>{s}</span>
            </div>
          );
        })}
      </div>

      {/* 底部:成片标题 + 语言 */}
      <div style={{ padding: '12px 16px 16px', marginTop: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{title}?</div>
        <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>{language}</div>
      </div>
    </div>
  );
};
