import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HogMarketData,
  TickHistoryItem,
  AlertRule,
  TriggeredAlert,
  WebhookSettings,
} from './types';
import { Header } from './components/Header';
import { KeyMetricsGrid } from './components/KeyMetricsGrid';
import { BasisGauge } from './components/BasisGauge';
import { RadarChartSection } from './components/RadarChartSection';
import { ScenarioSimulationBar } from './components/ScenarioSimulationBar';
import { AlertPanel } from './components/AlertPanel';
import { SectorPeersCard } from './components/SectorPeersCard';
import { WebhookConfigModal } from './components/WebhookConfigModal';
import { RulesConfigModal } from './components/RulesConfigModal';
import { GeminiDiagnosisModal } from './components/GeminiDiagnosisModal';
import { MicroDataPanel } from './components/MicroDataPanel';
import { ReportParserModal } from './components/ReportParserModal';
import { OpenSourceModal } from './components/OpenSourceModal';
import { PolicyNewsTicker } from './components/PolicyNewsTicker';
import { PolicyNewsModal } from './components/PolicyNewsModal';
import { FrozenInventoryModal } from './components/FrozenInventoryModal';
import { PixelLifeBackground } from './components/PixelLifeBackground';
import { DEFAULT_RULES, evaluateRules, formatReportText } from './utils/ruleEngine';
import { soundAlarm } from './utils/audioAlarm';

// 留档归档版本与 Marathon 战术新版组件
import { ClassicApp } from './archive/ClassicApp';
import { MarathonHeader } from './components/marathon/MarathonHeader';
import { MarathonPolicyTicker } from './components/marathon/MarathonPolicyTicker';
import { MarathonScenarioBar } from './components/marathon/MarathonScenarioBar';
import { MarathonKeyMetrics } from './components/marathon/MarathonKeyMetrics';
import { MarathonMicroPanel } from './components/marathon/MarathonMicroPanel';
import { MarathonBasisGauge } from './components/marathon/MarathonBasisGauge';
import { MarathonChartAndAlerts } from './components/marathon/MarathonChartAndAlerts';

// 初始高仿真基准数据
const INITIAL_MARKET_DATA: HogMarketData = {
  timestamp: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
  spot: {
    priceKg: 11.07,
    priceTon: 11070,
    changePct: 0.27,
    date: new Date().toISOString().slice(0, 10),
    publishTime: '09:00',
    source: '中国养猪网 / 农业农村部 / 上海钢联',
    cashCostKg: 13.8,
    deepLossCostKg: 12.0,
  },
  futures: {
    contract: '生猪主力 (LH2611)',
    symbol: 'LH0',
    priceTon: 11765,
    changePct: -0.38,
    changeAmount: -45,
    openInterest: 220067,
    volume: 159665,
    high: 11950,
    low: 11745,
    open: 11850,
    settlePrice: 11810,
    source: '大商所生猪期货实时行情',
  },
  spread: {
    premiumRate: 6.28,
    basisTon: -695,
    status: 'moderate_premium',
    statusText: '期货升水 (+5% ~ +20%) [远期看涨]',
  },
  microData: {
    standardFatDiff: 0.35,
    standardFatStatus: 'moderate_premium',
    standardFatStatusText: '大猪温和溢价 (+0.35元) · 二育适度补栏',
    avgSlaughterWeight: 124.2,
    weightStatus: 'normal',
    weightStatusText: '出栏均重正常区间 (124.2kg)',
    secondFatteningRate: 4.1,
    secondFatteningSentiment: '二育入场意愿温和理性',
    slaughterOperatingRate: 26.5,
    frozenInventoryRate: 24.2,
    lastReportSource: '我的钢铁网农产品·今日早评 (08:35)',
    lastReportTime: '今日 08:35',
    extractedSnippet: '今日全国外三元生猪市场出栏均价为 11.07元/kg。标肥价差为 0.35 元/kg，上海钢联重点样本全国出栏均重为 124.2公斤，二次育肥占比约为 4.1%...',
  },
  stock: {
    code: '002714',
    name: '牧原股份',
    price: 43.97,
    changePct: 4.49,
    turnoverRate: 2.34,
    volume: '76.8万手',
    peRatio: 16.4,
    pbRatio: 3.21,
    marketCap: '2538亿元',
    totalShares: '57.73亿股',
  },
  peers: [
    { code: '300498', name: '温氏股份', price: 14.38, changePct: -0.62, turnoverRate: 0.8 },
    { code: '000876', name: '新希望', price: 7.05, changePct: 0.71, turnoverRate: 1.1 },
    { code: '603477', name: '巨星农牧', price: 15.14, changePct: -0.20, turnoverRate: 1.5 },
  ],
  macro: {
    pigGrainRatio: 5.12,
    sowCapacityStatus: '能繁母猪存栏约3990万头 (绿色合理波动区间)',
    cyclePhase: '抢跑筑底期',
    cyclePhaseDesc: '现货跌破成本线，期现温和升水，关注龙头规模养殖成本优势',
  },
  isRealTime: true,
  dataSourceNote: '大商所生猪期货LH0 + 搜猪网全国现货均价 + 证券交易所A股实时行情',
};

// 预热 12 条历史走势数据用于图表展示
const INITIAL_HISTORY: TickHistoryItem[] = Array.from({ length: 12 }).map((_, i) => {
  const d = new Date(Date.now() - (12 - i) * 5000);
  const timeStr = d.toLocaleTimeString('zh-CN', { hour12: false });
  const baseSpot = 11180 + (i - 6) * 10;
  const baseFutures = 11870 + (i - 6) * 20;
  const premium = ((baseFutures - baseSpot) / baseSpot) * 100;
  return {
    time: timeStr,
    spotKg: +(baseSpot / 1000).toFixed(2),
    spotTon: baseSpot,
    futuresTon: baseFutures,
    premiumRate: +premium.toFixed(2),
    basisTon: baseSpot - baseFutures,
    muyuanPrice: +(42.05 + i * 0.02).toFixed(2),
    muyuanChange: +(0.03 + i * 0.01).toFixed(2),
  };
});

export default function App() {
  const [data, setData] = useState<HogMarketData>(INITIAL_MARKET_DATA);
  const [history, setHistory] = useState<TickHistoryItem[]>(INITIAL_HISTORY);
  const [rules, setRules] = useState<AlertRule[]>(DEFAULT_RULES);
  const [activeAlerts, setActiveAlerts] = useState<TriggeredAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<TriggeredAlert[]>([]);

  // 控制参数
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5); // 默认 5 秒高频采样
  const [countdown, setCountdown] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [audioAlarmEnabled, setAudioAlarmEnabled] = useState(true);
  const [selectedContract, setSelectedContract] = useState<string>('LH0');

  // Webhook 配置
  const [webhookSettings, setWebhookSettings] = useState<WebhookSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pork_radar_webhook');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return {
      feishuUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/YOUR-UUID-HERE',
      wecomUrl: '',
      dingtalkUrl: '',
      enabledPlatforms: { feishu: true, wecom: false, dingtalk: false },
      audioAlarm: true,
      autoSendAlerts: false,
    };
  });

  // 弹窗状态
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isFrozenModalOpen, setIsFrozenModalOpen] = useState(false);
  const [isOpenSourceModalOpen, setIsOpenSourceModalOpen] = useState(false);
  const [isRefreshingPolicy, setIsRefreshingPolicy] = useState(false);

  // 界面模式：'marathon' (全新战术未来主义视觉) 或 'classic' (留档经典金融终端)
  const [viewMode, setViewMode] = useState<'marathon' | 'classic'>('marathon');

  // 像素生命游戏背景演化速率、扰动脉冲与亮度调控 (默认采用更幽暗深邃的 0.26 不透明度)
  const [lifeFps, setLifeFps] = useState<number>(32);
  const [lifeOpacity, setLifeOpacity] = useState<number>(0.26);
  const [seedTrigger, setSeedTrigger] = useState<number>(0);

  const handleSetViewMode = (mode: 'marathon' | 'classic') => {
    setViewMode(mode);
  };

  // 避免重复发声的记录
  const lastAlertSignature = useRef<string>('');

  // 核心数据拉取与测算引擎
  const fetchMarketData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/market-data?contract=${selectedContract}`);
      if (res.ok) {
        const freshData: HogMarketData = await res.json();
        setData(freshData);

        // 更新分时历史曲线 (保持最新 30 个数据点)
        const newTick: TickHistoryItem = {
          time: freshData.timestamp,
          spotKg: freshData.spot.priceKg,
          spotTon: freshData.spot.priceTon,
          futuresTon: freshData.futures.priceTon,
          premiumRate: freshData.spread.premiumRate,
          basisTon: freshData.spread.basisTon,
          muyuanPrice: freshData.stock.price,
          muyuanChange: freshData.stock.changePct,
        };

        setHistory((prev) => {
          const next = [...prev, newTick];
          return next.slice(-30);
        });

        // 运行预警检测规则
        const currentTriggered = evaluateRules(freshData, rules);
        setActiveAlerts(currentTriggered);

        if (currentTriggered.length > 0) {
          const sig = currentTriggered.map((a) => a.title).join('|');
          if (sig !== lastAlertSignature.current) {
            lastAlertSignature.current = sig;
            if (audioAlarmEnabled) {
              soundAlarm.playCriticalAlert();
            }

            // 归档到历史流水
            setAlertHistory((prev) => [...currentTriggered, ...prev].slice(0, 50));

            // 若开启自动推送机器人
            if (webhookSettings.autoSendAlerts && webhookSettings.feishuUrl) {
              dispatchToWebhook(currentTriggered[0]);
            }
          }
        } else {
          lastAlertSignature.current = '';
        }
      }
    } catch {
      // 网络静默容错
    } finally {
      setIsRefreshing(false);
    }
  }, [rules, audioAlarmEnabled, webhookSettings, selectedContract]);

  // 合约切换时立即刷新最新数据
  useEffect(() => {
    fetchMarketData();
  }, [selectedContract]);

  // 高频定时器
  useEffect(() => {
    if (!autoRefresh) return;

    setCountdown(refreshInterval);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchMarketData();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMarketData]);

  // 首次装载时拉取一次
  useEffect(() => {
    fetchMarketData();
  }, []);

  // 手动推送 Webhook
  const dispatchToWebhook = async (alert: TriggeredAlert) => {
    try {
      const reportText = formatReportText(data, [alert]);
      const targetUrl = webhookSettings.feishuUrl || webhookSettings.wecomUrl;

      if (!targetUrl || targetUrl.includes('YOUR-UUID')) {
        alert.dispatchedToFeishu = true;
        alert.dispatchedToWecom = true;
        setActiveAlerts([...activeAlerts]);
        return;
      }

      await fetch('/api/webhook/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: targetUrl,
          platform: targetUrl.includes('feishu') ? 'feishu' : 'wecom',
          title: alert.title,
          content: reportText,
          cardData: { severity: alert.severity },
        }),
      });

      alert.dispatchedToFeishu = true;
      setActiveAlerts([...activeAlerts]);
    } catch (err) {
      console.error('Webhook dispatch error:', err);
    }
  };

  // 场景注入处理
  const handleApplyScenario = async (params: {
    spotKg: number;
    futuresTon: number;
    muyuanPrice: number;
    muyuanChange: number;
    muyuanTurnover: number;
  }) => {
    try {
      await fetch('/api/market-data/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      await fetchMarketData();
    } catch (err) {
      console.error('Scenario override error:', err);
    }
  };

  // 切换沙盒模拟开关
  const handleToggleSandbox = async () => {
    const nextVal = !data.marketStatus?.isSandbox;
    try {
      await fetch('/api/market-data/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextVal }),
      });
      await fetchMarketData();
    } catch {}
  };

  // 重置基准行情
  const handleResetDefault = async () => {
    await handleApplyScenario({
      spotKg: 11.07,
      futuresTon: 11765,
      muyuanPrice: 43.97,
      muyuanChange: 4.49,
      muyuanTurnover: 2.34,
    });
  };

  // 用户快速校准现货价格 (元/kg)
  const handleUpdateSpotPrice = async (newSpotKg: number) => {
    try {
      const res = await fetch('/api/spot-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotKg: newSpotKg }),
      });
      if (res.ok) {
        await fetchMarketData();
      }
    } catch (err) {
      console.error('Update spot price failed:', err);
    }
  };

  // 一键联网自动同步今日最新生猪出栏现货定盘数据
  const handleSyncSpotPrice = async () => {
    try {
      const res = await fetch('/api/spot-price/sync', {
        method: 'POST',
      });
      if (res.ok) {
        await fetchMarketData();
      }
    } catch (err) {
      console.error('Sync spot price failed:', err);
    }
  };

  const handleSaveWebhookSettings = (newSettings: WebhookSettings) => {
    setWebhookSettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pork_radar_webhook', JSON.stringify(newSettings));
    }
  };

  // 应用从早报提取的微观数据 (真实携带原文推送日期，绝不强行匹配今日)
  const handleApplyMicroMetrics = async (metrics: {
    spotKg?: number;
    standardFatDiff?: number;
    avgSlaughterWeight?: number;
    secondFatteningRate?: number;
    slaughterOperatingRate?: number;
    frozenInventoryRate?: number;
    lastReportSource?: string;
    extractedSnippet?: string;
    originalPublishDate?: string;
    originalPublishTime?: string;
    isTodayReport?: boolean;
    reportDateNotice?: string;
  }) => {
    try {
      const res = await fetch('/api/micro-data/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
      });
      const json = await res.json();
      if (json.success) {
        await fetchMarketData();
      }
    } catch (err) {
      console.error('Apply micro metrics error:', err);
      throw err;
    }
  };

  // 用户/研究员手动微调或录入最新周度冻品库容率，即刻原子落盘持久化
  const handleUpdateFrozenRate = async (rate: number, date?: string, note?: string) => {
    try {
      const res = await fetch('/api/micro-data/update-frozen-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate, date, note }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchMarketData();
      } else {
        throw new Error(json.error || '更新失败');
      }
    } catch (err) {
      console.error('Update frozen rate error:', err);
      throw err;
    }
  };

  // 手动即时刷新华储网官方公告与政策快讯
  const handleRefreshPolicyNews = async () => {
    setIsRefreshingPolicy(true);
    try {
      const res = await fetch('/api/policy-news/refresh', { method: 'POST' });
      const json = await res.json();
      if (json.success && json.news) {
        setData((prev) => ({
          ...prev,
          latestPolicyNews: json.news,
        }));
      }
    } catch (err) {
      console.error('Refresh policy news failed:', err);
    } finally {
      setIsRefreshingPolicy(false);
    }
  };

  // 如果用户选择查看留档经典版本
  if (viewMode === 'classic') {
    return <ClassicApp onSwitchToMarathonUI={() => handleSetViewMode('marathon')} />;
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#F3F3EE] font-tech flex selection:bg-[#D4FF00] selection:text-black relative">
      {/* 极低功耗灰度 Pixel 风格生命游戏背景 (深色幽暗沉静，不抢占前台信息视认性) */}
      <PixelLifeBackground
        gridWidth={160}
        fps={lifeFps}
        density={0.14}
        opacity={lifeOpacity}
        seedTrigger={seedTrigger}
      />

      {/* Marathon 经典高阶黑绿蓝左侧结构边栏 (保持标志性深蓝底轨 + 荧光绿/白高对比遥测) */}
      <aside className="hidden lg:flex w-16 xl:w-20 bg-[#2000E0] border-r border-[#3B14FF] relative flex-col items-center justify-between py-5 shrink-0 select-none z-20 sticky top-0 h-screen overflow-hidden">
        {/* 顶部战术符号 */}
        <div className="flex flex-col items-center gap-2 shrink-0 z-20 bg-[#2000E0] pb-2">
          <div className="w-9 h-9 bg-black text-[#D4FF00] flex items-center justify-center font-black text-sm border border-[#D4FF00] shadow-[0_0_12px_rgba(0,0,0,0.5)]">
            猪
          </div>
          <span className="text-xs font-mono text-white/90 font-bold tracking-tight">[ 01 ]</span>
          <span className="w-2 h-2 bg-[#D4FF00] animate-pulse shadow-[0_0_8px_#D4FF00]" />
        </div>

        {/* 中间纵向无缝滚动战术标语轨道 (Vertical Marquee with English & Chinese) */}
        <div className="flex-1 w-full relative overflow-hidden my-3 flex items-center justify-center">
          {/* 上下边缘渐变遮罩 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#2000E0] via-[#2000E0]/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#2000E0] via-[#2000E0]/80 to-transparent z-10" />

          {/* 连续循环滚动容器 */}
          <div className="animate-marquee-vertical w-full flex flex-col items-center py-2 cursor-default">
            {/* 第一组 */}
            <div className="flex flex-col items-center gap-8 py-6">
              <div className="vertical-lr-text text-[#D4FF00] font-black text-lg xl:text-xl tracking-[0.25em] font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                生猪高频监控雷达
              </div>
              <div className="vertical-lr-text text-white font-mono font-black text-xs xl:text-sm tracking-[0.3em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                HOG QUANT RADAR
              </div>
              <div className="vertical-lr-text text-[#D4FF00] font-mono text-xs font-bold tracking-widest">
                // TELEMETRY LIVE
              </div>
              <div className="vertical-lr-text text-white font-black text-base xl:text-lg tracking-[0.22em] font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                期现基差升水率
              </div>
              <div className="vertical-lr-text text-white/95 font-mono font-black text-xs xl:text-sm tracking-[0.28em] uppercase">
                BASIS SPREAD MONITOR
              </div>
              <div className="vertical-lr-text text-[#D4FF00] font-mono text-xs font-bold tracking-widest">
                // DCE LH2505
              </div>
              <div className="vertical-lr-text text-[#D4FF00] font-black text-base xl:text-lg tracking-[0.22em] font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                微观供需高频遥测
              </div>
              <div className="vertical-lr-text text-white font-mono font-black text-xs xl:text-sm tracking-[0.28em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                MICRO SUPPLY & DEMAND
              </div>
              <div className="vertical-lr-text text-[#D4FF00] font-mono text-xs font-bold tracking-widest">
                // 002714 MUYUAN
              </div>
              <div className="vertical-lr-text text-white font-black text-base xl:text-lg tracking-[0.22em] font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                极端行情压力测试
              </div>
              <div className="vertical-lr-text text-white/95 font-mono font-black text-xs xl:text-sm tracking-[0.28em] uppercase">
                STRESS TEST PROTOCOL
              </div>
              <div className="text-[#D4FF00] font-mono text-xs py-2 font-black tracking-widest">
                [ + + + ]
              </div>
            </div>

            {/* 第二组（用于无缝连续循环） */}
            <div className="flex flex-col items-center gap-8 py-6" aria-hidden="true">
              <div className="vertical-lr-text text-[#D4FF00] font-black text-lg xl:text-xl tracking-[0.25em] font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                生猪高频监控雷达
              </div>
              <div className="vertical-lr-text text-white font-mono font-black text-xs xl:text-sm tracking-[0.3em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                HOG QUANT RADAR
              </div>
              <div className="vertical-lr-text text-[#D4FF00] font-mono text-xs font-bold tracking-widest">
                // TELEMETRY LIVE
              </div>
              <div className="vertical-lr-text text-white font-black text-base xl:text-lg tracking-[0.22em] font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                期现基差升水率
              </div>
              <div className="vertical-lr-text text-white/95 font-mono font-black text-xs xl:text-sm tracking-[0.28em] uppercase">
                BASIS SPREAD MONITOR
              </div>
              <div className="vertical-lr-text text-[#D4FF00] font-mono text-xs font-bold tracking-widest">
                // DCE LH2505
              </div>
              <div className="vertical-lr-text text-[#D4FF00] font-black text-base xl:text-lg tracking-[0.22em] font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                微观供需高频遥测
              </div>
              <div className="vertical-lr-text text-white font-mono font-black text-xs xl:text-sm tracking-[0.28em] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                MICRO SUPPLY & DEMAND
              </div>
              <div className="vertical-lr-text text-[#D4FF00] font-mono text-xs font-bold tracking-widest">
                // 002714 MUYUAN
              </div>
              <div className="vertical-lr-text text-white font-black text-base xl:text-lg tracking-[0.22em] font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                极端行情压力测试
              </div>
              <div className="vertical-lr-text text-white/95 font-mono font-black text-xs xl:text-sm tracking-[0.28em] uppercase">
                STRESS TEST PROTOCOL
              </div>
              <div className="text-[#D4FF00] font-mono text-xs py-2 font-black tracking-widest">
                [ + + + ]
              </div>
            </div>
          </div>
        </div>

        {/* 底部十字标位与系统状态 */}
        <div className="flex flex-col items-center gap-2 shrink-0 z-20 bg-[#2000E0] pt-2">
          <span className="text-[10px] font-mono text-white/80 font-bold tracking-tighter">SEASON 02</span>
          <span className="text-xs font-mono text-[#D4FF00] font-black">[ + ]</span>
        </div>
      </aside>

      {/* 主工作区 (背景透明，使下方的生命游戏像素动画能够透过卡片间隙与半透框显现) */}
      <div className="flex-1 min-w-0 flex flex-col bg-transparent relative z-10">
        {/* Marathon 战术顶部主导航 */}
        <MarathonHeader
          autoRefresh={autoRefresh}
          setAutoRefresh={setAutoRefresh}
          refreshInterval={refreshInterval}
          setRefreshInterval={setRefreshInterval}
          countdown={countdown}
          onManualRefresh={fetchMarketData}
          isRefreshing={isRefreshing}
          audioAlarmEnabled={audioAlarmEnabled}
          setAudioAlarmEnabled={setAudioAlarmEnabled}
          onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
          onOpenGeminiModal={() => setIsGeminiModalOpen(true)}
          onOpenRulesModal={() => setIsRulesModalOpen(true)}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          onOpenPolicyModal={() => setIsPolicyModalOpen(true)}
          policyNewsCount={data.latestPolicyNews?.length || 0}
          onOpenSourceModal={() => setIsOpenSourceModalOpen(true)}
          activeAlertsCount={activeAlerts.length}
          lastUpdateTime={data.timestamp}
          marketStatus={data.marketStatus}
          onToggleSandbox={handleToggleSandbox}
          onSwitchToClassic={() => handleSetViewMode('classic')}
        />

        {/* 华储网官方公告与 7x24 政策快讯轮播横幅 */}
        <MarathonPolicyTicker
          newsList={data.latestPolicyNews || []}
          onOpenModal={() => setIsPolicyModalOpen(true)}
          onRefresh={handleRefreshPolicyNews}
          isRefreshing={isRefreshingPolicy}
        />

        {/* 主体监控视窗 */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 space-y-3.5">
          {/* 1. 快速场景回测与异动触发条 */}
          <MarathonScenarioBar
            onApplyScenario={handleApplyScenario}
            onResetDefault={handleResetDefault}
            isSandbox={data.marketStatus?.isSandbox}
            onToggleSandbox={handleToggleSandbox}
          />

          {/* 2. 核心指标矩阵 (现货、期货、升水率、牧原股份) */}
          <MarathonKeyMetrics
            data={data}
            selectedContract={selectedContract}
            onSelectContract={setSelectedContract}
            onUpdateSpotPrice={handleUpdateSpotPrice}
            onSyncSpotPrice={handleSyncSpotPrice}
          />

          {/* 3. 商业级微观数据指标阵列 (标肥价差、出栏均重、二育占比、屠企开工、冻品库容记忆) */}
          <MarathonMicroPanel
            data={data}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onOpenFrozenModal={() => setIsFrozenModalOpen(true)}
          />

          {/* 4. 期现升贴水博弈标尺与基差分布 */}
          <MarathonBasisGauge
            premiumRate={data.spread.premiumRate}
            basisTon={data.spread.basisTon}
          />

          {/* 5. 左右双栏结构：左侧分时示波器 + 板块集群，右侧战术警戒控制中心 */}
          <MarathonChartAndAlerts
            history={history}
            data={data}
            activeAlerts={activeAlerts}
            alertHistory={alertHistory}
            onDispatchAlert={dispatchToWebhook}
            onClearHistory={() => setAlertHistory([])}
            onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
          />
        </main>

        {/* 底部战术状态栏 */}
        <footer className="border-t border-white/10 bg-[#060709]/75 backdrop-blur-xs py-2.5 text-xs font-tech text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-none bg-[#2000E0]" />
                <span className="text-slate-300 font-bold">
                  生猪高频监控雷达 · 产业期现量化系统
                </span>
              </div>

              {/* 背景生命游戏演化速率与明暗调控器 */}
              <div className="flex flex-wrap items-center gap-2 pl-2 sm:border-l sm:border-white/10 text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-mono">步频:</span>
                  <div className="inline-flex rounded bg-black/70 border border-white/10 p-0.5">
                    {[
                      { label: '12Hz', fps: 12 },
                      { label: '32Hz', fps: 32 },
                      { label: '60Hz', fps: 60 },
                      { label: '100Hz', fps: 100 },
                    ].map((speed) => (
                      <button
                        key={speed.fps}
                        onClick={() => setLifeFps(speed.fps)}
                        className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer font-mono text-[10px] ${
                          lifeFps === speed.fps
                            ? 'bg-[#D4FF00] text-black font-bold shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {speed.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-slate-400 font-mono">明暗:</span>
                  <div className="inline-flex rounded bg-black/70 border border-white/10 p-0.5">
                    {[
                      { label: '幽暗', opacity: 0.26 },
                      { label: '微暗', opacity: 0.45 },
                      { label: '适中', opacity: 0.65 },
                      { label: '高显', opacity: 0.88 },
                    ].map((op) => (
                      <button
                        key={op.opacity}
                        onClick={() => setLifeOpacity(op.opacity)}
                        className={`px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer font-mono text-[10px] ${
                          lifeOpacity === op.opacity
                            ? 'bg-[#D4FF00] text-black font-bold shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setSeedTrigger((prev) => prev + 1)}
                  title="散布新生滑翔机与生命群落"
                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 text-[10px] font-mono cursor-pointer transition-colors"
                >
                  ⚡ 脉冲
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>DCE.LH FUTURES + CRAWLER AUTO-PERSIST</span>
              <button
                onClick={() => handleSetViewMode('classic')}
                className="text-[#2000E0] hover:text-[#3B14FF] bg-white/10 px-2 py-0.5 rounded cursor-pointer ml-1 font-semibold"
              >
                [切换经典留档终端]
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* 弹窗组件 */}
      <WebhookConfigModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        settings={webhookSettings}
        onSaveSettings={handleSaveWebhookSettings}
        currentData={data}
      />

      <RulesConfigModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        rules={rules}
        onSaveRules={(newRules) => setRules(newRules)}
      />

      <GeminiDiagnosisModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        data={data}
      />

      <ReportParserModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onApplyMetrics={handleApplyMicroMetrics}
      />

      <PolicyNewsModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        newsList={data.latestPolicyNews || []}
        onRefreshNews={handleRefreshPolicyNews}
        isRefreshing={isRefreshingPolicy}
      />

      <FrozenInventoryModal
        isOpen={isFrozenModalOpen}
        onClose={() => setIsFrozenModalOpen(false)}
        currentRate={data.microData?.frozenInventoryRate}
        frozenMeta={data.microData?.metricsMeta?.frozenInventory}
        weeklyHistory={data.microData?.weeklyHistory}
        isPersisted={data.microData?.isPersisted ?? true}
        lastPersistedTime={data.microData?.lastPersistedTime}
        onUpdateFrozenRate={handleUpdateFrozenRate}
      />

      <OpenSourceModal
        isOpen={isOpenSourceModalOpen}
        onClose={() => setIsOpenSourceModalOpen(false)}
      />
    </div>
  );
}
