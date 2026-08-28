/**
 * 6 个预设剧集,每个剧集含 5-7 个高光片段
 * type: 钩子/推进/爽点/反转/断点
 */
export interface Highlight {
  id: string;
  start: number;        // 秒
  end: number;          // 秒
  type: '钩子' | '推进' | '爽点' | '反转' | '断点';
  desc: string;
}

export interface ScriptSet {
  id: string;
  title: string;
  cover: string;        // 渐变色 (CSS)
  duration: number;     // 总时长(秒)
  summary: string;
  emotionTypes: { name: string; desc: string }[];
  highlights: Highlight[];
}

export const scriptSets: ScriptSet[] = [
  {
    id: 's1',
    title: '豪宠私人会竟成直播?总裁反击太解气!',
    cover: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
    duration: 3605,
    summary:
      '豪门阔太 Bianca 私会情人 Victor,并在言语中透露出对丈夫 Leandro 的轻视。Victor 举止大度,甚至暗示 Leandro 可能无法生育。然而,两人并不知道 Leandro 正通过隐藏摄像头全程监控着这段背叛。Leandro 并未当场发难,而是精心策划了一场"社会性死亡"的复仇。他借力妻子举办公益之名,带领大批摄影师和记者强力突袭,计划在众目睽睽之下揭穿丑行。随着 Leandro 步步逼近卧室,一场关于背叛与审判的修罗场即将开启。',
    emotionTypes: [
      { name: '极致背叛', desc: '妻子在闺蜜豪宅公然偷情并密谋丈夫的死,将人性之恶推向极致,激发观众的愤怒情绪。' },
      { name: '冷酷复仇', desc: '丈夫 Leandro 冷静指挥、媒体全军出击,这种智商在线的复仇行动让人感到极度解气。' },
      { name: '命悬一线', desc: '情夫 Victor 对 Leandro 死亡的暗指,为剧情增添了一抹危机四伏的惊悚色彩。' },
      { name: '公开处刑', desc: '通过媒体力量将私人丑闻化为公共笑谈,满足了观众对恶人受罚、名誉扫地的心理预期。' },
    ],
    highlights: [
      { id: 'h1', start: 0, end: 9, type: '钩子', desc: '丈夫视角目睹妻子家中偷情,极致背叛开场' },
      { id: 'h2', start: 9, end: 35, type: '推进', desc: '好大淫妇密谋毒命,拉满信息差与危机' },
      { id: 'h3', start: 35, end: 56, type: '爽点', desc: '丈夫掌控全局,反向狩猎开始' },
      { id: 'h4', start: 56, end: 69, type: '反转', desc: '第三方媒体强力介入,局势瞬间变为大局' },
      { id: 'h5', start: 69, end: 72, type: '断点', desc: '卡在破门瞬间,引发用户对"公开处刑"的期待' },
    ],
  },
  {
    id: 's2',
    title: '豪宅大床:妻子带情人回家,丈夫带记者直播抓…',
    cover: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    duration: 3900,
    summary:
      '豪门总裁暗中调查妻子出轨真相,在妻子与情人约会时直接踹门闯入,全程媒体直播,让妻子与情人社会性死亡。',
    emotionTypes: [
      { name: '突袭反转', desc: '推门瞬间剧情反转,观众肾上腺素飙升' },
      { name: '直播处刑', desc: '现场直播让丑闻无处遁形' },
      { name: '正宫霸气', desc: '总裁冷静指挥全程,展现上位者姿态' },
    ],
    highlights: [
      { id: 'h1', start: 0, end: 17, type: '钩子', desc: '丈夫监控目睹妻子带情人回家偷情' },
      { id: 'h2', start: 17, end: 23, type: '推进', desc: '好大淫妇肆无忌惮毫无悔意' },
      { id: 'h3', start: 23, end: 32, type: '爽点', desc: '情人语出惊人暗藏杀机' },
      { id: 'h4', start: 32, end: 47, type: '反转', desc: '丈夫冷静反击开启公开处刑模式' },
      { id: 'h5', start: 47, end: 58, type: '断点', desc: '媒体大军压境直扑二楼卧室' },
    ],
  },
  {
    id: 's3',
    title: '娇妻带人回家,总裁带记者破门!',
    cover: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    duration: 3450,
    summary:
      '豪门娇妻趁丈夫出差带情人回家私会,不料总裁早已布下天罗地网,带记者团队强势破门,让妻子当场社死。',
    emotionTypes: [
      { name: '豪门暗战', desc: '夫妻过招尽显豪门算计' },
      { name: '现场抓包', desc: '真人秀式抓包引爆话题' },
    ],
    highlights: [
      { id: 'h1', start: 0, end: 12, type: '钩子', desc: '妻子家中私会情人,极致背叛开场' },
      { id: 'h2', start: 12, end: 27, type: '推进', desc: '好情细节坐实拉满观众仇恨' },
      { id: 'h3', start: 27, end: 36, type: '爽点', desc: '好大嚣张挑衅原片回放' },
      { id: 'h4', start: 36, end: 48, type: '反转', desc: '丈夫死里逃开启上帝视角监控' },
      { id: 'h5', start: 48, end: 59, type: '断点', desc: '猎人反击筹备公开处刑派对' },
    ],
  },
  {
    id: 's4',
    title: '阔太密会情夫,死里逃生的丈夫冷眼直播',
    cover: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    duration: 4100,
    summary:
      '总裁出差归来,意外发现妻子与情人在主卧私会。他没有大吵大闹,而是默默打开直播设备,让全网见证这场背叛。',
    emotionTypes: [
      { name: '冷面总裁', desc: '冷静到可怕的男主,反差感极强' },
      { name: '全网直播', desc: '丑闻变成全网热议的社会事件' },
    ],
    highlights: [
      { id: 'h1', start: 0, end: 8, type: '钩子', desc: '豪宅出轨与死亡威胁的极致冲突' },
      { id: 'h2', start: 8, end: 25, type: '推进', desc: '情夫嚣张打压主角,制造信息差悬念' },
      { id: 'h3', start: 25, end: 33, type: '反转', desc: '局势180度转弯,受害者变身掌控全局' },
      { id: 'h4', start: 33, end: 47, type: '爽点', desc: '主角冷静展示隐秘实力,准备降维打击' },
      { id: 'h5', start: 47, end: 61, type: '断点', desc: '真相揭晓前1秒,大对人马直逼现场引关注' },
    ],
  },
  {
    id: 's5',
    title: '前妻再嫁豪门,前夫带娃上门讨说法!',
    cover: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    duration: 3580,
    summary:
      '离婚后前妻火速再嫁豪门,前夫带着亲生儿子上门讨要抚养权,豪门新贵与草根前夫的正面交锋引爆全城热议。',
    emotionTypes: [
      { name: '草根逆袭', desc: '前夫从底层一路逆袭,正当讨伐' },
      { name: '豪门碾压', desc: '新贵试图用金钱掩盖一切' },
    ],
    highlights: [
      { id: 'h1', start: 0, end: 14, type: '钩子', desc: '豪车堵门,前夫带娃讨说法' },
      { id: 'h2', start: 14, end: 28, type: '推进', desc: '新贵出言嘲讽,拉满观众怒火' },
      { id: 'h3', start: 28, end: 42, type: '反转', desc: '亲子鉴定报告当场打脸豪门' },
      { id: 'h4', start: 42, end: 55, type: '爽点', desc: '前夫当场签字放弃千万赔偿' },
      { id: 'h5', start: 55, end: 68, type: '断点', desc: '前妻跪求复合却被一句话回绝' },
    ],
  },
  {
    id: 's6',
    title: '总裁出狱前夜,前妻跪在门外求复合',
    cover: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
    duration: 4250,
    summary:
      '含冤入狱三年的总裁即将出狱,前妻带着孩子跪在监狱门外求复合,而总裁身后站着等他三年的真正白月光。',
    emotionTypes: [
      { name: '含冤昭雪', desc: '三年冤狱终洗清' },
      { name: '白月光归来', desc: '错过三年的真爱站在身后' },
    ],
    highlights: [
      { id: 'h1', start: 0, end: 11, type: '钩子', desc: '出狱前夜,前妻跪地求饶' },
      { id: 'h2', start: 11, end: 26, type: '推进', desc: '狱中兄弟道出当年陷害真相' },
      { id: 'h3', start: 26, end: 39, type: '反转', desc: '白月光携秘密文件亲赴现场' },
      { id: 'h4', start: 39, end: 52, type: '爽点', desc: '总裁当面撕毁和解书' },
      { id: 'h5', start: 52, end: 65, type: '断点', desc: '前妻绝望,白月光紧握总裁手' },
    ],
  },
];

export const typeColorMap: Record<string, string> = {
  钩子: '#10b981',
  推进: '#3b82f6',
  爽点: '#f59e0b',
  反转: '#a855f7',
  断点: '#ef4444',
};
