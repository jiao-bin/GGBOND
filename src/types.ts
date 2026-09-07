export interface HogFuturesContract {
  code: string;           // 'nf_LH0' | 'nf_LH2611' | 'nf_LH2701' etc.
  symbol: string;         // 'LH0' | 'LH2611' | 'LH2701'
  name: string;           // '生猪连续' | '生猪2611' | '生猪2701'
  priceTon: number;       // 最新价 (元/吨)
  changePct: number;      // 涨跌幅 %
  changeAmount: number;   // 涨跌额 (元/吨)
  openInterest: number;   // 持仓量 (手)
  volume: number;         // 成交量 (手)
  high: number;
  low: number;
  open: number;
  settlePrice: number;    // 昨结算价
  date?: string;
  time?: string;
  isMain?: boolean;
}

export interface HogMarketData {
  timestamp: string;
  // 现货数据 (搜猪网/涌益/全国外三元均价)
  spot: {
    priceKg: number;           // 元/公斤
    priceTon: number;          // 元/吨 (priceKg * 1000)
    changePct: number;         // 现货日环比涨跌 %
    date: string;              // 定盘日期 (真实日期，不强行改为今天)
    publishTime?: string;      // 例如 "今日 09:00 定盘" 或 "前一日 (09-04) 定盘"
    isToday?: boolean;         // 是否成功抓取到今日数据 (若未抓取到则为 false)
    statusNote?: string;       // 明确状态说明，如 "今日尚未定盘/未抓取到，采用前一日定盘数据"
    previousDayDate?: string;  // 前一日基准日期
    isPreviousDayFallback?: boolean; // 是否处于使用前一天数据状态
    source: string;
    sourceDescription?: string;
    cashCostKg: number;        // 行业完全成本线 (~13.8元/kg)
    deepLossCostKg: number;    // 深度亏损线 (12.0元/kg)
    provinces?: Array<{ province: string; price: number; change: number; diff?: number; note?: string }>;
    neiSanYuanKg?: number;     // 内三元价格 (元/kg)
    tuZaZhuKg?: number;        // 土杂猪价格 (元/kg)
    maizeTon?: number;         // 玉米价格 (元/吨)
    beanTon?: number;          // 豆粕价格 (元/吨)
  };
  // 大商所生猪期货主力合约 (LH0 / 主力连及活跃合约)
  futures: {
    contract: string;          // 例如 'LH主力 (LH2611)'
    symbol?: string;           // 'LH0' | 'LH2611' | 'LH2701'
    priceTon: number;          // 期货最新价 (元/吨)
    changePct: number;         // 期货涨跌幅 %
    changeAmount: number;      // 涨跌额
    openInterest: number;      // 持仓量 (手)
    volume: number;            // 成交量 (手)
    high: number;
    low: number;
    open?: number;
    settlePrice: number;       // 昨结价
    time?: string;
    date?: string;
    source?: string;           // '大商所实时行情'
    allContracts?: HogFuturesContract[]; // 所有交割月份合约Term Structure
  };
  // 期现升贴水测算 (核心算法)
  spread: {
    premiumRate: number;       // ((futures - spotTon) / spotTon) * 100
    basisTon: number;          // 基差: spotTon - futures (元/吨)
    status: 'high_premium' | 'moderate_premium' | 'flat' | 'discount' | 'deep_discount';
    statusText: string;
  };
  // 牧原股份及生猪养殖龙头
  stock: {
    code: string;              // '002714'
    name: string;              // '牧原股份'
    price: number;             // 最新价
    changePct: number;         // 涨跌幅 %
    turnoverRate: number;      // 换手率 %
    volume: string;            // 成交量
    peRatio: number;
    pbRatio?: number;
    marketCap: string;         // 总市值 (按最新总股本约57.73亿股动态测算，约2538亿元)
    totalShares?: string;      // 总股本 (57.73亿股)
  };
  // 行业同行对照
  peers: Array<{
    code: string;
    name: string;
    price: number;
    changePct: number;
    turnoverRate: number;
  }>;
  // 周期宏观指标
  macro: {
    pigGrainRatio: number;     // 猪粮比价 (例如 5.6:1)
    sowCapacityStatus: string; // 能繁母猪存栏状态
    cyclePhase: '产能去化期' | '抢跑筑底期' | '右侧反转期' | '高位繁荣期';
    cyclePhaseDesc: string;
  };
  // 商业级微观数据 (真实公开研报/行情源抽取，支持严格缺失降级)
  microData?: {
    standardFatDiff?: number | null;     // 标肥价差 (元/kg, 肥猪减标猪价差，缺失时为null)
    standardFatStatus: 'high_premium' | 'moderate_premium' | 'flat' | 'inverted' | 'unknown';
    standardFatStatusText: string;     // 例如 "大猪溢价超0.8元·刺激二育抢标猪"
    avgSlaughterWeight?: number | null;  // 出栏均重 (kg, 样本大猪库存水位，缺失时为null)
    weightStatus: 'safe' | 'normal' | 'warning' | 'critical' | 'unknown';
    weightStatusText: string;          // 例如 "均重125.4kg·接近压栏踩踏预警线"
    secondFatteningRate?: number | null;// 二育出栏或入场占比 %，缺失时为null
    secondFatteningSentiment: string;  // 例如 "二育截流现货情绪升温"
    slaughterOperatingRate?: number | null; // 屠宰开工率 %
    frozenInventoryRate?: number | null;    // 冻品库容率 %
    lastReportSource: string;          // 例如 "申港证券行业研报"
    lastReportTime: string;            // 例如 "2026-08-27 08:30"
    originalPublishDate?: string;      // 原文真实推送日期，例如 "2026-08-27" (不强行修改)
    originalPublishTime?: string;      // 原文真实推送时间，例如 "08:30"
    isTodayReport?: boolean;           // 是否为今日早报推文
    reportDateNotice?: string;         // 例如 "原文推送于 2026-08-27 (前一发布日推文)"
    extractedSnippet: string;          // 命中的关键研报原文
  };
  // 交易所真实交易状态
  marketStatus?: {
    isTradingTime: boolean;    // 是否处于交易时段
    statusText: string;        // '连续交易中' | '已休市 (盘后收盘锁定)' | '午间休市 (盘口挂起)'
    dceStatus: string;         // 大商所期货状态
    sseStatus: string;         // A股市场状态
    isSandbox: boolean;        // 是否开启了沙盒模拟模式
    sessionNote: string;       // 详细交易时间段说明
  };
  hasPriceChanged?: boolean;   // 本次刷新价格是否有真实变动
  isRealTime: boolean;
  dataSourceNote: string;
}

export interface TickHistoryItem {
  time: string;
  spotKg: number;
  spotTon: number;
  futuresTon: number;
  premiumRate: number;
  basisTon: number;
  muyuanPrice: number;
  muyuanChange: number;
}

export interface AlertRule {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  conditionType: 'premium_high' | 'spot_loss_stock_surge' | 'spot_below_cost' | 'turnover_surge' | 'basis_extreme' | 'fat_diff_high' | 'weight_high';
  threshold: number;
  secondaryThreshold?: number;
  severity: 'critical' | 'warning' | 'info';
}

export interface ExtractedMorningReport {
  id: string;
  source: string;              // 例如 "我的钢铁网农产品"、"卓创农业"、"猪易通"、"搜猪网"
  title: string;
  publishTime: string;         // 例如 "08:45"
  rawText: string;
  extracted: {
    standardFatDiff?: number;     // 标肥价差 (元/kg)
    avgWeight?: number;           // 出栏均重 (kg)
    secondFatteningRate?: number; // 二育占比 %
    slaughterRate?: number;       // 屠宰开工率 %
  };
  matchedSnippets: {
    standardFatSnippet?: string;
    weightSnippet?: string;
    secondFatteningSnippet?: string;
  };
  confidence: number;             // 提取置信度 %
}

export interface TriggeredAlert {
  id: string;
  timestamp: string;
  title: string;
  content: string;
  severity: 'critical' | 'warning' | 'info';
  dispatchedToFeishu: boolean;
  dispatchedToWecom: boolean;
  rawMetrics: {
    spotKg: number;
    futuresTon: number;
    premiumRate: number;
    stockChange: number;
  };
}

export interface WebhookSettings {
  feishuUrl: string;
  wecomUrl: string;
  dingtalkUrl: string;
  enabledPlatforms: {
    feishu: boolean;
    wecom: boolean;
    dingtalk: boolean;
  };
  audioAlarm: boolean;
  autoSendAlerts: boolean;
}

export interface GeminiAnalysisResult {
  summary: string;
  cycleEvaluation: string;
  arbitrageAdvice: string;
  breedingRecommendation: string;
  stockSentiment: string;
  keyRisks: string[];
  generatedAt: string;
}

export interface YongyiOcrProvince {
  province: string;
  price: number;
  change: number;
  diff?: number | null;
  note?: string;
}

export interface YongyiOcrResult {
  reportTitle?: string;
  reportDate?: string;
  nationalAvgPrice?: number | null;
  standardFatDiff?: number | null;
  avgSlaughterWeight?: number | null;
  secondFatteningRate?: number | null;
  slaughterOperatingRate?: number | null;
  frozenInventoryRate?: number | null;
  summary?: string;
  provinces?: YongyiOcrProvince[];
  evaluation?: {
    standardFatStatus: 'high_premium' | 'moderate_premium' | 'flat' | 'inverted' | 'unknown';
    standardFatStatusText: string;
    weightStatus: 'safe' | 'normal' | 'warning' | 'critical' | 'unknown';
    weightStatusText: string;
    secondFatteningSentiment: string;
  };
}

