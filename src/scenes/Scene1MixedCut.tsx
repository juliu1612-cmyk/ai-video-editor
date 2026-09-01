import { useMemo, useState, useRef, useEffect } from 'react';
import { Button, Tag, Row, Col, message, Divider, Select, Skeleton, Checkbox, Input, Modal, Switch } from 'antd';
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
  DownloadOutlined,
  PlayCircleFilled,
} from '@ant-design/icons';
import VideoUploader from '../components/VideoUploader';
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

// 第二步参考图:每个方案独立生成的 4 段解说词(按高光时间线量身定制,与方案主题强相关)
const SCRIPT_NARRATIONS: Record<string, string[]> = {
  s1: [
    '豪门阔太 Bianca 在闺蜜豪宅私会情人 Victor,言语中透露出对丈夫 Leandro 的轻视,镜头从卧室门缝推进,紧张的氛围瞬间拉满。',
    'Victor 举止大度,却暗指 Leandro 可能无法生育,信息差与危机感层层堆叠,观众的好奇心被吊到最高点。',
    '两人并不知道 Leandro 正通过隐藏摄像头全程监控,冷静的丈夫并未当场发难,而是默默策划一场「社会性死亡」的复仇。',
    'Leandro 借妻子举办公益之名,带领大批摄影师和记者强力突袭,计划在众目睽睽之下揭穿丑行,一场修罗场即将开启。',
  ],
  s2: [
    '豪门总裁暗中调查妻子出轨真相,当妻子与情人约会时,镜头对准门锁,暴风雨前的宁静被无限放大。',
    '妻子与情人回到家,推开门的瞬间,客厅的灯被悄悄打开,丈夫的面孔出现在玄关,妻子当场愣住。',
    '总裁没有大吵大闹,而是冷静指挥摄影师团队鱼贯而入,直播设备同步上线,丑闻即将被全网围观。',
    '媒体大军压境直奔二楼卧室,门被一脚踹开,妻子与情人赤裸相对,「公开处刑」模式正式开启。',
  ],
  s3: [
    '豪门娇妻趁丈夫出差带情人回家私会,镜头从玄关缓缓推到客厅,酒红色的灯光映衬着暧昧的气氛。',
    '好情细节坐实拉满观众仇恨,妻子举止轻佻,情人则在一旁肆无忌惮地调侃,完全没有悔意。',
    '丈夫其实早已布下天罗地网,死里逃生归来,悄悄打开了客厅的隐藏摄像头,整个房间尽收眼底。',
    '总裁带着记者团队强势破门,闪光灯在妻子脸上炸开,下一秒,她将迎来「当场社死」的高光时刻。',
  ],
  s4: [
    '总裁出差归来,意外撞见妻子与情人在主卧私会,镜头从走廊尽头一点点推进,丈夫的瞳孔骤然收缩。',
    '他没有大吵大闹,而是默默打开客厅的直播设备,镜头对准卧室方向,所有背叛都将被全网见证。',
    '冷面总裁冷静到可怕,反差感极强,观众的情绪被吊到顶点:他究竟会做出怎样的反击?',
    '当记者们齐刷刷冲进卧室,真相揭晓前最后一秒,丈夫嘴角微微上扬,「社会性死亡」就此开局。',
  ],
  s5: [
    '离婚后前妻火速再嫁豪门,前夫带着亲生儿子上门讨要抚养权,镜头从豪车引擎盖推进,父子并肩站在豪宅门外。',
    '新贵出言嘲讽,试图用千万赔偿让前夫知难而退,观众的怒火被推到顶点,「凭什么欺负老实人」。',
    '亲子鉴定报告被当场甩在茶几上,数据无情打脸豪门,前夫神色平静,只淡淡说了一句:「我只要孩子」。',
    '前妻跪地求复合却被一句话回绝,「我不需要你的钱,孩子我养得起」,典型的「草根逆袭」爽点瞬间引爆。',
  ],
  s6: [
    '含冤入狱三年的总裁出狱前夜,镜头对准监狱大门,前妻带着孩子已经跪在门外,雨点打湿了母子俩的肩。',
    '狱中兄弟道出当年陷害真相,镜头切换到男主角紧握的双拳,三年的隐忍终于看到了破局的曙光。',
    '白月光携秘密文件亲赴现场,镜头在雨幕中定格,「真相」二字随文件缓缓展开,全场屏息。',
    '总裁当面撕毁和解书,牵着白月光的手离开监狱,前妻绝望地瘫坐在地,弹幕刷屏:「恶有恶报」。',
  ],
};

// 根据 script.id 取独立生成的 4 段解说词;若未配置则降级为空数组(由调用方处理)
const getNarrationsForScript = (s: ScriptSet): string[] => SCRIPT_NARRATIONS[s.id] ?? [];

// ---------- 第一页:混剪配置 ----------
interface MixConfig {
  narratorLang: string; // 解说语言
  voice: string;        // 音色
  duration: number;     // 生产视频时长(秒)
}

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
  { label: '2 分钟', value: 120 },
  { label: '3 分钟', value: 180 },
  { label: '4 分钟', value: 240 },
  { label: '5 分钟', value: 300 },
];

const defaultConfig: MixConfig = {
  narratorLang: '中文',
  voice: '知性女声',
  duration: 180,
};

const Scene1MixedCut = () => {
  const { uploadedFiles, setNav } = useApp();
  const [phase, setPhase] = useState<PhaseValue>(1);

  // 第一页:理解分析进度(由独立分析页使用,0-100)
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  // 第一页:混剪配置(解说语言/音色/生产视频时长)
  const [config, setConfig] = useState<MixConfig>(defaultConfig);

  // 第二页:创意方案多选(可同时勾选多个方案,每个选中方案各生成一个解说视频)
  const [selectedIds, setSelectedIds] = useState<string[]>([scriptSets[0].id]);

  // 第二页:方案卡级别语言/音色修改记录(生成页与成片列表按各方案设置展示)
  const [planSettings, setPlanSettings] = useState<Record<string, { lang: string; voice: string }>>({});

  // 第三页:多方案并发生成状态(每个选中方案一卡)
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
    () => scriptSets.find(s => s.id === selectedIds[0]) ?? scriptSets[0],
    [selectedIds]
  );

  // 读取/更新某个方案的语言与音色(未单独修改过则回退到全局混剪配置)
  const getPlanSetting = (id: string) =>
    planSettings[id] ?? { lang: config.narratorLang, voice: config.voice };
  const updatePlanSetting = (id: string, patch: Partial<{ lang: string; voice: string }>) =>
    setPlanSettings(prev => ({
      ...prev,
      [id]: { ...(prev[id] ?? { lang: config.narratorLang, voice: config.voice }), ...patch },
    }));

  // 方案勾选切换(多选)
  const toggleScript = (id: string) =>
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

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

  // 第二页:一键全选/取消全选(多选)
  const allSelected = selectedIds.length === scriptSets.length;
  const selectAllScripts = () => {
    if (allSelected) {
      setSelectedIds([]);
      message.info('已取消全选');
    } else {
      setSelectedIds(scriptSets.map(s => s.id));
      message.success(`已全选 ${scriptSets.length} 个方案,将各生成一个解说视频`);
    }
  };

  // 创意方案 → 生成:每个选中的方案一张并发生成卡(每方案各产出一个解说视频)
  const runGenerate = () => {
    if (!selectedIds.length) return message.warning('请至少选择一个创意方案');
    // 初始化:每个选中方案一张卡,标题为方案标题
    const initFiles: GenFile[] = selectedIds.map(id => {
      const s = scriptSets.find(x => x.id === id) ?? scriptSets[0];
      return {
        fileId: id,
        title: s.title,
        progress: 0,
        stepIndex: 0,
        done: false,
        failed: false,
      };
    });
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

  // 全部生成结束(done 或 failed)后切换为成片列表视图(一行 3 个,支持单个/批量下载)
  const genAllFinished = genFiles.length > 0 && genFiles.every(g => g.done || g.failed);
  const doneFiles = genFiles.filter(g => g.done);
  const failedFiles = genFiles.filter(g => g.failed);
  const goToHome = () => setNav('home');
  // 导出弹窗状态:'single' = 单个 / 'batch' = 批量 / null = 不展示
  const [exportCtx, setExportCtx] = useState<'single' | 'batch' | null>(null);
  // 字幕擦除开关(默认开)
  const [eraseSubs, setEraseSubs] = useState(true);
  // 导出弹窗左侧预览视频的切换索引:
  // - single:固定 0(只导出当前卡,无需切换)
  // - batch:在已完成的成片列表中切换(初始默认 0)
  const [exportPreviewIdx, setExportPreviewIdx] = useState(0);
  // 单导出时固定显示当前卡;批量导出时按用户选中的索引展示对应成片
  const exportPreviewItem = (() => {
    if (exportCtx === 'single') return doneFiles[0] ?? null;
    if (exportCtx === 'batch') return doneFiles[exportPreviewIdx] ?? doneFiles[0] ?? null;
    return null;
  })();
  // 当前预览对应的渐变背景(用以替代原 exportPreviewGradient)
  const exportPreviewGradient = (() => {
    const item = exportPreviewItem;
    if (!item) return VIDEO_GRADIENTS[0];
    const idx = scriptSets.findIndex(s => s.id === item.fileId);
    return scriptSets[idx]?.cover ?? VIDEO_GRADIENTS[0];
  })();
  const openExport = (kind: 'single' | 'batch') => {
    setExportPreviewIdx(0);
    setExportCtx(kind);
  };
  const exportCount = exportCtx === 'single' ? 1 : doneFiles.length;
  const closeExport = () => setExportCtx(null);
  const confirmExport = () => {
    message.success(
      `开始导出 ${exportCount} 个成片(字幕擦除:${eraseSubs ? '开' : '关'})`
    );
    setExportCtx(null);
  };

  // ===== 字幕擦除框:位置拖动 + 大小拖动(像素坐标,相对预览容器) =====
  const previewRef = useRef<HTMLDivElement>(null);
  const [eraseBox, setEraseBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [drag, setDrag] = useState<null | { mode: 'move' | 'se' | 'sw' | 'ne' | 'nw'; startX: number; startY: number; box: { left: number; top: number; width: number; height: number } }>(null);

  // 每次打开弹窗或切换预览后,重置擦除框为默认底部字幕区(需先测量容器)
  useEffect(() => {
    if (exportCtx === null || !eraseSubs) {
      if (exportCtx === null) setEraseBox(null);
      return;
    }
    const el = previewRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    // 默认:水平 12% ~ 88%,垂直底部 18% 高度 18%(换算为像素)
    const w = rect.width * 0.76;
    const h = rect.height * 0.18;
    setEraseBox({
      left: rect.width * 0.12,
      top: rect.height - rect.height * 0.18 - h,
      width: w,
      height: h,
    });
  }, [exportCtx, exportPreviewIdx, eraseSubs]);

  // 在弹窗打开且打开擦除时,若预览容器尚未测量(modal 动画期间),做一次兜底测量
  useEffect(() => {
    if (exportCtx === null || !eraseSubs) return;
    const t = setTimeout(() => {
      const el = previewRef.current;
      if (el && !eraseBox) {
        const rect = el.getBoundingClientRect();
        if (rect.width && rect.height) {
          const w = rect.width * 0.76;
          const h = rect.height * 0.18;
          setEraseBox({
            left: rect.width * 0.12,
            top: rect.height - rect.height * 0.18 - h,
            width: w,
            height: h,
          });
        }
      }
    }, 100);
    return () => clearTimeout(t);
  }, [exportCtx, eraseSubs, eraseBox]);

  // 拖拽处理:move = 移动位置;se/sw/ne/nw = 四角调整大小
  const onEraseMouseDown = (e: React.MouseEvent, mode: 'move' | 'se' | 'sw' | 'ne' | 'nw') => {
    e.preventDefault();
    e.stopPropagation();
    if (!eraseBox) return;
    setDrag({
      mode,
      startX: e.clientX,
      startY: e.clientY,
      box: { ...eraseBox },
    });
  };

  // 在 window 上监听移动/松开(拖拽期间生效)
  useEffect(() => {
    if (!drag) return;
    const el = previewRef.current;
    const rect = el?.getBoundingClientRect();
    if (!rect) return;
    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;
      const b = drag.box;
      const maxW = rect.width;
      const maxH = rect.height;
      let next = { ...b };
      if (drag.mode === 'move') {
        next.left = clamp(b.left + dx, 0, maxW - b.width);
        next.top = clamp(b.top + dy, 0, maxH - b.height);
      } else {
        const isE = drag.mode === 'se' || drag.mode === 'ne';
        const isS = drag.mode === 'se' || drag.mode === 'sw';
        if (isE) next.width = clamp(b.width + dx, 20, maxW - b.left);
        if (isS) next.height = clamp(b.height + dy, 20, maxH - b.top);
        if (drag.mode === 'nw') {
          next.left = clamp(b.left + dx, 0, b.left + b.width - 20);
          next.width = b.left + b.width - next.left;
          next.top = clamp(b.top + dy, 0, b.top + b.height - 20);
          next.height = b.top + b.height - next.top;
        }
        if (drag.mode === 'ne') {
          next.width = clamp(b.width + dx, 20, maxW - b.left);
          next.top = clamp(b.top + dy, 0, b.top + b.height - 20);
          next.height = b.top + b.height - next.top;
        }
        if (drag.mode === 'sw') {
          next.height = clamp(b.height + dy, 20, maxH - b.top);
          next.left = clamp(b.left + dx, 0, b.left + b.width - 20);
          next.width = b.left + b.width - next.left;
        }
      }
      setEraseBox(next);
    };
    const onUp = () => setDrag(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [drag]);

  // 右上角(ne)需要把宽/高合并到 right 逻辑——上面已覆盖

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
          <Button
            type="primary"
            className="gradient-btn"
            size="large"
            disabled={!selectedIds.length}
            onClick={runGenerate}
          >
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
              左侧上传视频素材(可多个);右侧设置解说语言、音色与生产视频时长
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
                  showCloudBtn={false}
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

      {/* ============ 第三页:创意方案(整宽横向卡片,无左列) ============ */}
      {phase === Phase.Plans && (
        <div className="section-card" style={{ padding: 28 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              <CheckCircleFilled style={{ color: '#10b981', marginRight: 8 }} />
              理解分析完成,请选择创意方案
            </div>
            <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 6 }}>
              共 {scriptSets.length} 个方案,支持多选;每个选中的方案将各生成一个解说视频
            </div>
          </div>

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
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400, marginLeft: 10 }}>
                已选 {selectedIds.length} 个
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="small" onClick={selectAllScripts}>
                {allSelected ? '取消全选' : '一键全选'}
              </Button>
              <Button
                type="primary"
                className="gradient-btn"
                size="small"
                disabled={!selectedIds.length}
                onClick={runGenerate}
              >
                生成解说{selectedIds.length ? `(${selectedIds.length})` : ''}
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
              const selected = selectedIds.includes(s.id);
              const cat = CATEGORIES[idx % CATEGORIES.length];
              const setting = getPlanSetting(s.id);
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
                    onToggle={() => toggleScript(s.id)}
                    lang={setting.lang}
                    onLangChange={v => updatePlanSetting(s.id, { lang: v })}
                    voice={setting.voice}
                    onVoiceChange={v => updatePlanSetting(s.id, { voice: v })}
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

          {footer}
        </div>
      )}

      {/* ============ 第四页(生成中):多方案并发生成卡 ============ */}
      {phase === Phase.Generate && !genAllFinished && (
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
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}
          >
            {genFiles.map(g => (
              <GenerateCard
                key={g.fileId}
                title={g.title}
                language={getPlanSetting(g.fileId).lang}
                progress={g.progress}
                stepIndex={g.stepIndex}
                estimatedSec={Math.round(config.duration * 2.4)}
                done={g.done}
                failed={g.failed}
              />
            ))}
          </div>
        </div>
      )}

      {/* ============ 第四页(完成态):成片视频列表(一行 3 个,单个/批量下载) ============ */}
      {phase === Phase.Generate && genAllFinished && (
        <div className="section-card" style={{ padding: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1f2937' }}>
              <CheckCircleFilled style={{ color: '#10b981', marginRight: 8 }} />
              视频生成完成
              <span style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 400, marginLeft: 10 }}>
                共生成 {doneFiles.length} 个解说视频
              </span>
            </div>
            <Button
              type="primary"
              className="gradient-btn"
              icon={<DownloadOutlined />}
              disabled={!doneFiles.length}
              onClick={() => openExport('batch')}
            >
              批量下载{doneFiles.length ? `(${doneFiles.length})` : ''}
            </Button>
          </div>
          {failedFiles.length > 0 && (
            <div style={{ fontSize: 12.5, color: '#ef4444', marginTop: 4 }}>
              {failedFiles.length} 个方案生成失败,可返回创意方案重新生成
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              marginTop: 16,
            }}
          >
            {doneFiles.map((g, i) => {
              const s = scriptSets.find(x => x.id === g.fileId);
              return (
                <VideoResultCard
                  key={g.fileId}
                  title={g.title}
                  lang={getPlanSetting(g.fileId).lang}
                  voice={getPlanSetting(g.fileId).voice}
                  durationSec={config.duration}
                  gradient={s?.cover ?? VIDEO_GRADIENTS[i % VIDEO_GRADIENTS.length]}
                  onDownload={() => openExport('single')}
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
            <Button onClick={() => setPhase(Phase.Plans)}>返回创意方案</Button>
            <Button type="primary" className="gradient-btn" onClick={goToHome}>
              返回首页
            </Button>
          </div>
        </div>
      )}

      {/* ============ 导出成片弹窗(字幕擦除设置) ============ */}
      <Modal
        open={exportCtx !== null}
        onCancel={closeExport}
        footer={null}
        width={720}
        centered
        closable
        title={
          <span>
            导出成片
            <span style={{ fontSize: 12.5, color: '#9ca3af', marginLeft: 8, fontWeight: 400 }}>
              (已选 {exportCount} 个)
            </span>
          </span>
        }
      >
        <div style={{ display: 'flex', gap: 24, paddingTop: 8 }}>
          {/* 批量导出时:视频切换缩略图列(视频预览模块的左侧) */}
          {exportCtx === 'batch' && doneFiles.length > 1 && (
            <div
              data-testid="export-preview-list"
              style={{
                flex: '0 0 80px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                maxHeight: 360,
                overflowY: 'auto',
              }}
            >
              {doneFiles.map((f, i) => {
                const idx = scriptSets.findIndex(s => s.id === f.fileId);
                const cover = scriptSets[idx]?.cover ?? VIDEO_GRADIENTS[i % VIDEO_GRADIENTS.length];
                const active = i === exportPreviewIdx;
                return (
                  <div
                    key={f.fileId}
                    role="button"
                    aria-label={`预览成片 ${i + 1}`}
                    onClick={() => setExportPreviewIdx(i)}
                    style={{
                      position: 'relative',
                      width: 80,
                      aspectRatio: '9 / 16',
                      borderRadius: 6,
                      background: cover,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      border: active ? '2px solid #ef4444' : '2px solid transparent',
                      boxShadow: active
                        ? '0 0 0 2px rgba(239,68,68,0.25)'
                        : '0 1px 4px rgba(0,0,0,0.08)',
                      transition: 'border-color 0.18s, box-shadow 0.18s',
                    }}
                  >
                    {/* 时长角标 */}
                    <span
                      style={{
                        position: 'absolute',
                        right: 4,
                        bottom: 4,
                        padding: '1px 5px',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        fontSize: 9,
                        fontFamily: 'monospace',
                        borderRadius: 3,
                      }}
                    >
                      00:26
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 视频预览模块(渐变 + 可拖拽字幕擦除框叠加) */}
          <div style={{ flex: '0 0 260px' }}>
            <div
              ref={previewRef}
              style={{
                position: 'relative',
                aspectRatio: '9 / 16',
                maxHeight: 360,
                borderRadius: 8,
                background: exportPreviewGradient,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              {/* 时长角标(根据当前预览 item 显示) */}
              <div
                style={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  padding: '2px 7px',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  fontSize: 10.5,
                  fontFamily: 'monospace',
                  borderRadius: 4,
                }}
              >
                00:29
              </div>
              {/* 字幕擦除框(开关关闭时不渲染);支持拖动位置 + 四角调整大小 */}
              {eraseSubs && eraseBox && (
                <div
                  data-testid="erase-box"
                  onMouseDown={(e) => onEraseMouseDown(e, 'move')}
                  style={{
                    position: 'absolute',
                    left: eraseBox.left,
                    top: eraseBox.top,
                    width: eraseBox.width,
                    height: eraseBox.height,
                    border: '1.5px dashed #2563eb',
                    borderRadius: 2,
                    cursor: 'move',
                    userSelect: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* 4 角控制点(拖动调整大小) */}
                  {([
                    { mode: 'nw', style: { top: -5, left: -5, cursor: 'nwse-resize' } },
                    { mode: 'ne', style: { top: -5, right: -5, cursor: 'nesw-resize' } },
                    { mode: 'sw', style: { bottom: -5, left: -5, cursor: 'nesw-resize' } },
                    { mode: 'se', style: { bottom: -5, right: -5, cursor: 'nwse-resize' } },
                  ] as const).map((c) => (
                    <span
                      key={c.mode}
                      data-testid={`erase-handle-${c.mode}`}
                      onMouseDown={(e) => onEraseMouseDown(e, c.mode)}
                      style={{
                        position: 'absolute',
                        width: 10,
                        height: 10,
                        background: '#fff',
                        border: '1.5px solid #2563eb',
                        borderRadius: 2,
                        zIndex: 2,
                        cursor: c.style.cursor,
                        ...(c.style as any),
                      }}
                    />
                  ))}
                  {/* 框上沿文字标签 */}
                  <span
                    style={{
                      position: 'absolute',
                      top: -22,
                      left: 0,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#2563eb',
                      background: '#fff',
                      padding: '1px 6px',
                      borderRadius: 3,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                    }}
                  >
                    字幕擦除框
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 右侧:设置区 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 视频(MP4)导出 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Checkbox checked disabled />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                视频(MP4)导出
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingLeft: 24,
                marginTop: 10,
              }}
            >
              <span style={{ fontSize: 13, color: '#374151' }}>擦除原视频字幕</span>
              <Switch checked={eraseSubs} onChange={setEraseSubs} size="small" />
            </div>
            <div
              style={{
                fontSize: 11.5,
                color: '#9ca3af',
                paddingLeft: 24,
                marginTop: 6,
                lineHeight: 1.55,
              }}
            >
              默认已框选常见底部字幕区,可在画面上按住拖动重新框选覆盖原片字幕位置。
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 22,
            paddingTop: 14,
            borderTop: '1px solid #f3f4f6',
          }}
        >
          <Button onClick={closeExport}>取消</Button>
          <Button
            type="primary"
            className="gradient-btn"
            icon={<DownloadOutlined />}
            onClick={confirmExport}
          >
            导出成片
          </Button>
        </div>
      </Modal>
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
 * 第二步:创意方案卡片(参考图风格,支持多选)
 * - 顶部:emoji 分类 + 标题(可勾选,点击卡片/勾选框切换选中)
 * - 视频结构故事线
 * - 高光片段列表(时间 + 类型彩色标签 + 描述)
 * - 解说词(可编辑) + 语言/音色(可修改,状态由父级托管,生成时按方案读取)
 * - 4 段解说词文本(中文 1..4)
 */
const PlanCard = ({
  category,
  title,
  script,
  selected,
  onToggle,
  lang,
  onLangChange,
  voice,
  onVoiceChange,
}: {
  category: string;
  title: string;
  script: ScriptSet;
  selected: boolean;
  onToggle: () => void;
  lang: string;
  onLangChange: (v: string) => void;
  voice: string;
  onVoiceChange: (v: string) => void;
}) => {
  // 卡级别可编辑解说文案(与其它卡片互不影响);语言/音色提升到父级,生成时按方案读取
  const [narrations, setNarrations] = useState<string[]>(() => getNarrationsForScript(script));

  const updateNarration = (idx: number, text: string) => {
    setNarrations(prev => prev.map((n, i) => (i === idx ? text : n)));
  };

  return (
    <div
      onClick={onToggle}
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
          onChange={onToggle}
          style={{ marginTop: 2 }}
        />
        <span style={{ flex: 1 }}>{title}</span>
      </div>

      {/* 视频结构故事线 */}
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>视频结构故事线</div>

      {/* 高光片段列表(高度不限制,自然展开) */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          marginBottom: 10,
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

      {/* 解说词(可编辑) + 语言/音色(可修改) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#374151' }}>
          <FileTextOutlined style={{ marginRight: 4 }} />
          解说词 <span style={{ color: '#9ca3af', fontWeight: 400 }}>(可编辑)</span>
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={e => e.stopPropagation()}
        >
          <Select
            size="small"
            value={lang}
            options={narratorLangOptions}
            onChange={onLangChange}
            style={{ width: 86 }}
            popupMatchSelectWidth={false}
          />
          <Select
            size="small"
            value={voice}
            options={voiceOptions}
            onChange={onVoiceChange}
            suffixIcon={
              <div
                style={{
                  width: 18, height: 18, borderRadius: 9,
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  color: '#fff', fontSize: 9, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                云
              </div>
            }
            style={{ width: 110 }}
            popupMatchSelectWidth={false}
          />
        </div>
      </div>

      {/* 多段解说词(可编辑,高度自然展开) */}
      <div
        style={{
          background: '#fafafa',
          borderRadius: 6,
          padding: 8,
        }}
        onClick={e => e.stopPropagation()}
      >
        {narrations.map((n, i) => (
          <div key={i} style={{ marginBottom: 6 }}>
            <div style={{ color: '#6366f1', fontWeight: 600, marginBottom: 2, fontSize: 11 }}>
              {lang} {i + 1}
            </div>
            <Input.TextArea
              value={n}
              onChange={e => updateNarration(i, e.target.value)}
              autoSize={{ minRows: 2 }}
              variant="borderless"
              style={{
                fontSize: 11,
                lineHeight: 1.6,
                color: '#374151',
                background: '#fff',
                borderRadius: 4,
                padding: '4px 6px',
                resize: 'none',
              }}
            />
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
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937' }}>{title}</div>
        <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>{language}</div>
      </div>
    </div>
  );
};

// 成片封面渐变兜底色(方案自带 cover 优先,按顺序循环)
const VIDEO_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #a855f7)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #14b8a6, #6366f1)',
  'linear-gradient(135deg, #f97316, #eab308)',
];

/**
 * 生成完成后的成片视频卡片:
 * - 16:9 渐变封面 + 播放按钮 + 时长角标
 * - 标题 + 语言/音色/时长元信息
 * - 单个下载按钮
 */
const VideoResultCard = ({
  title,
  lang,
  voice,
  durationSec,
  gradient,
  onDownload,
}: {
  title: string;
  lang: string;
  voice: string;
  durationSec: number;
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
      {/* 封面:渐变 + 播放按钮 + 时长角标 */}
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
          {fmtTime(durationSec)}
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
          解说 {lang} · {voice} · {fmtTime(durationSec)}
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
