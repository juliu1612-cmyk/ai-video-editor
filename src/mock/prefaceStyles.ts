/**
 * AI 前贴风格化
 */
export interface PrefaceStyle {
  id: string;
  name: string;
  desc: string;
  example: string;     // CSS 渐变 (示例画面)
  duration: 1 | 3 | 5 | 10;
  script: string;      // 推荐脚本
}

export const prefaceStyles: PrefaceStyle[] = [
  {
    id: 'p1', name: '兽人系列',
    desc: '狂野粗犷,远古蛮荒',
    example: 'linear-gradient(135deg, #92400e 0%, #ea580c 100%)',
    duration: 3,
    script: '沉睡万年的图腾苏醒,兽血再次沸腾,利爪撕裂苍穹,宣告远古霸主的归来。',
  },
  {
    id: 'p2', name: '克苏鲁系列',
    desc: '深海低语,未知恐惧',
    example: 'linear-gradient(135deg, #134e4a 0%, #0f766e 100%)',
    duration: 3,
    script: '理智的边缘传来不可名状的耳语,旧日支配者从深渊苏醒,凝视它的人都将陷入疯狂。',
  },
  {
    id: 'p3', name: '变种人系列',
    desc: '基因觉醒,异能绽放',
    example: 'linear-gradient(135deg, #6d28d9 0%, #c026d3 100%)',
    duration: 3,
    script: 'X 基因觉醒的瞬间,他不再是普通人。异能觉醒,世界将因他而重写。',
  },
  {
    id: 'p4', name: '日韩漫2D风格',
    desc: '清新画风,二次元呈现',
    example: 'linear-gradient(135deg, #f9a8d4 0%, #a5f3fc 100%)',
    duration: 3,
    script: '樱花飘落的校园里,他与她四目相对。命运的齿轮,从这一刻开始转动。',
  },
  {
    id: 'p5', name: '欧美3D漫风格',
    desc: '立体渲染,好莱坞质感',
    example: 'linear-gradient(135deg, #1e40af 0%, #06b6d4 100%)',
    duration: 3,
    script: '当最后一缕阳光熄灭,英雄从废墟中站起。史诗级 3D 巨制,敬请期待。',
  },
];