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
import { DEFAULT_RULES, evaluateRules, formatReportText } from './utils/ruleEngine';
import { soundAlarm } from './utils/audioAlarm';

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
  const [isOpenSourceModalOpen, setIsOpenSourceModalOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* 顶部主导航与高频控制 */}
      <Header
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
        onOpenSourceModal={() => setIsOpenSourceModalOpen(true)}
        activeAlertsCount={activeAlerts.length}
        lastUpdateTime={data.timestamp}
        marketStatus={data.marketStatus}
        onToggleSandbox={handleToggleSandbox}
      />

      {/* 主体监控视窗 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 sm:px-6 space-y-4">
        {/* 1. 快速场景回测与异动触发条 */}
        <ScenarioSimulationBar
          onApplyScenario={handleApplyScenario}
          onResetDefault={handleResetDefault}
        />

        {/* 2. 核心指标矩阵 (现货、期货、升水率、牧原股份) */}
        <KeyMetricsGrid
          data={data}
          selectedContract={selectedContract}
          onSelectContract={setSelectedContract}
          onUpdateSpotPrice={handleUpdateSpotPrice}
          onSyncSpotPrice={handleSyncSpotPrice}
        />

        {/* 3. 商业级微观数据指标 (标肥价差、出栏均重、二育占比 - 微信早报白嫖提取) */}
        <MicroDataPanel
          data={data}
          onOpenReportModal={() => setIsReportModalOpen(true)}
        />

        {/* 4. 期现升贴水博弈标尺与基差分布 */}
        <BasisGauge
          premiumRate={data.spread.premiumRate}
          basisTon={data.spread.basisTon}
        />

        {/* 4. 左右双栏结构：左侧动态图表 + 板块联动，右侧预警中心与历史流水 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 左侧大栏: 分时折线图与养殖龙头对照 (占 7 列) */}
          <div className="lg:col-span-7 space-y-4">
            <RadarChartSection history={history} />
            <SectorPeersCard data={data} />
          </div>

          {/* 右侧边栏: 预警监控中心、异动事件流与飞书推送 (占 5 列) */}
          <div className="lg:col-span-5 space-y-4">
            <AlertPanel
              alerts={activeAlerts}
              alertHistory={alertHistory}
              currentData={data}
              onDispatchAlert={dispatchToWebhook}
              onClearHistory={() => setAlertHistory([])}
              onOpenWebhookModal={() => setIsWebhookModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* 底部免责声明与状态 */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>0成本生猪高频监控雷达 (Pork Radar Dynamic Free) · 持续高频推流测算中</span>
          </div>
          <div className="text-[11px] text-slate-400">
            数据源：大连商品交易所(DCE)生猪期货 + 搜猪网全国均价 + 东方财富/新浪A股实时数据
          </div>
        </div>
      </footer>

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

      <OpenSourceModal
        isOpen={isOpenSourceModalOpen}
        onClose={() => setIsOpenSourceModalOpen(false)}
      />
    </div>
  );
}
