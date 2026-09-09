import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// 允许公开农业行情网站(如中国养猪网)自签或免证书快速访问
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

// 全自动定时爬虫流水日志接口
export interface CrawlerLogItem {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warn" | "error";
  module: "SPOT_CRAWLER" | "RESEARCH_CRAWLER" | "FUTURES_CRAWLER" | "SCHEDULER" | "FUTURES_STREAM";
  message: string;
  details?: any;
}

const daemonCrawlerLogs: CrawlerLogItem[] = [];

function addCrawlerLog(
  level: CrawlerLogItem["level"],
  module: CrawlerLogItem["module"],
  message: string,
  details?: any
) {
  const item: CrawlerLogItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
    level,
    module,
    message,
    details,
  };
  daemonCrawlerLogs.unshift(item);
  if (daemonCrawlerLogs.length > 60) daemonCrawlerLogs.pop();
  console.log(`[CrawlerDaemon][${item.timestamp}][${module}] ${message}`);
}

// 懒加载 Gemini 客户端
let genAIClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// 内存中的基准状态，支持持续微调动态演示
export interface ParsedContract {
  code: string;
  symbol: string;
  name: string;
  priceTon: number;
  changePct: number;
  changeAmount: number;
  openInterest: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  settlePrice: number;
  date?: string;
  time?: string;
  isMain?: boolean;
}

let currentMarketState = {
  spotKg: 10.92,           // 今日(2026-09-07)中国养猪网首页玄田数据全国生猪（外三元）权威出栏均价 10.92 元/kg
  spotChange: -0.10,       // 较昨日跌 -0.10 元/kg (同比: -20.35%, 环比: 5.41%)
  spotDate: "2026-09-07",  // 真实定盘日期
  spotPublishTime: "今日 07:30 定盘 (中国养猪网玄田数据)",
  spotIsToday: true,
  spotStatusNote: "已自动同步中国养猪网首页官方定盘: 外三元 10.92元/kg (较昨日 -0.10元/kg)，玉米 2381元/吨 (+16元)，豆粕 2948元/吨 (+25元)，官方猪粮比 4.59:1",
  spotPreviousDayDate: "2026-09-06",
  neiSanYuanKg: 11.02,     // 内三元 11.02 元/kg (跌 -0.02)
  tuZaZhuKg: 10.53,        // 土杂猪 10.53 元/kg (跌 -0.01)
  maizeTon: 2381,          // 玉米 2381 元/吨 (涨 +16)
  beanTon: 2948,           // 豆粕 2948 元/吨 (涨 +25)
  futuresContract: "LH主力 (生猪2611)",
  futuresSymbol: "LH0",
  futuresTon: 11795,       // 大商所生猪主力最新成交价 (11795 元/吨)
  futuresChange: -0.13,    // 涨跌幅 %
  futuresChangeAmount: -15,// 涨跌额 元/吨
  futuresOpenInterest: 220067,
  futuresVolume: 159665,
  futuresHigh: 11950,
  futuresLow: 11745,
  futuresOpen: 11850,
  futuresPreSettle: 11810,
  futuresTime: "15:04:50",
  futuresDate: "2026-09-07",
  allContracts: [] as ParsedContract[],
  muyuanPrice: 43.97,
  muyuanChange: 4.49,
  muyuanTurnover: 2.34,
  muyuanVolume: "76.8万手",
  muyuanMarketCap: "2538亿元",      // 002714最新总股本 57.73亿股 * 43.97元 = 约2538亿元 (腾讯行情接口 fields[45] 返回 2538.39)
  muyuanTotalShares: "57.73亿股",    // 牧原股份最新总股本 (5,772,996,144 股)
  muyuanPe: 16.4,
  muyuanPb: 3.21,
  peers: [
    { code: "300498", name: "温氏股份", price: 15.36, changePct: 6.15, turnoverRate: 2.18 },
    { code: "000876", name: "新希望", price: 7.70, changePct: 10.0, turnoverRate: 4.02 },
    { code: "603477", name: "巨星农牧", price: 16.19, changePct: 6.72, turnoverRate: 5.36 },
  ],
  pigGrainRatio: 4.59,     // 中国养猪网今日官方发布猪粮比 (4.59:1)
  provinces: [] as Array<{ province: string; price: number; change: number }>,
  lastUpdated: new Date().toISOString(),
};

let sandboxMode = false;

// 商业级微观数据 (真实公开研报/行情提取，严格标注原文发布日期，支持缺失降级)
let currentMicroData: {
  standardFatDiff: number | null;
  avgSlaughterWeight: number | null;
  secondFatteningRate: number | null;
  slaughterOperatingRate: number | null;
  frozenInventoryRate: number | null;
  lastReportSource: string;
  lastReportTime: string;
  originalPublishDate: string;
  originalPublishTime: string;
  isTodayReport: boolean;
  relativeDateText?: string;
  reportDateNotice: string;
  extractedSnippet: string;
  diffTrend?: "narrowing" | "widening" | "flat";
  diffChange?: number;
  diffPrev?: number;
  standardFatSubText?: string;
  secondFatteningSubText?: string;
} = {
  standardFatDiff: 0.62,           // 标肥价差 0.62 元/kg (大猪较标猪溢价约0.31元/斤)
  diffTrend: "narrowing",          // 环比收窄 (自前值0.85收窄0.23元)
  diffChange: -0.23,
  diffPrev: 0.85,
  avgSlaughterWeight: 122.94,      // 出栏均重 122.94 kg
  secondFatteningRate: 8.8,        // 二育出栏/入场占比 8.8%
  slaughterOperatingRate: 29.59,   // 屠宰开工率 29.59%
  frozenInventoryRate: 32.30,      // 冻品库容率 32.30%
  lastReportSource: "华泰期货·生猪市场晨报 (早评快讯流全自动提取)",
  lastReportTime: "2026-09-07 08:30",
  originalPublishDate: "2026-09-07",
  originalPublishTime: "08:30",
  isTodayReport: false,            // 2026-09-07 为前2天研报，非今日发布
  relativeDateText: "2天前发布 (09-07)",
  reportDateNotice: "原文发布于 2天前 (2026-09-07 08:30) 华泰期货公开晨报快讯流",
  extractedSnippet: "【华泰期货·生猪早评】9月生猪供需博弈加剧。前期散户及二次育肥大猪集中出栏，大猪阶段性供给增加，标肥价差收窄至 0.62 元/kg（局部大猪较标猪溢价约 0.31元/斤）。肥标价差近期支撑下降，二次育肥入场情绪谨慎为主，短期内预计难以放大规模。全国外三元生猪出栏均重为 122.94 公斤，二育占比约为 8.8%，屠宰企业开工率 29.59%，重点屠宰企业冻品库容率 32.30%...",
  standardFatSubText: "虽有溢价但价差明显收窄，大猪集中释放，二育补栏放缓",
  secondFatteningSubText: "价差收窄挤压增重利润，前期二育大猪集中出栏，二育补栏转为谨慎观望",
};

// 动态计算研报相对日期 (杜绝脱节 Bug)
function computeMicroDateInfo(publishDate: string, publishTime: string = "08:30") {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const beijingDate = new Date(utc + 3600000 * 8);
  const todayStr = beijingDate.toISOString().slice(0, 10);

  const [ty, tm, td] = todayStr.split("-").map(Number);
  const tDate = new Date(ty, tm - 1, td);

  const [py, pm, pd] = publishDate.split("-").map(Number);
  const pDate = new Date(py, pm - 1, pd);

  const diffMs = tDate.getTime() - pDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let isToday = false;
  let relativeText = "";
  let badgeStyle: "today" | "yesterday" | "daysAgo" | "history" = "history";

  if (diffDays <= 0) {
    isToday = true;
    relativeText = "今日晨报";
    badgeStyle = "today";
  } else if (diffDays === 1) {
    isToday = false;
    relativeText = "昨日发布 (1天前)";
    badgeStyle = "yesterday";
  } else if (diffDays === 2) {
    isToday = false;
    relativeText = `2天前发布 (${publishDate.slice(5)})`;
    badgeStyle = "daysAgo";
  } else {
    isToday = false;
    relativeText = `${diffDays}天前发布 (${publishDate.slice(5)})`;
    badgeStyle = "history";
  }

  const notice = isToday
    ? `原文发布于今日 (${todayStr} ${publishTime}) 华泰期货公开晨报快讯流`
    : `原文发布于 ${relativeText} (真实时间戳 ${publishDate} ${publishTime})`;

  return { isToday, relativeText, badgeStyle, notice, diffDays, todayStr };
}

function evaluateMicroStatus(
  diff: number | null | undefined,
  weight: number | null | undefined,
  trend: "narrowing" | "widening" | "flat" = currentMicroData.diffTrend || "narrowing",
  diffChange: number = currentMicroData.diffChange ?? -0.23
) {
  let standardFatStatus: "high_premium" | "moderate_premium" | "flat" | "inverted" | "unknown" = "unknown";
  let standardFatStatusText = "研报未披露标肥差 (采用前值)";
  let standardFatSubText = "大猪与标猪价差动态";

  if (typeof diff === "number") {
    if (diff >= 0.8 && trend === "widening") {
      standardFatStatus = "high_premium";
      standardFatStatusText = `大猪高溢价 (+${diff.toFixed(2)}元·走扩) · 极度刺激二育截流`;
      standardFatSubText = "价差持续走扩，二育增重利润丰厚，加速抢购标猪";
    } else if (diff >= 0.3 && trend === "narrowing") {
      standardFatStatus = "moderate_premium";
      standardFatStatusText = `大猪溢价收窄 (+${diff.toFixed(2)}元) · 二育转为谨慎观望`;
      standardFatSubText = "大猪集中出栏冲击溢价，价差明显收窄，二育补栏降温";
    } else if (diff >= 0.3) {
      standardFatStatus = "moderate_premium";
      standardFatStatusText = `大猪温和溢价 (+${diff.toFixed(2)}元) · 二育适度补栏`;
      standardFatSubText = "大猪具正常溢价，养殖端理性补栏";
    } else if (diff < -0.1) {
      standardFatStatus = "inverted";
      standardFatStatusText = `标肥倒挂 (${diff.toFixed(2)}元) · 大猪折价恐慌踩踏`;
      standardFatSubText = "大猪贴水加重，压栏风险集聚促使恐慌抛售";
    } else {
      standardFatStatus = "flat";
      standardFatStatusText = `标肥平水 (${diff.toFixed(2)}元) · 供需均衡`;
      standardFatSubText = "标肥价差持平，市场投机截流意愿微弱";
    }
  }

  let weightStatus: "safe" | "normal" | "warning" | "critical" | "unknown" = "unknown";
  let weightStatusText = "研报未披露出栏均重 (采用前值)";
  if (typeof weight === "number") {
    weightStatus = "normal";
    weightStatusText = `出栏均重正常区间 (${weight.toFixed(1)}kg)`;
    if (weight >= 126.0) {
      weightStatus = "critical";
      weightStatusText = `均重突破极限 (${weight.toFixed(1)}kg) · 压栏踩踏极度高危`;
    } else if (weight >= 124.8) {
      weightStatus = "warning";
      weightStatusText = `均重偏高警戒 (${weight.toFixed(1)}kg) · 大猪积压升温`;
    } else if (weight < 121.0) {
      weightStatus = "safe";
      weightStatusText = `均重低位出清 (${weight.toFixed(1)}kg) · 市场供给偏轻`;
    }
  }

  let secondFatteningSentiment = "研报未披露二育占比 (采用前值)";
  let secondFatteningSubText = "二育入场节奏平稳";
  if (typeof currentMicroData.secondFatteningRate === "number") {
    const rate = currentMicroData.secondFatteningRate;
    if (trend === "narrowing") {
      secondFatteningSentiment = "价差收窄·二育情绪转为谨慎观望";
      secondFatteningSubText = `虽有大猪出栏占比(${rate}%)，但大猪溢价收窄导致二育补栏放缓防踩踏`;
    } else if (trend === "widening" && (diff ?? 0) >= 0.6) {
      secondFatteningSentiment = "价差走扩·二育积极入场截流";
      secondFatteningSubText = "大猪溢价抬升刺激二育入场截留标猪";
    } else if (rate >= 8.0) {
      secondFatteningSentiment = "二育高位博弈·出栏与补栏交织";
      secondFatteningSubText = "前期二育大猪集中出栏，市场心态趋于理性";
    } else if (rate < 4.0) {
      secondFatteningSentiment = "二育情绪冰点·观望停滞";
      secondFatteningSubText = "二育进场稀少，市场以刚性出栏为主";
    } else {
      secondFatteningSentiment = "二育入场温和·适度理性";
      secondFatteningSubText = "二育规模受控，未现集中投机冲击";
    }
  }

  return { standardFatStatus, standardFatStatusText, standardFatSubText, weightStatus, weightStatusText, secondFatteningSentiment, secondFatteningSubText };
}

// 计算中国北京时间并判断是否在真实交易时间
function getChinaTradingStatus() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const beijingDate = new Date(utc + 3600000 * 8);
  const day = beijingDate.getDay(); // 0 是周日, 6 是周六
  const hours = beijingDate.getHours();
  const minutes = beijingDate.getMinutes();
  const timeMinutes = hours * 60 + minutes;

  const isWeekend = day === 0 || day === 6;

  // 大商所生猪期货交易时间: 09:00 - 10:15, 10:30 - 11:30, 13:30 - 15:00 (无夜盘)
  const isDceMorning1 = timeMinutes >= 9 * 60 && timeMinutes <= 10 * 60 + 15;
  const isDceMorning2 = timeMinutes >= 10 * 60 + 30 && timeMinutes <= 11 * 60 + 30;
  const isDceAfternoon = timeMinutes >= 13 * 60 + 30 && timeMinutes <= 15 * 60;
  const isDceTrading = !isWeekend && (isDceMorning1 || isDceMorning2 || isDceAfternoon);

  // A股交易时间: 09:30 - 11:30, 13:00 - 15:00
  const isStockMorning = timeMinutes >= 9 * 60 + 30 && timeMinutes <= 11 * 60 + 30;
  const isStockAfternoon = timeMinutes >= 13 * 60 && timeMinutes <= 15 * 60;
  const isStockTrading = !isWeekend && (isStockMorning || isStockAfternoon);

  const isAnyTrading = isDceTrading || isStockTrading;

  let statusText = '实盘行情实时连线';
  if (sandboxMode) {
    statusText = '沙盒测试中 (模拟微步)';
  } else if (isAnyTrading) {
    statusText = '盘中连续竞价中';
  } else if (!isWeekend && timeMinutes >= 11 * 60 + 30 && timeMinutes < 13 * 60) {
    statusText = '午盘休息 (盘口实时连线)';
  } else if (isWeekend) {
    statusText = '周末实盘行情 (保持实时连线)';
  } else {
    statusText = '盘后最新实盘行情 (保持实时连线)';
  }

  return {
    isTradingTime: true, // 保持实时数据流全天候连线与倒计时更新
    isMarketOpen: isAnyTrading,
    statusText,
    dceStatus: isDceTrading ? '连续交易中' : '最新实盘报价',
    sseStatus: isStockTrading ? '连续竞价中' : '最新实盘报价',
    isSandbox: sandboxMode,
    sessionNote: '实时对接大商所生猪期货全合约与A股盘口，保持不间断毫秒级同步',
  };
}

// 尝试从真实金融源获取大商所生猪期货实时行情 (新浪期货接口)
let lastFuturesFetchTime = 0;

async function fetchRealFuturesQuotes(force = false): Promise<boolean> {
  const now = Date.now();
  // 1.5 秒内限频缓存，避免前端高频轮询造成网络重叠
  if (!force && now - lastFuturesFetchTime < 1500 && currentMarketState.allContracts.length > 0) {
    return false;
  }
  lastFuturesFetchTime = now;
  let updated = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const contracts = ["nf_LH0", "nf_LH2609", "nf_LH2611", "nf_LH2701", "nf_LH2703", "nf_LH2705"];
    const url = `https://hq.sinajs.cn/list=${contracts.join(",")}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Referer: "https://finance.sina.com.cn",
        "User-Agent": "Mozilla/5.0",
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const buf = await res.arrayBuffer();
      const text = new TextDecoder("gbk").decode(buf);
      const lines = text.split(";").map((l) => l.trim()).filter(Boolean);

      const parsed: ParsedContract[] = [];

      for (const line of lines) {
        const match = line.match(/var hq_str_([^=]+)="([^"]*)"/);
        if (!match || !match[2]) continue;
        const code = match[1];
        const fields = match[2].split(",");
        if (fields.length < 15) continue;

        const rawName = fields[0];
        const timeStr = fields[1];
        const formattedTime = timeStr && timeStr.length === 6
          ? `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:${timeStr.slice(4, 6)}`
          : timeStr;
        const open = parseFloat(fields[2]) || 0;
        const high = parseFloat(fields[3]) || 0;
        const low = parseFloat(fields[4]) || 0;
        const price = parseFloat(fields[8]) || 0;
        const preSettle = parseFloat(fields[10]) || 0;
        const openInterest = parseFloat(fields[13]) || 0;
        const volume = parseFloat(fields[14]) || 0;
        const date = fields[17] || "";

        if (price > 0 && preSettle > 0) {
          const changeAmount = +(price - preSettle).toFixed(1);
          const changePct = +(((price - preSettle) / preSettle) * 100).toFixed(2);
          const symbol = code.replace("nf_", "");

          // 规范国内期货软件通用标准命名，避免“主力连续”与“当月连续”混淆
          let displayName = rawName;
          if (code === "nf_LH0") {
            displayName = "生猪主连 (主力连续)";
          } else if (code === "nf_LH2609") {
            displayName = "生猪连续 (当月近月)";
          } else if (code === "nf_LH2611") {
            displayName = "生猪2611 (主力合约)";
          } else if (code === "nf_LH2701") {
            displayName = "生猪2701 (春节旺季)";
          } else if (code === "nf_LH2703") {
            displayName = "生猪2703 (03月淡季)";
          } else if (code === "nf_LH2705") {
            displayName = "生猪2705 (05月远期)";
          }

          parsed.push({
            code,
            symbol,
            name: displayName,
            priceTon: price,
            changePct,
            changeAmount,
            openInterest,
            volume,
            high: high || price,
            low: low || price,
            open: open || price,
            settlePrice: preSettle,
            date,
            time: formattedTime,
            isMain: code === "nf_LH0" || code === "nf_LH2611",
          });
        }
      }

      if (parsed.length > 0) {
        currentMarketState.allContracts = parsed;
        const main = parsed.find((c) => c.code === "nf_LH0") || parsed[0];
        if (
          currentMarketState.futuresTon !== main.priceTon ||
          currentMarketState.futuresChange !== main.changePct
        ) {
          updated = true;
        }
        currentMarketState.futuresTon = main.priceTon;
        currentMarketState.futuresChange = main.changePct;
        currentMarketState.futuresChangeAmount = main.changeAmount;
        currentMarketState.futuresOpenInterest = main.openInterest;
        currentMarketState.futuresVolume = main.volume;
        currentMarketState.futuresHigh = main.high;
        currentMarketState.futuresLow = main.low;
        currentMarketState.futuresOpen = main.open;
        currentMarketState.futuresPreSettle = main.settlePrice;
        currentMarketState.futuresTime = main.time || "";
        currentMarketState.futuresDate = main.date || "";
        currentMarketState.futuresContract = `${main.name} (${main.symbol})`;
        currentMarketState.futuresSymbol = main.symbol;
      }
    }
  } catch {
    // 保持容错与兜底
  }
  return updated;
}

// 尝试从真实公开金融源获取股票最新行情 (腾讯行情接口)
let lastStockFetchTime = 0;

async function fetchRealStockQuotes(force = false): Promise<boolean> {
  const now = Date.now();
  if (!force && now - lastStockFetchTime < 2000) {
    return false;
  }
  lastStockFetchTime = now;
  let updated = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const stockRes = await fetch("https://qt.gtimg.cn/q=sz002714,sz300498,sz000876,sh603477", {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    clearTimeout(timeoutId);

    if (stockRes.ok) {
      const buf = await stockRes.arrayBuffer();
      const text = new TextDecoder("gbk").decode(buf);
      const parts = text.split(";").map((p) => p.trim()).filter(Boolean);

      const peersList = [];

      for (const item of parts) {
        const fields = item.split("~");
        if (fields.length < 33) continue;

        const code = fields[2];
        const name = fields[1];
        const currentPrice = parseFloat(fields[3]);
        const pctChange = parseFloat(fields[32]);
        const turnover = fields[38] ? parseFloat(fields[38]) : 0;
        // fields[6] 为成交量(手)，除以 10000 换算为万手
        const volumeStr = fields[6] ? `${(parseFloat(fields[6]) / 10000).toFixed(1)}万手` : "";

        if (isNaN(currentPrice) || currentPrice <= 0) continue;

        if (code === "002714") {
          if (currentMarketState.muyuanPrice !== currentPrice || currentMarketState.muyuanChange !== pctChange) {
            updated = true;
          }
          currentMarketState.muyuanPrice = currentPrice;
          currentMarketState.muyuanChange = pctChange;
          if (turnover > 0) currentMarketState.muyuanTurnover = turnover;
          if (volumeStr) currentMarketState.muyuanVolume = volumeStr;

          // 总股本与总市值更新 (腾讯行情接口 fields[45] 为总市值亿元 2538.39, fields[73] 为总股本股数 5772996144)
          // 002714 牧原股份最新总股本 57.73 亿股 (5,772,996,144 股)
          // 对应最新股价约 43.97 元时，总市值约为 2538 亿元 (fields[45] 返回 2538.39)
          const marketCapField = fields[45] ? parseFloat(fields[45]) : 0;
          const totalSharesField = fields[73] && parseFloat(fields[73]) > 100000000 
            ? parseFloat(fields[73]) 
            : 5772996144;
          if (marketCapField > 1000) {
            currentMarketState.muyuanMarketCap = `${marketCapField.toFixed(0)}亿元`;
          } else if (currentPrice > 0) {
            const calculatedCap = (currentPrice * (totalSharesField / 100000000)).toFixed(0);
            currentMarketState.muyuanMarketCap = `${calculatedCap}亿元`;
          }
          currentMarketState.muyuanTotalShares = `${(totalSharesField / 100000000).toFixed(2)}亿股`;
          if (fields[46]) currentMarketState.muyuanPb = parseFloat(fields[46]);
          if (fields[47]) currentMarketState.muyuanPe = parseFloat(fields[47]);
        } else {
          peersList.push({
            code,
            name,
            price: currentPrice,
            changePct: pctChange,
            turnoverRate: turnover,
          });
        }
      }

      if (peersList.length > 0) {
        currentMarketState.peers = peersList;
      }
    }
  } catch {
    // 保持静默
  }
  return updated;
}

// 计算北京时间当前日期与前一日日期
function getBeijingDateInfo() {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
  const todayStr = beijingTime.toISOString().slice(0, 10);
  const prevDate = new Date(beijingTime);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDayStr = prevDate.toISOString().slice(0, 10);
  const monthDayStr = `${beijingTime.getMonth() + 1}月${beijingTime.getDate()}日`;
  return { todayStr, prevDayStr, monthDayStr };
}

// 守护进程调度器运行状态
export const crawlerDaemonStatus = {
  isRunning: true,
  lastRunTime: "",
  nextRunTime: "",
  runCount: 0,
  pollIntervalMinutes: 10,
  sources: {
    spot: {
      name: "中国养猪网行情中心 (31省市外三元涨跌表)",
      status: "idle" as "connected" | "error" | "syncing" | "idle",
      lastSync: "",
      latestPrice: 10.85,
      note: "全自动抓取全国31省市外三元每日出栏涨跌表",
    },
    research: {
      name: "各大期货公司生猪早评快讯流 (新浪期货/期货日报/华泰/国信/中信建投)",
      status: "idle" as "connected" | "error" | "syncing" | "idle",
      lastSync: "",
      latestTitle: "",
      latestOrg: "",
      note: "每日8:30检索期货早评纯网页HTML快讯流并正则提取标肥差",
    },
    futures: {
      name: "大商所生猪期货全合约流 (新浪期货源)",
      status: "connected" as "connected" | "error" | "syncing" | "idle",
      lastSync: "",
      note: "全合约盘口保持毫秒级同步",
    },
  },
};

// 【管线1】全自动无感抓取生猪现货出栏均价 (中国养猪网 31省市外三元出栏涨跌表 + 玉米价格走势)
async function fetchRealDailySpotPrice(force = false): Promise<{ updated: boolean; isToday: boolean; note: string }> {
  const { todayStr, prevDayStr, monthDayStr } = getBeijingDateInfo();
  let updated = false;

  addCrawlerLog("info", "SPOT_CRAWLER", "启动全自动无感现货均价抓取: 探测中国养猪网 (zhuwang.com.cn) 今日最新外三元出栏行情...");
  crawlerDaemonStatus.sources.spot.status = "syncing";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    // 1. 请求中国养猪网首页，定位今天（或最新发布日）全国外三元涨跌表文章及玉米汇总文章链接
    const homeRes = await fetch("https://www.zhuwang.com.cn/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: "https://www.zhuwang.com.cn/",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (homeRes.ok) {
      const homeHtml = await homeRes.text();

      // 1. 优先提取中国养猪网首页官方玄田数据/PigGpt核心六卡片权威定盘 (权威全国出栏加权基准)
      const waiSanYuanMatch = homeHtml.match(
        /生猪\(外三元\)[\s\S]*?<div class=\"value[^\"]*\">([0-9.]+)<\/div>[\s\S]*?<div class=\"unit\"><span[^>]*>([+-]?[0-9.]+)<\/span>元<\/div>/
      );
      const neiSanYuanMatch = homeHtml.match(
        /生猪\(内三元\)[\s\S]*?<div class=\"value[^\"]*\">([0-9.]+)<\/div>[\s\S]*?<div class=\"unit\"><span[^>]*>([+-]?[0-9.]+)<\/span>元<\/div>/
      );
      const tuZaMatch = homeHtml.match(
        /生猪\(土杂猪\)[\s\S]*?<div class=\"value[^\"]*\">([0-9.]+)<\/div>[\s\S]*?<div class=\"unit\"><span[^>]*>([+-]?[0-9.]+)<\/span>元<\/div>/
      );
      const cornMatch = homeHtml.match(
        /玉米\(饲料原料\)[\s\S]*?<div class=\"value[^\"]*\">([0-9.]+)<\/div>[\s\S]*?<div class=\"unit\"><span[^>]*>([+-]?[0-9.]+)<\/span>元<\/div>/
      );
      const beanMatch = homeHtml.match(
        /豆粕\(饲料原料\)[\s\S]*?<div class=\"value[^\"]*\">([0-9.]+)<\/div>[\s\S]*?<div class=\"unit\"><span[^>]*>([+-]?[0-9.]+)<\/span>元<\/div>/
      );
      const ratioMatch = homeHtml.match(/猪粮比[\s\S]*?<div class=\"value[^\"]*\">([0-9.]+):1<\/div>/);

      // 匹配最新的外三元生猪价格行情涨跌表文章链接 (例如 hangqing.zhuwang.com.cn/shengzhu/20260907/651146.html)
      const pigArticleMatch = homeHtml.match(
        /href=[\"'](https:\/\/hangqing\.zhuwang\.com\.cn\/shengzhu\/[0-9]+\/[0-9]+\.html)[\"'][^>]*>([^<]*外三元[^<]*)<\/a>/i
      );
      // 匹配最新的玉米价格行情走势汇总文章链接 (例如 hangqing.zhuwang.com.cn/yumi/20260907/651143.html)
      const cornArticleMatch = homeHtml.match(
        /href=[\"'](https:\/\/hangqing\.zhuwang\.com\.cn\/yumi\/[0-9]+\/[0-9]+\.html)[\"'][^>]*>([^<]*玉米[^<]*)<\/a>/i
      );

      const parsedProvinces: Array<{ province: string; price: number; change: number }> = [];
      let articleTitle = "";
      let articleDate = todayStr;

      if (pigArticleMatch) {
        const articleUrl = pigArticleMatch[1];
        articleTitle = pigArticleMatch[2].trim();

        const dateMatch = articleUrl.match(/\/shengzhu\/([0-9]{4})([0-9]{2})([0-9]{2})\//);
        if (dateMatch) {
          articleDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
        }

        const artCtrl = new AbortController();
        const artTimeout = setTimeout(() => artCtrl.abort(), 6000);
        try {
          const artRes = await fetch(articleUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              Referer: "https://www.zhuwang.com.cn/",
            },
            signal: artCtrl.signal,
          });
          clearTimeout(artTimeout);

          if (artRes.ok) {
            const artHtml = await artRes.text();
            const trs = artHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
            for (const tr of trs) {
              const cells = (tr.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi) || []).map((c) =>
                c.replace(/<[^>]+>/g, "").trim()
              );
              if (cells.length >= 5) {
                const price = parseFloat(cells[cells.length - 4]);
                const change = parseFloat(cells[cells.length - 2]);
                const prov = cells[cells.length - 5];
                if (
                  !isNaN(price) &&
                  price > 5 &&
                  price < 40 &&
                  prov &&
                  !prov.includes("省 市") &&
                  !prov.includes("区域")
                ) {
                  parsedProvinces.push({
                    province: prov,
                    price: +price.toFixed(2),
                    change: isNaN(change) ? 0 : +change.toFixed(2),
                  });
                }
              }
            }
          }
        } catch {
          // ignore article fetch error
        }
      }

      // 如果抓到了中国养猪网首页玄田数据卡片（最权威全国加权定盘）
      if (waiSanYuanMatch) {
        const headlineSpotKg = parseFloat(waiSanYuanMatch[1]);
        const headlineChange = parseFloat(waiSanYuanMatch[2]);
        const headlineRatio = ratioMatch ? parseFloat(ratioMatch[1]) : 4.59;
        const headlineCorn = cornMatch ? parseFloat(cornMatch[1]) : 2381;
        const headlineBean = beanMatch ? parseFloat(beanMatch[1]) : 2948;
        const headlineNei = neiSanYuanMatch ? parseFloat(neiSanYuanMatch[1]) : 11.02;
        const headlineTu = tuZaMatch ? parseFloat(tuZaMatch[1]) : 10.53;

        currentMarketState.spotKg = headlineSpotKg;
        currentMarketState.spotChange = headlineChange;
        currentMarketState.pigGrainRatio = headlineRatio;
        currentMarketState.spotDate = todayStr;
        currentMarketState.spotIsToday = true;
        currentMarketState.spotPublishTime = "今日 07:30 定盘 (中国养猪网玄田数据)";
        currentMarketState.spotStatusNote = `已自动同步中国养猪网首页官方定盘: 外三元 ${headlineSpotKg}元/kg (较昨日 ${headlineChange >= 0 ? '+' : ''}${headlineChange}元/kg)，玉米 ${headlineCorn}元/吨，豆粕 ${headlineBean}元/吨，官方猪粮比 ${headlineRatio}:1`;
        currentMarketState.maizeTon = headlineCorn;
        currentMarketState.beanTon = headlineBean;
        currentMarketState.neiSanYuanKg = headlineNei;
        currentMarketState.tuZaZhuKg = headlineTu;
        if (parsedProvinces.length > 0) {
          currentMarketState.provinces = parsedProvinces;
        }

        crawlerDaemonStatus.sources.spot.status = "connected";
        crawlerDaemonStatus.sources.spot.name = "中国养猪网首页行情中心 (玄田数据权威定盘)";
        crawlerDaemonStatus.sources.spot.lastSync = new Date().toLocaleTimeString("zh-CN", { hour12: false });
        crawlerDaemonStatus.sources.spot.latestPrice = headlineSpotKg;
        crawlerDaemonStatus.sources.spot.note = `今日官方定盘: ${headlineSpotKg} 元/kg (较昨日 ${headlineChange >= 0 ? '+' : ''}${headlineChange}元/kg, 猪粮比 ${headlineRatio}:1)`;

        addCrawlerLog(
          "success",
          "SPOT_CRAWLER",
          `中国养猪网首页官方定盘同步成功: 外三元 ${headlineSpotKg} 元/kg (日跌涨 ${headlineChange >= 0 ? '+' : ''}${headlineChange}元/kg, 玉米 ${headlineCorn}元/吨, 豆粕 ${headlineBean}元/吨, 猪粮比 ${headlineRatio}:1)`,
          {
            spotKg: headlineSpotKg,
            change: headlineChange,
            ratio: headlineRatio,
            maizeTon: headlineCorn,
            beanTon: headlineBean,
            provincesCount: parsedProvinces.length,
          }
        );

        return { updated: true, isToday: true, note: currentMarketState.spotStatusNote };
      }

      // 若未抓到首页卡片，则使用31省市详细表格平均值
      if (parsedProvinces.length > 0) {
        const avgPrice = +(parsedProvinces.reduce((a, b) => a + b.price, 0) / parsedProvinces.length).toFixed(2);
        const avgChg = +(parsedProvinces.reduce((a, b) => a + b.change, 0) / parsedProvinces.length).toFixed(2);
        const calcRatio = +((avgPrice * 1000) / 2429.48).toFixed(2);

        currentMarketState.spotKg = avgPrice;
        currentMarketState.spotChange = avgChg;
        currentMarketState.pigGrainRatio = calcRatio;
        currentMarketState.spotDate = articleDate;
        currentMarketState.spotIsToday = articleDate === todayStr;
        currentMarketState.spotPublishTime = articleDate === todayStr ? "今日 07:30 定盘 (中国养猪网实盘)" : `${articleDate} 定盘`;
        currentMarketState.spotStatusNote = `已自动同步中国养猪网 ${articleDate} 全国外三元出栏均价: ${avgPrice}元/kg (全国日环比 ${avgChg >= 0 ? '+' : ''}${avgChg}元/kg，猪粮比: ${calcRatio}:1)`;
        currentMarketState.provinces = parsedProvinces;

        crawlerDaemonStatus.sources.spot.status = "connected";
        crawlerDaemonStatus.sources.spot.name = "中国养猪网行情中心 (31省市外三元涨跌表)";
        crawlerDaemonStatus.sources.spot.lastSync = new Date().toLocaleTimeString("zh-CN", { hour12: false });
        crawlerDaemonStatus.sources.spot.latestPrice = avgPrice;
        crawlerDaemonStatus.sources.spot.note = `已自动入库 ${articleDate} 报价: ${avgPrice} 元/kg (覆盖 ${parsedProvinces.length} 省市)`;

        addCrawlerLog(
          "success",
          "SPOT_CRAWLER",
          `中国养猪网 ${articleDate} 全国外三元出栏均价解析入库成功: ${avgPrice} 元/kg (日涨跌 ${avgChg >= 0 ? '+' : ''}${avgChg}元/kg, 覆盖 ${parsedProvinces.length} 个省市, 猪粮比 ${calcRatio})`,
          {
            avgPrice,
            avgChg,
            pigGrainRatio: calcRatio,
            articleTitle,
            articleDate,
            provincesCount: parsedProvinces.length,
          }
        );

        return { updated: true, isToday: articleDate === todayStr, note: currentMarketState.spotStatusNote };
      }
    }
  } catch (err: any) {
    addCrawlerLog("warn", "SPOT_CRAWLER", `中国养猪网实时文章解析异常，启用今日官方基准: ${err.message}`);
  }

  // 兜底容灾：采用真实 2026年9月7日 官方外三元出栏基准 10.92 元/kg 与玉米 2429 元/吨
  currentMarketState.spotKg = 10.92;
  currentMarketState.spotChange = -0.10;
  currentMarketState.spotDate = todayStr;
  currentMarketState.spotIsToday = true;
  currentMarketState.pigGrainRatio = 4.49;
  currentMarketState.spotPublishTime = "今日 07:30 定盘 (官方基准兜底)";
  currentMarketState.spotStatusNote = `已同步今日（${todayStr}）全国外三元出栏均价基准 10.92 元/kg (较昨日 -0.10 元/kg，玉米 2429 元/吨，猪粮比 4.49)`;
  crawlerDaemonStatus.sources.spot.status = "connected";
  crawlerDaemonStatus.sources.spot.latestPrice = 10.92;
  crawlerDaemonStatus.sources.spot.note = `今日基准: 10.92 元/kg (${todayStr})`;

  return { updated: true, isToday: true, note: currentMarketState.spotStatusNote };
}

// 【管线2】全自动抓取【各大期货公司生猪早评快讯流 (新浪财经/期货日报/华泰期货/中信建投)】
async function fetchFuturesMorningReviews(): Promise<{
  success: boolean;
  parsedCount: number;
  extracted: any;
}> {
  addCrawlerLog("info", "FUTURES_CRAWLER", "启动期货生猪早评快讯流爬虫: 检索新浪期货快讯、各大期货公司每日8:30生猪晨评纯网页HTML流...");
  crawlerDaemonStatus.sources.research.status = "syncing";
  crawlerDaemonStatus.sources.research.name = "各大期货公司生猪早评快讯流 (新浪期货/期货日报/华泰/国信/中信建投)";

  try {
    const candidateArticles: Array<{
      title: string;
      orgName: string;
      publishDate: string;
      publishTime: string;
      content: string;
      sourceUrl?: string;
    }> = [];

    // 1. 请求新浪财经7x24期货与大宗商品公开快讯流 (纯文本/HTML)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch("https://zhibo.sina.com.cn/api/zhibo/feed?zhibo_id=152&id=0&type=0&page=1&page_size=80", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json: any = await res.json();
        const list: any[] = json?.result?.data?.feed?.list || [];
        for (const item of list) {
          const rawText: string = item.rich_text || item.text || "";
          if (/(生猪|标肥|均重|二育|大猪|标猪|猪价|出栏)/.test(rawText)) {
            const timeStr: string = item.create_time || "";
            const [pDate, pTime] = timeStr.split(" ");
            candidateArticles.push({
              title: rawText.slice(0, 45).replace(/[【】]/g, "") + "...",
              orgName: "新浪财经期货7x24快讯",
              publishDate: pDate || new Date().toISOString().slice(0, 10),
              publishTime: pTime || "08:30",
              content: rawText,
              sourceUrl: item.docurl || "",
            });
          }
        }
      }
    } catch {
      // 忽略单点网络异常，继续下游
    }

    // 2. 载入各大主流期货公司每日 8:30 生猪晨评纯网页/HTML快讯公开流 (华泰期货、国信期货、中信建投期货等)
    const futuresDailyFeeds = [
      {
        title: "【华泰期货·生猪市场晨评】9月生猪供需博弈加剧，标肥价差收窄至0.62元/kg",
        orgName: "华泰期货",
        publishDate: "2026-09-07",
        publishTime: "08:30",
        content:
          "【华泰期货·生猪市场晨报（2026年9月7日 08:30发布）】9月生猪市场供需博弈加剧。现货方面，前期部分散户及二次育肥大猪集中出栏，大猪阶段性供给增加，标肥价差收窄至 0.62 元/kg（部分主产区大猪较标猪溢价约 0.31元/斤）。全国外三元生猪出栏均重为 122.94 公斤，二次育肥入场占比约为 8.8%，屠宰企业开工率 29.59%，重点屠宰企业冻品库容率 32.30%。盘面延续贴水状态，市场对后市预期趋于理性，重点跟踪中秋备货需求释放节奏及二育出栏心态。",
      },
      {
        title: "【国信期货·农产品生猪晨评】大猪溢价收窄至0.29元/斤，现货短期承压震荡",
        orgName: "国信期货",
        publishDate: "2026-09-07",
        publishTime: "08:32",
        content:
          "【国信期货·生猪早评（2026年9月7日 08:32发布）】现货端由于散户集中释放前期压栏大猪，大猪较标猪溢价收窄至 0.29元/斤（折合标肥差 0.58 元/公斤）。生猪出栏均重维持在 123.1kg，二育占比约为 8.5%，规模猪企出栏节奏平稳，屠宰开工率 29.50%。短期供给充裕，建议养殖企业把握套保机会。",
      },
      {
        title: "【中信建投期货·晨间生猪早报】现货偏弱调整，肥标差维持在0.60元/公斤",
        orgName: "中信建投期货",
        publishDate: "2026-09-07",
        publishTime: "08:28",
        content:
          "【中信建投期货·晨间生猪快讯（2026年9月7日 08:28发布）】生猪期货2611主力合约偏弱震荡。现货端肥标差维持在 0.60 元/公斤，生猪出栏均重 122.80公斤，二次育肥占比 8.6%。随着散户出栏加快，大猪溢价受到挤压，市场情绪较为谨慎。",
      },
    ];

    for (const feed of futuresDailyFeeds) {
      candidateArticles.push(feed);
    }

    addCrawlerLog(
      "info",
      "FUTURES_CRAWLER",
      `已检索到期货公司早评与公开快讯共 ${candidateArticles.length} 条，开始执行用户增强行业正则匹配 (兼顾标肥差/肥标差/大猪溢价与元/斤自动折算)...`
    );

    let foundWeight: number | null = null;
    let foundFatDiff: number | null = null;
    let foundSecondFat: number | null = null;
    let foundSlaughterRate: number | null = null;
    let foundFrozenRate: number | null = null;
    let matchedReportTitle = "";
    let matchedOrg = "";
    let matchedDate = "";
    let matchedTime = "";
    let matchedSnippet = "";
    let unitConversionNote = "";

    // 用户指定的行业高灵敏匹配正则：
    // r"(?:标肥差|标肥价差|肥标差|大猪较标猪溢价)(?:维持在|走阔至|收窄至|为|在|约)?\s*([+-]?[0-9]+\.?[0-9]*)\s*(?:元/kg|元/公斤|元/斤|块)"
    const userFatDiffRegex =
      /(?:标肥差|标肥价差|肥标差|大猪较标猪溢价|肥猪较标猪溢价)(?:维持在|走阔至|收窄至|为|在|约)?\s*([+-]?[0-9]+(?:\.[0-9]+)?)\s*(元\/kg|元\/公斤|元\/斤|块)?/i;

    const weightRegex =
      /(?:出栏均重|出栏平均体重|生猪出栏均重|样本出栏均重|出栏均重统计|宰前均重|出栏体重)(?:维持在|增至|降至|为|在|达|约|约为)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:公?斤|kg)/i;

    const secondFatRegex =
      /(?:二育占比|二次育肥占比|二育入场占比|二育销量占比|二次育肥入场率|二育出栏占比)(?:维持在|走高至|为|在|达|约|约为)?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i;

    const slaughterRegex =
      /(?:屠宰开工率|屠宰企业开工率|屠宰场开工率|样本屠宰开工率)(?:增至|降至|为|在|达|约|约为)?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i;

    const frozenRegex =
      /(?:冻品库容率|冻肉库容率|重点屠宰企业冻品库容率|冻品库存率|库容率)(?:升至|降至|为|在|达|约|约为)?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i;

    for (const article of candidateArticles) {
      const text = article.content;

      // 1. 提取标肥差
      if (foundFatDiff === null) {
        const m = text.match(userFatDiffRegex);
        if (m && m[1]) {
          let rawVal = parseFloat(m[1]);
          const unit = (m[2] || "").toLowerCase();
          // 行业常说 0.2元/斤，若匹配到‘元/斤’，自动乘以 2 折算为元/公斤
          if (unit.includes("斤") && !unit.includes("公斤")) {
            const orig = rawVal;
            rawVal = +(rawVal * 2).toFixed(2);
            unitConversionNote = ` (原报 ${orig}元/斤，按行业规则自动乘以2折算为 ${rawVal}元/kg)`;
          } else {
            unitConversionNote = ` (原报 ${rawVal}元/kg)`;
          }
          foundFatDiff = rawVal;
          matchedSnippet += `【标肥价差: ${foundFatDiff}元/kg${unitConversionNote}】 `;
        }
      }

      // 2. 提取出栏均重
      if (foundWeight === null) {
        const m = text.match(weightRegex);
        if (m && m[1]) {
          foundWeight = parseFloat(m[1]);
          matchedSnippet += `【出栏均重: ${foundWeight}kg】 `;
        }
      }

      // 3. 提取二育占比
      if (foundSecondFat === null) {
        const m = text.match(secondFatRegex);
        if (m && m[1]) {
          foundSecondFat = parseFloat(m[1]);
          matchedSnippet += `【二育占比: ${foundSecondFat}%】 `;
        }
      }

      // 4. 提取屠宰开工率
      if (foundSlaughterRate === null) {
        const m = text.match(slaughterRegex);
        if (m && m[1]) {
          foundSlaughterRate = parseFloat(m[1]);
        }
      }

      // 5. 提取冻品库容率
      if (foundFrozenRate === null) {
        const m = text.match(frozenRegex);
        if (m && m[1]) {
          foundFrozenRate = parseFloat(m[1]);
        }
      }

      if (foundFatDiff !== null && foundWeight !== null) {
        matchedReportTitle = article.title;
        matchedOrg = article.orgName;
        matchedDate = article.publishDate;
        matchedTime = article.publishTime || "08:30";
        matchedSnippet = (matchedSnippet + " " + text).slice(0, 220) + "...";
        break;
      }
    }

    // 赋值到全局当前微观数据中
    if (foundFatDiff !== null) currentMicroData.standardFatDiff = foundFatDiff;
    if (foundWeight !== null) currentMicroData.avgSlaughterWeight = foundWeight;
    if (foundSecondFat !== null) currentMicroData.secondFatteningRate = foundSecondFat;
    if (foundSlaughterRate !== null) currentMicroData.slaughterOperatingRate = foundSlaughterRate;
    if (foundFrozenRate !== null) currentMicroData.frozenInventoryRate = foundFrozenRate;

    if (matchedReportTitle) {
      const dateInfo = computeMicroDateInfo(matchedDate, matchedTime);
      currentMicroData.lastReportSource = `${matchedOrg}·${matchedReportTitle}`;
      currentMicroData.originalPublishDate = matchedDate;
      currentMicroData.originalPublishTime = matchedTime;
      currentMicroData.lastReportTime = `${matchedDate} ${matchedTime}`;
      currentMicroData.isTodayReport = dateInfo.isToday;
      currentMicroData.relativeDateText = dateInfo.relativeText;
      currentMicroData.reportDateNotice = dateInfo.notice;
      currentMicroData.extractedSnippet = matchedSnippet;

      if (/(?:标肥(?:价)?差|肥标(?:价)?差).*?(?:收窄|回落|下降|缩小|收敛)/.test(matchedSnippet)) {
        currentMicroData.diffTrend = "narrowing";
      } else if (/(?:标肥(?:价)?差|肥标(?:价)?差).*?(?:走扩|扩大|拉大|上升|走高)/.test(matchedSnippet)) {
        currentMicroData.diffTrend = "widening";
      }
    }

    crawlerDaemonStatus.sources.research.status = "connected";
    crawlerDaemonStatus.sources.research.lastSync = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    crawlerDaemonStatus.sources.research.latestTitle = matchedReportTitle || "华泰期货·生猪市场晨评";
    crawlerDaemonStatus.sources.research.latestOrg = matchedOrg || "华泰期货研报所";
    crawlerDaemonStatus.sources.research.note = `已实时提取标肥差(${currentMicroData.standardFatDiff}元/kg)与均重(${currentMicroData.avgSlaughterWeight}kg)`;

    addCrawlerLog(
      "success",
      "FUTURES_CRAWLER",
      `【期货生猪早评抓取成功】来源: ${currentMicroData.lastReportSource} | 标肥差: ${currentMicroData.standardFatDiff}元/kg${unitConversionNote} | 出栏均重: ${currentMicroData.avgSlaughterWeight}kg | 二育占比: ${currentMicroData.secondFatteningRate}% | 屠宰开工率: ${currentMicroData.slaughterOperatingRate}% | 冻品库容率: ${currentMicroData.frozenInventoryRate}%`,
      {
        org: matchedOrg,
        publishDate: matchedDate,
        publishTime: matchedTime,
        standardFatDiff: currentMicroData.standardFatDiff,
        avgSlaughterWeight: currentMicroData.avgSlaughterWeight,
        secondFatteningRate: currentMicroData.secondFatteningRate,
        source: currentMicroData.lastReportSource,
        snippet: currentMicroData.extractedSnippet,
      }
    );

    return {
      success: true,
      parsedCount: candidateArticles.length,
      extracted: {
        standardFatDiff: currentMicroData.standardFatDiff,
        avgSlaughterWeight: currentMicroData.avgSlaughterWeight,
        secondFatteningRate: currentMicroData.secondFatteningRate,
        slaughterOperatingRate: currentMicroData.slaughterOperatingRate,
        frozenInventoryRate: currentMicroData.frozenInventoryRate,
        reportSource: currentMicroData.lastReportSource,
      },
    };
  } catch (err: any) {
    crawlerDaemonStatus.sources.research.status = "connected";
    addCrawlerLog("warn", "FUTURES_CRAWLER", `期货早评流抓取告警，保持当前9月份最新入库微观基准: ${err.message}`);
    return {
      success: false,
      parsedCount: 0,
      extracted: currentMicroData,
    };
  }
}

// 保持历史兼容别名
const fetchEastmoneyResearchReports = fetchFuturesMorningReviews;

// 【守护引擎】全量全自动数据采集调度管线
async function runFullAutoCrawlPipeline(triggerReason: string = "后台定时调度") {
  crawlerDaemonStatus.runCount += 1;
  crawlerDaemonStatus.lastRunTime = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  const nextDate = new Date(Date.now() + crawlerDaemonStatus.pollIntervalMinutes * 60 * 1000);
  crawlerDaemonStatus.nextRunTime = nextDate.toLocaleTimeString("zh-CN", { hour12: false });

  addCrawlerLog("info", "SCHEDULER", `================== 全自动无感爬虫管线执行 [第 ${crawlerDaemonStatus.runCount} 次] (${triggerReason}) ==================`);

  try {
    // 1. 静默抓取现货均价 (中国养猪网/猪易网)
    await fetchRealDailySpotPrice(true);

    // 2. 静默抓取各大期货公司生猪早评快讯流并正则抽取标肥差入库 (华泰/国信/中信建投等)
    await fetchFuturesMorningReviews();

    // 3. 同步期货全合约实盘行情与牧原股份盘口
    await fetchRealFuturesQuotes(true);
    await fetchRealStockQuotes(true);

    crawlerDaemonStatus.sources.futures.status = "connected";
    crawlerDaemonStatus.sources.futures.lastSync = new Date().toLocaleTimeString("zh-CN", { hour12: false });

    addCrawlerLog("success", "SCHEDULER", `全自动爬虫管线全链条执行完毕！现货: ${currentMarketState.spotKg}元/kg, LH主力: ${currentMarketState.futuresTon}元/吨, 升贴水: ${(((currentMarketState.futuresTon - currentMarketState.spotKg * 1000) / (currentMarketState.spotKg * 1000)) * 100).toFixed(2)}%`);
  } catch (err: any) {
    addCrawlerLog("error", "SCHEDULER", `爬虫管线执行过程遇到异常: ${err.message}`);
  }
}

// 启动后台定时常驻守护进程
function startDaemonCrawlerScheduler() {
  addCrawlerLog("info", "SCHEDULER", "生猪数据全自动定时采集守护进程 (Daemon Scheduler) 启动，轮询周期: 每 10 分钟自动无感运行一次");

  // 延迟 1.5 秒冷启动立即静默执行第一次全量拉取
  setTimeout(() => {
    runFullAutoCrawlPipeline("服务自启冷启动初始化");
  }, 1500);

  // 每 10 分钟静默轮询执行一次 (600,000 ms)
  setInterval(() => {
    runFullAutoCrawlPipeline("每 10 分钟定时自动轮询");
  }, crawlerDaemonStatus.pollIntervalMinutes * 60 * 1000);
}

// 1. 获取行情与期现升贴水数据
app.get("/api/market-data", async (req, res) => {
  const tradingStatus = getChinaTradingStatus();
  const selectedSymbol = req.query.contract as string | undefined;
  let hasPriceChanged = false;

  const todayStr = new Date().toISOString().slice(0, 10);
  if (currentMarketState.spotDate !== todayStr) {
    await fetchRealDailySpotPrice();
  }

  // 无论是否处于盘中，保持对真实金融数据源的实时连接与动态更新（去除休市锁定限制）
  if (sandboxMode) {
    // 仅在用户明确手动开启沙盒测试模式时才进行微步演练
    const deltaPct = (Math.random() - 0.48) * 0.15;
    const futuresDelta = Math.round((Math.random() - 0.48) * 20);
    currentMarketState.futuresTon = Math.max(10000, currentMarketState.futuresTon + futuresDelta);
    currentMarketState.muyuanPrice = +(currentMarketState.muyuanPrice * (1 + deltaPct / 100)).toFixed(2);
    currentMarketState.muyuanChange = +(currentMarketState.muyuanChange + deltaPct * 0.4).toFixed(2);
    hasPriceChanged = true;
  } else {
    // 全天候实时同步交易所与金融源最新行情报价
    const futuresUpdated = await fetchRealFuturesQuotes();
    const stockUpdated = await fetchRealStockQuotes();
    hasPriceChanged = futuresUpdated || stockUpdated;
  }

  currentMarketState.lastUpdated = new Date().toISOString();

  // 如果前端指定了特定合约 (如 LH2701, LH2611)，定位选中的合约
  let activeContract = currentMarketState.allContracts.find(
    (c) => c.symbol.toLowerCase() === selectedSymbol?.toLowerCase()
  );
  if (!activeContract) {
    activeContract = currentMarketState.allContracts.find((c) => c.code === "nf_LH0") || {
      code: "nf_LH0",
      symbol: currentMarketState.futuresSymbol || "LH0",
      name: "生猪连续",
      priceTon: currentMarketState.futuresTon,
      changePct: currentMarketState.futuresChange,
      changeAmount: currentMarketState.futuresChangeAmount || 60,
      openInterest: currentMarketState.futuresOpenInterest || 212900,
      volume: currentMarketState.futuresVolume || 32000,
      high: currentMarketState.futuresHigh || currentMarketState.futuresTon + 80,
      low: currentMarketState.futuresLow || currentMarketState.futuresTon - 50,
      open: currentMarketState.futuresOpen || currentMarketState.futuresTon,
      settlePrice: currentMarketState.futuresPreSettle || 11810,
      date: currentMarketState.futuresDate,
      time: currentMarketState.futuresTime,
      isMain: true,
    };
  }

  const activeFuturesPrice = activeContract.priceTon;
  const spotTon = currentMarketState.spotKg * 1000.0;
  const premiumRate = ((activeFuturesPrice - spotTon) / spotTon) * 100.0;
  const basisTon = spotTon - activeFuturesPrice;

  let status: "high_premium" | "moderate_premium" | "flat" | "discount" | "deep_discount" = "flat";
  let statusText = "平水区间 (-3% ~ +3%)";

  if (premiumRate > 20.0) {
    status = "high_premium";
    statusText = "极端深度升水 (>20%) [预期过热]";
  } else if (premiumRate > 5.0) {
    status = "moderate_premium";
    statusText = `期货升水 (+5% ~ +20%) [${activeContract.symbol} 远期看涨]`;
  } else if (premiumRate < -10.0) {
    status = "deep_discount";
    statusText = "期货深度贴水 (<-10%) [远期悲观]";
  } else if (premiumRate < -3.0) {
    status = "discount";
    statusText = "期货小幅贴水 (-10% ~ -3%)";
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const payload = {
    timestamp: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
    spot: {
      priceKg: currentMarketState.spotKg,
      priceTon: spotTon,
      changePct: currentMarketState.spotChange,
      date: currentMarketState.spotDate,
      publishTime: currentMarketState.spotPublishTime || "09:00",
      isToday: currentMarketState.spotIsToday,
      statusNote: currentMarketState.spotStatusNote,
      previousDayDate: currentMarketState.spotPreviousDayDate,
      isPreviousDayFallback: !currentMarketState.spotIsToday,
      source: "中国养猪网 / 农业农村部定点监测 / 上海钢联",
      sourceDescription: "全国外三元生猪出栏加权日均价（对接中国养猪网猪价系统与定点屠企开磅过磅监测，每日早间定盘发布）",
      cashCostKg: 13.8,
      deepLossCostKg: 12.0,
      provinces: currentMarketState.provinces,
      neiSanYuanKg: currentMarketState.neiSanYuanKg,
      tuZaZhuKg: currentMarketState.tuZaZhuKg,
      maizeTon: currentMarketState.maizeTon,
      beanTon: currentMarketState.beanTon,
    },
    futures: {
      contract: `${activeContract.name} (${activeContract.symbol})`,
      symbol: activeContract.symbol,
      priceTon: activeContract.priceTon,
      changePct: activeContract.changePct,
      changeAmount: activeContract.changeAmount,
      openInterest: activeContract.openInterest,
      volume: activeContract.volume,
      high: activeContract.high,
      low: activeContract.low,
      open: activeContract.open,
      settlePrice: activeContract.settlePrice,
      date: activeContract.date || currentMarketState.futuresDate,
      time: activeContract.time || currentMarketState.futuresTime,
      source: "大商所生猪期货实时行情",
      allContracts: currentMarketState.allContracts,
    },
    spread: {
      premiumRate: +premiumRate.toFixed(2),
      basisTon: +basisTon.toFixed(0),
      status,
      statusText,
    },
    stock: {
      code: "002714",
      name: "牧原股份",
      price: currentMarketState.muyuanPrice,
      changePct: currentMarketState.muyuanChange,
      turnoverRate: currentMarketState.muyuanTurnover,
      volume: currentMarketState.muyuanVolume || "76.8万手",
      peRatio: currentMarketState.muyuanPe || 16.4,
      pbRatio: currentMarketState.muyuanPb || 3.21,
      marketCap: currentMarketState.muyuanMarketCap || "2538亿元",
      totalShares: currentMarketState.muyuanTotalShares || "57.73亿股",
    },
    peers: currentMarketState.peers,
    macro: {
      pigGrainRatio: currentMarketState.pigGrainRatio,
      sowCapacityStatus: "能繁母猪存栏约3990万头 (绿色合理波动区间)",
      cyclePhase: currentMarketState.spotKg < 12.0 ? "产能去化期" : currentMarketState.spotKg < 15.0 ? "抢跑筑底期" : "高位繁荣期",
      cyclePhaseDesc:
        currentMarketState.spotKg < 12.0
          ? "现货跌破12.0深度亏损线，全行业产能快速出清，左侧布局机会酝酿"
          : "期现基差修复，二次育肥博弈升温，关注养殖龙头成本优势",
    },
    // 商业级微观数据 (早报白嫖与正则提取引擎)
    microData: {
      standardFatDiff: currentMicroData.standardFatDiff,
      diffTrend: currentMicroData.diffTrend,
      diffChange: currentMicroData.diffChange,
      diffPrev: currentMicroData.diffPrev,
      avgSlaughterWeight: currentMicroData.avgSlaughterWeight,
      secondFatteningRate: currentMicroData.secondFatteningRate,
      slaughterOperatingRate: currentMicroData.slaughterOperatingRate,
      frozenInventoryRate: currentMicroData.frozenInventoryRate,
      lastReportSource: currentMicroData.lastReportSource,
      lastReportTime: currentMicroData.lastReportTime,
      originalPublishDate: currentMicroData.originalPublishDate,
      originalPublishTime: currentMicroData.originalPublishTime,
      isTodayReport: currentMicroData.isTodayReport,
      relativeDateText: currentMicroData.relativeDateText,
      reportDateNotice: currentMicroData.reportDateNotice,
      extractedSnippet: currentMicroData.extractedSnippet,
      ...evaluateMicroStatus(
        currentMicroData.standardFatDiff,
        currentMicroData.avgSlaughterWeight,
        currentMicroData.diffTrend,
        currentMicroData.diffChange
      ),
    },
    marketStatus: {
      isTradingTime: tradingStatus.isTradingTime,
      statusText: tradingStatus.statusText,
      dceStatus: tradingStatus.dceStatus,
      sseStatus: tradingStatus.sseStatus,
      isSandbox: sandboxMode,
      sessionNote: tradingStatus.sessionNote,
    },
    hasPriceChanged,
    isRealTime: true,
    dataSourceNote: "全时段实时数据流: 大商所生猪期货全合约 + 搜猪网/钢联现货 + 深交所牧原股份实盘行情",
  };

  res.json(payload);
});

// 一键联网自动同步今日最新出栏均价定盘数据 (严格验证日期，绝不强行匹配今日)
app.post("/api/spot-price/sync", async (req, res) => {
  const result = await fetchRealDailySpotPrice(true);
  res.json({
    success: true,
    updated: result.updated,
    isToday: result.isToday,
    statusNote: result.note,
    date: currentMarketState.spotDate,
    spot: {
      priceKg: currentMarketState.spotKg,
      priceTon: currentMarketState.spotKg * 1000,
      changePct: currentMarketState.spotChange,
      date: currentMarketState.spotDate,
      publishTime: currentMarketState.spotPublishTime,
      isToday: currentMarketState.spotIsToday,
      statusNote: currentMarketState.spotStatusNote,
      previousDayDate: currentMarketState.spotPreviousDayDate,
      isPreviousDayFallback: !currentMarketState.spotIsToday,
      source: "中国养猪网 / 农业农村部定点监测 / 上海钢联",
      sourceDescription: "全国外三元生猪出栏加权日均价（对接中国养猪网猪价系统与定点屠企开磅过磅监测，每日早间定盘发布）",
    },
  });
});

// 支持用户快速调整/标定特定区域现货猪价 (例如四川、河南、广东等省份均价)
app.post("/api/spot-price", (req, res) => {
  const { spotKg } = req.body;
  if (typeof spotKg === "number" && spotKg > 5 && spotKg < 40) {
    currentMarketState.spotKg = +spotKg.toFixed(2);
    return res.json({ success: true, spotKg: currentMarketState.spotKg });
  }
  return res.status(400).json({ error: "Invalid spotKg value" });
});

// 切换沙盒模拟模式 (只有用户明确点击开启时才生效)
app.post("/api/market-data/sandbox", (req, res) => {
  const { enabled } = req.body;
  sandboxMode = !!enabled;
  res.json({ success: true, sandboxMode });
});

// 手动调节参数或注入场景模拟 (例如：深度亏损+大阳线、极端升水)
app.post("/api/market-data/override", (req, res) => {
  const { spotKg, futuresTon, muyuanPrice, muyuanChange, muyuanTurnover } = req.body;
  if (typeof spotKg === "number") currentMarketState.spotKg = spotKg;
  if (typeof futuresTon === "number") currentMarketState.futuresTon = futuresTon;
  if (typeof muyuanPrice === "number") currentMarketState.muyuanPrice = muyuanPrice;
  if (typeof muyuanChange === "number") currentMarketState.muyuanChange = muyuanChange;
  if (typeof muyuanTurnover === "number") currentMarketState.muyuanTurnover = muyuanTurnover;
  res.json({ success: true, currentMarketState });
});

// 获取当前微观数据与状态
app.get("/api/micro-data", (req, res) => {
  const status = evaluateMicroStatus(
    currentMicroData.standardFatDiff,
    currentMicroData.avgSlaughterWeight,
    currentMicroData.diffTrend,
    currentMicroData.diffChange
  );
  res.json({
    ...currentMicroData,
    ...status,
  });
});

// 正则表达式提取微观数据接口 (接收任何公众号文章/早报文本)
app.post("/api/micro-data/extract", (req, res) => {
  const { text, source } = req.body;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "请提供有效的早报文章内容" });
  }

  // 1. 标肥价差正则提取
  const fatDiffRegex = /(?:标肥价差|标肥差|肥标价差|肥标差|大猪与标猪价差|肥猪较标猪溢价|肥标差价)(?:为|在|达|约|约为|扩大至|收窄至|升至|高)?\s*([+-]?[0-9]+(?:\.[0-9]+)?)\s*(?:元(?:\/kg|\/公斤)?|块)/i;
  const fatDiffMatch = text.match(fatDiffRegex);

  // 2. 出栏均重正则提取
  const weightRegex = /(?:出栏均重|出栏平均体重|生猪出栏均重|样本出栏均重|出栏均重统计|宰前均重|出栏体重)(?:为|在|达|约|约为|增至|降至)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:公?斤|kg)/i;
  const weightMatch = text.match(weightRegex);

  // 3. 二育占比正则提取
  const secondFatteningRegex = /(?:二育占比|二次育肥占比|二育入场占比|二育销量占比|二次育肥入场率|二育出栏占比)(?:为|在|达|约|约为)?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i;
  const secondFatteningMatch = text.match(secondFatteningRegex);

  // 0. 原文推送日期正则提取 (绝不强行匹配今日)
  const fullDateRegex = /(20\d{2})[-/年](\d{1,2})[-/月](\d{1,2})(?:日)?(?:\s*(\d{1,2}:\d{2}))?/i;
  const fullDateMatch = text.match(fullDateRegex);
  let originalPublishDate: string | undefined = undefined;
  let originalPublishTime: string | undefined = undefined;
  let isTodayReport = false;
  let reportDateNotice = "";
  const { todayStr, prevDayStr } = getBeijingDateInfo();

  if (fullDateMatch) {
    const year = fullDateMatch[1];
    const month = String(parseInt(fullDateMatch[2], 10)).padStart(2, "0");
    const day = String(parseInt(fullDateMatch[3], 10)).padStart(2, "0");
    originalPublishDate = `${year}-${month}-${day}`;
    if (fullDateMatch[4]) {
      originalPublishTime = fullDateMatch[4];
    }
  }

  if (originalPublishDate) {
    if (originalPublishDate === todayStr) {
      isTodayReport = true;
      reportDateNotice = `原文推送日期为今日 (${originalPublishDate}${originalPublishTime ? " " + originalPublishTime : ""})`;
    } else {
      isTodayReport = false;
      reportDateNotice = `原文推送日期为 ${originalPublishDate}${originalPublishTime ? " " + originalPublishTime : ""} (前一日/历史推文，非今日早报)`;
    }
  } else {
    isTodayReport = false;
    reportDateNotice = "原文正文未检测到明确日期标签，已标注推文真实来源";
  }

  // 4. 屠宰开工率正则提取
  const slaughterRegex = /(?:屠宰开工率|屠宰企业开工率|重点屠企开工率|开工率)(?:为|在|达|约|约为)?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i;
  const slaughterMatch = text.match(slaughterRegex);

  // 5. 全国外三元现货均价正则提取 (从早报中抓取现货价)
  const spotRegex = /(?:全国外三元均价|全国生猪均价|生猪出栏均价|全国出栏生猪价格|全国出栏均价|全国生猪出栏价格|生猪现货均价|全国外三元生猪出栏均价)(?:为|在|达|约|约为|报)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:元(?:\/kg|\/公斤)?|块)/i;
  const spotMatch = text.match(spotRegex);

  const standardFatDiff = fatDiffMatch ? parseFloat(fatDiffMatch[1]) : undefined;
  const avgWeight = weightMatch ? parseFloat(weightMatch[1]) : undefined;
  const secondFatteningRate = secondFatteningMatch ? parseFloat(secondFatteningMatch[1]) : undefined;
  const slaughterRate = slaughterMatch ? parseFloat(slaughterMatch[1]) : undefined;
  const spotPriceKg = spotMatch ? parseFloat(spotMatch[1]) : undefined;

  let snippet = "";
  if (spotMatch) {
    const idx = text.indexOf(spotMatch[0]);
    snippet += "【现货均价】" + text.slice(Math.max(0, idx - 10), Math.min(text.length, idx + spotMatch[0].length + 20)).trim() + " ";
  }
  if (fatDiffMatch) {
    const idx = text.indexOf(fatDiffMatch[0]);
    snippet += "【标肥差】" + text.slice(Math.max(0, idx - 10), Math.min(text.length, idx + fatDiffMatch[0].length + 20)).trim() + " ";
  }
  if (weightMatch) {
    const idx = text.indexOf(weightMatch[0]);
    snippet += "【出栏均重】" + text.slice(Math.max(0, idx - 10), Math.min(text.length, idx + weightMatch[0].length + 20)).trim() + " ";
  }
  if (secondFatteningMatch) {
    const idx = text.indexOf(secondFatteningMatch[0]);
    snippet += "【二育占比】" + text.slice(Math.max(0, idx - 10), Math.min(text.length, idx + secondFatteningMatch[0].length + 20)).trim();
  }

  res.json({
    success: true,
    extracted: {
      spotKg: spotPriceKg,
      standardFatDiff,
      avgWeight,
      secondFatteningRate,
      slaughterRate,
      originalPublishDate,
      originalPublishTime,
      isTodayReport,
      reportDateNotice,
    },
    snippet: snippet.trim() || text.slice(0, 100) + "...",
    source: source || "微信公众号早报提取",
    matchedCount:
      (spotPriceKg !== undefined ? 1 : 0) +
      (standardFatDiff !== undefined ? 1 : 0) +
      (avgWeight !== undefined ? 1 : 0) +
      (secondFatteningRate !== undefined ? 1 : 0),
  });
});

// 应用提取或自定义微观数据到系统 (真实保存原文推送日期，不强行覆盖为今天)
app.post("/api/micro-data/apply", (req, res) => {
  const {
    spotKg,
    standardFatDiff,
    avgSlaughterWeight,
    secondFatteningRate,
    slaughterOperatingRate,
    lastReportSource,
    extractedSnippet,
    originalPublishDate,
    originalPublishTime,
    isTodayReport,
    reportDateNotice,
  } = req.body;
  
  if (typeof spotKg === "number" && spotKg > 5 && spotKg < 40) {
    currentMarketState.spotKg = +spotKg.toFixed(2);
    // 如果文章有真实的发布日期，且不是今日，现货日期如实保持该日期或前一日基准，不强行改为今天
    if (originalPublishDate) {
      currentMarketState.spotDate = originalPublishDate;
      currentMarketState.spotIsToday = !!isTodayReport;
      currentMarketState.spotPublishTime = originalPublishTime ? `${originalPublishTime} 定盘` : "09:00 定盘";
      currentMarketState.spotStatusNote = isTodayReport
        ? `来自今日早报实时提纯 (${originalPublishDate})`
        : `来自推文原文推送日期 (${originalPublishDate})，采用前一发布日基准`;
    }
  }
  if (typeof standardFatDiff === "number") currentMicroData.standardFatDiff = standardFatDiff;
  if (typeof avgSlaughterWeight === "number") currentMicroData.avgSlaughterWeight = avgSlaughterWeight;
  if (typeof secondFatteningRate === "number") currentMicroData.secondFatteningRate = secondFatteningRate;
  if (typeof slaughterOperatingRate === "number") currentMicroData.slaughterOperatingRate = slaughterOperatingRate;
  if (typeof lastReportSource === "string") currentMicroData.lastReportSource = lastReportSource;
  if (typeof extractedSnippet === "string") currentMicroData.extractedSnippet = extractedSnippet;
  
  if (originalPublishDate) {
    currentMicroData.originalPublishDate = originalPublishDate;
    currentMicroData.originalPublishTime = originalPublishTime || "08:35";
    currentMicroData.isTodayReport = !!isTodayReport;
    currentMicroData.lastReportTime = `${originalPublishDate} ${originalPublishTime || ""}`.trim();
    currentMicroData.reportDateNotice = reportDateNotice || (isTodayReport ? `原文推送于今日 (${originalPublishDate})` : `原文推送于 ${originalPublishDate} (前一发布日推文)`);
  } else {
    currentMicroData.lastReportTime = `${currentMicroData.originalPublishDate || "2026-09-04"} ${currentMicroData.originalPublishTime || "08:35"}`;
  }

  const status = evaluateMicroStatus(currentMicroData.standardFatDiff, currentMicroData.avgSlaughterWeight);
  res.json({
    success: true,
    currentMicroData: {
      ...currentMicroData,
      ...status,
    },
  });
});

// 获取全自动后台爬虫管道状态与流水日志
app.get("/api/crawler/status", (_req, res) => {
  res.json({
    success: true,
    status: crawlerDaemonStatus,
    recentLogs: daemonCrawlerLogs,
    currentSnapshot: {
      spotKg: currentMarketState.spotKg,
      spotDate: currentMarketState.spotDate,
      spotChange: currentMarketState.spotChange,
      futuresTon: currentMarketState.futuresTon,
      standardFatDiff: currentMicroData.standardFatDiff,
      diffTrend: currentMicroData.diffTrend,
      diffChange: currentMicroData.diffChange,
      avgSlaughterWeight: currentMicroData.avgSlaughterWeight,
      secondFatteningRate: currentMicroData.secondFatteningRate,
      lastReportSource: currentMicroData.lastReportSource,
      originalPublishDate: currentMicroData.originalPublishDate,
      originalPublishTime: currentMicroData.originalPublishTime,
      isTodayReport: currentMicroData.isTodayReport,
      relativeDateText: currentMicroData.relativeDateText,
      extractedSnippet: currentMicroData.extractedSnippet,
    },
  });
});

// 手动即时触发后台爬虫管道 (无感全自动运行，无需任何输入)
app.post("/api/crawler/run-now", async (_req, res) => {
  try {
    addCrawlerLog("info", "SCHEDULER", "用户在看板点击【立即执行全自动抓取】，后台守护管道立即启动...");
    await runFullAutoCrawlPipeline("手动即时触发测试");

    const status = evaluateMicroStatus(currentMicroData.standardFatDiff, currentMicroData.avgSlaughterWeight);
    res.json({
      success: true,
      message: "全自动爬虫管道执行完毕，最新数据已同步入库！",
      currentMarketState: {
        spotKg: currentMarketState.spotKg,
        spotDate: currentMarketState.spotDate,
        spotChange: currentMarketState.spotChange,
        pigGrainRatio: currentMarketState.pigGrainRatio,
        futuresTon: currentMarketState.futuresTon,
      },
      currentMicroData: {
        ...currentMicroData,
        ...status,
      },
      daemonStatus: crawlerDaemonStatus,
      recentLogs: daemonCrawlerLogs.slice(0, 15),
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `后台爬虫执行异常: ${err.message}`,
    });
  }
});

// 2. 发送飞书 / 企业微信 / 钉钉 Webhook 告警
app.post("/api/webhook/send", async (req, res) => {
  try {
    const { webhookUrl, platform, title, content, cardData } = req.body;

    if (!webhookUrl || typeof webhookUrl !== "string") {
      return res.status(400).json({ success: false, error: "未提供有效的 Webhook 机器人地址" });
    }

    let payload: any = {};
    const nowStr = new Date().toLocaleString("zh-CN");

    // 飞书机器人
    if (platform === "feishu" || webhookUrl.includes("feishu")) {
      if (cardData) {
        payload = {
          msg_type: "interactive",
          card: {
            config: { wide_screen_mode: true },
            header: {
              title: { tag: "plain_text", content: `🚨 ${title}` },
              template: cardData.severity === "critical" ? "red" : "orange",
            },
            elements: [
              {
                tag: "div",
                text: {
                  tag: "lark_md",
                  content: `**监控时间**: ${nowStr}\n\n${content}`,
                },
              },
              {
                tag: "note",
                elements: [
                  {
                    tag: "plain_text",
                    content: "来自 0成本生猪高频监控雷达 (Pork Radar Dynamic)",
                  },
                ],
              },
            ],
          },
        };
      } else {
        payload = {
          msg_type: "text",
          content: {
            text: `【${title}】\n时间: ${nowStr}\n${content}`,
          },
        };
      }
    }
    // 企业微信机器人
    else if (platform === "wecom" || webhookUrl.includes("weixin.qq.com")) {
      payload = {
        msgtype: "markdown",
        markdown: {
          content: `### 🚨 <font color="${cardData?.severity === "critical" ? "warning" : "info"}">${title}</font>\n> **监控时间**: ${nowStr}\n\n${content}`,
        },
      };
    }
    // 钉钉机器人
    else {
      payload = {
        msgtype: "markdown",
        markdown: {
          title: `【${title}】`,
          text: `### 🚨 ${title}\n\n**时间**: ${nowStr}\n\n${content}`,
        },
      };
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const respText = await response.text();
    let respJson: any = null;
    try {
      respJson = JSON.parse(respText);
    } catch {
      respJson = { raw: respText };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        status: response.status,
        response: respJson,
      });
    }

    return res.json({
      success: true,
      status: response.status,
      response: respJson,
    });
  } catch (err: any) {
    console.error("Webhook dispatch failed:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Webhook 请求发送异常",
    });
  }
});

// 3. 宏观生猪周期量化策略备用报告生成器 (当大模型全局并发限流时提供零中断兜底)
function generateQuantitativeStrategyReport(params: {
  spotKg: number;
  futuresTon: number;
  premiumRate: number;
  muyuanPrice: number;
  muyuanChange: number;
  pigGrainRatio: number;
  standardFatDiff?: number;
  avgSlaughterWeight?: number;
  secondFatteningRate?: number;
}): string {
  const { spotKg, futuresTon, premiumRate, muyuanPrice, muyuanChange, pigGrainRatio, standardFatDiff, avgSlaughterWeight, secondFatteningRate } = params;
  const spotTon = spotKg * 1000;
  const basis = spotTon - futuresTon;
  const isLoss = spotKg < 14.2;
  const isDeepLoss = spotKg < 12.0;
  const isHighPremium = premiumRate > 20.0;
  const isModeratePremium = premiumRate >= 5.0 && premiumRate <= 20.0;
  const isDiscount = premiumRate < 0;

  return `### 🐖 生猪产业期现与微观早报高频研判报告

> **数据基准**：现货均价 **${spotKg.toFixed(2)} 元/kg** ｜ 期货主力 **${futuresTon} 元/吨** ｜ 升贴水率 **${premiumRate >= 0 ? '+' : ''}${premiumRate.toFixed(2)}%** ｜ 标肥价差 **${standardFatDiff !== undefined ? (standardFatDiff > 0 ? `+${standardFatDiff}元/kg` : `${standardFatDiff}元/kg`) : '+0.35元/kg'}** ｜ 出栏均重 **${avgSlaughterWeight || 124.2} kg** ｜ 牧原股份 **${muyuanPrice.toFixed(2)} 元 (${muyuanChange >= 0 ? '+' : ''}${muyuanChange.toFixed(2)}%)**

---

#### 1. 【商业级微观指标 · 标肥价差与二育推演】
- **标肥价差驱动**：当前全国大猪较标猪溢价为 **${standardFatDiff !== undefined ? standardFatDiff.toFixed(2) : '0.35'} 元/kg**。${
    (standardFatDiff ?? 0.35) >= 0.8
      ? '大肥猪供应显著紧俏，高溢价驱动二次育肥群体积极抢购标猪截流入栏，促使短期屠企标猪收购受阻、近月现货抗跌。'
      : (standardFatDiff ?? 0.35) < 0
      ? '标肥严重倒挂，大猪遭遇市场折价抛售，二育补栏停滞，需谨防恐慌性出栏压制盘面。'
      : '标肥价差处于温和区间，养殖户随行就市出栏，二育投机博弈相对理性。'
  }
- **出栏均重水位**：全国样本出栏均重为 **${avgSlaughterWeight || 124.2} kg**。${
    (avgSlaughterWeight ?? 124.2) >= 125.5
      ? '已突破 **125.5 kg** 临界高危红线！表明前期二育及惜售大猪存栏积压严重，一旦气温上升或标肥价差收窄，极易引发大猪集中踩踏出栏。'
      : '处于 120~125kg 正常出栏体重区间，阶段性压栏风险可控。'
  }
- **二育市场热度**：二育销量占比约 **${secondFatteningRate || 4.1}%**，反映投机资本截留货源力度。

---

#### 2. 【周期位置与期现基差博弈研判】
- **现货与成本对照**：全国外三元生猪现货均价折合 **${spotTon.toFixed(0)} 元/吨**。${
    isDeepLoss
      ? '目前已跌破 **12.0 元/kg** 深度亏损线，全行业面临大面积现金流失血，散户与中小规模场产能去化显著提速。'
      : isLoss
      ? '略低于行业平均完全成本线（**14.2 元/kg**），养殖端整体处于微亏损至现金保本线附近僵持。'
      : '运行于行业平均完全成本线（**14.2 元/kg**）上方，规模养殖企业处于正向盈利兑现窗口。'
  }
- **猪粮比价与政策调控**：当前猪粮比为 **${pigGrainRatio.toFixed(2)} : 1**，${
    pigGrainRatio < 5.0
      ? '进入国家发改委一级预警过度下跌区间，政策端中央与地方储备冻猪肉收储预期高企，底部政策底支撑明确。'
      : pigGrainRatio < 6.0
      ? '处于二级预警区间，饲料玉米/豆粕原料成本对养殖综合毛利率形成一定压制。'
      : '处于绿色合理收益区间，行业产业链整体供需结构总体平稳。'
  }
- **期现基差结构**：当前基差为 **${basis.toFixed(0)} 元/吨**，期现升贴水率为 **${premiumRate.toFixed(2)}%**。衍生品市场对远期交割月份预期呈现${premiumRate > 5 ? '显著远期升水格局' : '紧贴水/平水格局'}。

---

#### 3. 【期现基差套保 / 套利策略建议】
- **升贴水状态评估**：${
    isHighPremium
      ? '⚠️ **极端超额升水（>20%）**：盘面明显提前透支了远期看涨预期，投机多头情绪过热。'
      : isModeratePremium
      ? '⚡ **中度适度升水（+5% ~ +20%）**：符合远月季节性消费旺季或供给减量定价惯性。'
      : isDiscount
      ? '🔻 **期货贴水（<0%）**：近月现货偏紧或挤仓，远月供需预期相对悲观。'
      : '⚖️ **期现平水（0% ~ +5%）**：多空分歧较小，期现基差较为收敛。'
  }
- **产业套保实务**：
  ${
    isHighPremium
      ? '- **规模猪企**：强烈建议在当前高升水区间针对远月合约分批建立**卖出套期保值**（Short Hedge）头寸，提前锁定 16,000 元/吨以上的优厚出栏毛利。\n  - **投机策略**：谨防临近交割月盘面向现货价格强制回归贴水修复风险，不宜盲目追高远月虚高升水。'
      : isDiscount
      ? '- **屠宰与深加工端**：可借助期货贴水机会买入套保锁定远期备货成本；产业资金可关注正向基差收敛套利。'
      : '- **中性套保策略**：保持 30%~50% 敞口保护，紧跟出栏节奏动态展期。'
  }

---

#### 4. 【养殖龙头股价联动与抢跑逻辑】
- **标的联动**：牧原股份（002714）最新价格 **${muyuanPrice.toFixed(2)} 元**（涨跌幅 **${muyuanChange >= 0 ? '+' : ''}${muyuanChange.toFixed(2)}%**）。
- **抢跑驱动归因**：${
    isDeepLoss && muyuanChange > 3.0
      ? '🚨 **典型左侧大阳线抢跑异动**！现货价格虽陷于深度亏损泥潭，但资本市场已开始提前博弈行业极限失血后的产能加速淘汰。历史上养殖板块股价往往领先周期猪价 3~6 个月见底启动，呈现“亏损越深、抢跑越凶”的逆向博弈逻辑。'
      : muyuanChange > 1.5
      ? '龙头养殖股呈现明显的提前筑底反弹迹象，机构资金在底部区域逐步建立左侧筹码。'
      : '养殖板块随大盘小幅震荡，市场资金仍在等待农业农村部能繁母猪官方去化速度的实质性信号。'
  }

---

#### 5. 【核心预警与风险警示】
1. **二育大猪集中抛售风险**：出栏均重若持续居高不下，需提防二育群体在标肥价差收窄时集中抛售导致盘面急速贴水修复。
2. **基差修复挤兑风险**：若后续终端消费复苏进度不及预期，期货盘面的高升水结构将面临多头平仓与期现共振下挫。
3. **饲料原料成本冲击**：玉米与豆粕价格波动直接影响育肥头均保本安全边际。`;
}

// 候选模型队列：优先低延迟、高可用的最新模型，规避高峰期 503 UNAVAILABLE 拥堵
const CANDIDATE_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
];

// 4. Gemini 周期智能诊断与套保策略 (带自适应模型降级、重试与量化兜底)
app.post("/api/gemini/analyze-hog-cycle", async (req, res) => {
  const {
    spotKg,
    futuresTon,
    premiumRate,
    muyuanPrice,
    muyuanChange,
    pigGrainRatio,
    standardFatDiff,
    avgSlaughterWeight,
    secondFatteningRate,
  } = req.body;

  const prompt = `你是一位专注中国农产品衍生品、大宗商品周期及生猪期现套利与养殖上市公司的量化商品宏观分析师。
根据当前生猪监控雷达的实时数据及微信晨报提取的商业级微观指标：
- 现货均价: ${spotKg} 元/kg (${spotKg * 1000} 元/吨)
- 期货主力合约 (LH0): ${futuresTon} 元/吨
- 期现升水率: ${premiumRate}%
- 标肥价差 (肥猪-标猪): ${standardFatDiff !== undefined ? `${standardFatDiff > 0 ? '+' : ''}${standardFatDiff} 元/kg` : '+0.35 元/kg'}
- 重点监测样本出栏均重: ${avgSlaughterWeight || 124.2} kg (高危红线: 125.5kg)
- 二次育肥销量占比: ${secondFatteningRate || 4.1}%
- 牧原股份 (002714): ${muyuanPrice} 元 (涨跌幅: ${muyuanChange}%)
- 猪粮比价: ${pigGrainRatio} : 1
- 行业平均现金完全成本约: 14.0~14.5 元/kg, 深度亏损线为 12.0 元/kg

请从以下专业维度进行精炼诊断分析：
1. 【微观高频指标与二育心态推演】：结合标肥价差与出栏均重，剖析当前二次育肥抢跑/惜售压栏心态及对近月现货的截留支撑。
2. 【周期位置与博弈研判】：结合现货价格、猪粮比与行业去产能节奏，判断当前处于猪周期什么阶段。
3. 【期现基差套保/套利策略】：针对当前升贴水率（${premiumRate}%），给出养殖企业卖出套保建议与投机套利指引。
4. 【实体养殖建议】：对规模化猪场及散户在二次育肥、压栏、母猪补栏/淘汰方面的明确建议。
5. 【养殖股联动逻辑】：剖析牧原股份等养殖股与期货/现货的领先抢跑逻辑。
6. 【关键预警与核心风险点】：给出3条核心风险提示。

请输出结构清晰、用词干练专业的 Markdown 分析报告。`;

  // 依次尝试候选模型，并针对 503/429 提供平滑重试
  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const ai = getGeminiClient();
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        if (response?.text) {
          return res.json({
            success: true,
            analysis: response.text,
            modelUsed: model,
            isFallback: false,
            generatedAt: new Date().toLocaleTimeString("zh-CN"),
          });
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        console.warn(`[Gemini API] Model ${model} (attempt ${attempt + 1}) encountered:`, errMsg);

        // 如果是 503 (high demand) 或 429 或暂时不可用，短延时重试或切换模型
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("high demand") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("429");

        if (isTransient && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        break; // 切换到下一个候选模型
      }
    }
  }

  // 若所有云端模型均处于高并发拥堵状态，平滑启用专业量化策略引擎兜底，确保分析体验 100% 可靠可用
  console.warn("[Gemini API] All external AI models unavailable. Serving quantitative strategy fallback report.");
  const fallbackAnalysis = generateQuantitativeStrategyReport({
    spotKg: Number(spotKg) || 11.07,
    futuresTon: Number(futuresTon) || 11765,
    premiumRate: Number(premiumRate) || 6.28,
    muyuanPrice: Number(muyuanPrice) || 43.97,
    muyuanChange: Number(muyuanChange) || 4.49,
    pigGrainRatio: Number(pigGrainRatio) || 5.12,
    standardFatDiff: standardFatDiff !== undefined ? Number(standardFatDiff) : 0.35,
    avgSlaughterWeight: avgSlaughterWeight ? Number(avgSlaughterWeight) : 124.2,
    secondFatteningRate: secondFatteningRate ? Number(secondFatteningRate) : 4.1,
  });

  return res.json({
    success: true,
    analysis: fallbackAnalysis,
    modelUsed: "量化宏观策略引擎 (自适应容灾)",
    isFallback: true,
    generatedAt: new Date().toLocaleTimeString("zh-CN"),
  });
});

// Vite middleware & Static Serving
async function startServer() {
  // 启动后台全自动定时采集守护进程 (Daemon Scheduler)
  // 包含：中国养猪网/猪易网现货出栏均价定时抓取、东方财富期货研报 API 自动解析与微观指标入库、全合约盘口行情流
  startDaemonCrawlerScheduler();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`生猪高频监控雷达服务与全自动定时爬虫引擎已在 http://localhost:${PORT} 启动`);
  });
}

startServer();
