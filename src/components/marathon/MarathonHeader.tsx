import React from 'react';
import {
  Radio,
  Sparkles,
  Sliders,
  Send,
  Bell,
  BellOff,
  RefreshCw,
  Clock,
  Terminal,
  FileText,
  Volume2,
  VolumeX,
  Layers,
  ArrowRightLeft,
  ChevronDown,
} from 'lucide-react';

interface MarathonHeaderProps {
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (val: number) => void;
  countdown: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  audioAlarmEnabled: boolean;
  setAudioAlarmEnabled: (val: boolean) => void;
  onOpenWebhookModal: () => void;
  onOpenGeminiModal: () => void;
  onOpenRulesModal: () => void;
  onOpenReportModal: () => void;
  onOpenPolicyModal: () => void;
  policyNewsCount: number;
  onOpenSourceModal: () => void;
  activeAlertsCount: number;
  lastUpdateTime: string;
  marketStatus?: {
    isTradingTime: boolean;
    statusText: string;
    dceStatus: string;
    sseStatus: string;
    isSandbox: boolean;
    sessionNote: string;
  };
  onToggleSandbox?: () => void;
  onSwitchToClassic: () => void;
}

export const MarathonHeader: React.FC<MarathonHeaderProps> = ({
  autoRefresh,
  setAutoRefresh,
  refreshInterval,
  setRefreshInterval,
  countdown,
  onManualRefresh,
  isRefreshing,
  audioAlarmEnabled,
  setAudioAlarmEnabled,
  onOpenWebhookModal,
  onOpenGeminiModal,
  onOpenRulesModal,
  onOpenReportModal,
  onOpenPolicyModal,
  policyNewsCount,
  onOpenSourceModal,
  activeAlertsCount,
  lastUpdateTime,
  marketStatus,
  onToggleSandbox,
  onSwitchToClassic,
}) => {
  return (
    <header className="border-b border-white/10 bg-[#000000]/75 backdrop-blur-xs text-slate-100 relative">
      {/* 顶部高频遥测条 (Top Telemetry Ribbon) */}
      <div className="border-b border-white/10 bg-[#050608]/75 backdrop-blur-xs px-3 sm:px-6 py-1.5 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white">
            <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
            <span className="font-bold text-[#D4FF00]">高频推流正常</span>
          </div>
          <span className="text-white/20 hidden sm:inline">|</span>
          <span className="hidden sm:inline text-slate-300 font-medium">
            标的: <span className="text-white font-bold">大商所生猪主力(LH) + 外三元全国现货</span>
          </span>
          <span className="text-white/20 hidden md:inline">|</span>
          <span className="hidden md:inline text-slate-300 font-medium">
            频次: <strong className="text-white font-mono font-bold">{refreshInterval}秒</strong>
          </span>
          <span className="text-white/20 hidden lg:inline">|</span>
          <span className="hidden lg:inline text-slate-300 font-medium">
            时刻: <strong className="text-white font-mono font-bold">{lastUpdateTime || '同步中...'}</strong>
          </span>
        </div>

        {/* 核心留档版本快速切换按钮 (带有 Marathon 电光蓝底色) 与声音开关 */}
        <div className="flex items-center gap-2">
          <button
            id="switch-to-classic-btn"
            onClick={onSwitchToClassic}
            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white border border-white/20 hover:border-[#2000E0] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="点击无损切换至之前留档的经典金融终端界面"
          >
            <ArrowRightLeft className="w-3 h-3 text-[#D4FF00]" />
            <span>切换经典终端</span>
            <span className="text-[10px] text-slate-400">[留档]</span>
          </button>

          {/* 声音告警切换 */}
          <button
            onClick={() => setAudioAlarmEnabled(!audioAlarmEnabled)}
            className={`px-2 py-1 rounded border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              audioAlarmEnabled
                ? 'border-[#2000E0] text-white bg-[#2000E0]/30'
                : 'border-white/10 text-slate-500 hover:text-slate-400 bg-white/[0.02]'
            }`}
            title="切换高频异常异动蜂鸣报警"
          >
            {audioAlarmEnabled ? (
              <>
                <Volume2 className="w-3 h-3 text-[#D4FF00]" />
                <span className="text-slate-200">蜂鸣开</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3 h-3" />
                <span>静音</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 主品牌与控制区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 标志区：生猪高频监控雷达 */}
        <div className="flex items-center gap-3">
          {/* 电光蓝+电光绿品牌徽标 */}
          <div className="relative w-10 h-10 rounded bg-[#2000E0] border border-[#3B14FF] text-[#D4FF00] flex items-center justify-center font-bold text-lg shrink-0 select-none shadow-sm">
            <Radio className="w-5 h-5 text-[#D4FF00] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>生猪高频监控雷达</span>
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-[#2000E0]/20 text-[#2000E0] text-[11px] font-mono border border-[#2000E0]/40 font-bold">
                LIVE RADAR
              </span>
            </div>
            <p className="text-xs text-slate-300 font-bold flex items-center gap-2 mt-0.5">
              <span>期现基差与升贴水</span>
              <span className="text-white/20">·</span>
              <span>养殖龙头联动</span>
              <span className="text-white/20">·</span>
              <span>微观供需研报</span>
              <span className="text-white/20">·</span>
              <span>异动预警</span>
            </p>
          </div>
        </div>

        {/* 常用功能操作命令组 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 研报自动化爬虫 */}
          <button
            id="marathon-report-btn"
            onClick={onOpenReportModal}
            className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <span className="w-1.5 h-1.5 bg-[#D4FF00] rounded-full animate-ping" />
            <span>提取研报</span>
          </button>

          {/* 华储网政策公告 */}
          <button
            id="marathon-policy-btn"
            onClick={onOpenPolicyModal}
            className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <span>储备肉公告</span>
            {policyNewsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-[#2000E0] text-white font-bold text-[10px]">
                {policyNewsCount}
              </span>
            )}
          </button>

          {/* 预警阈值 */}
          <button
            id="marathon-rules-btn"
            onClick={onOpenRulesModal}
            className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-300" />
            <span>预警阈值</span>
            {activeAlertsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-[#2000E0] text-white font-bold text-[10px] animate-pulse">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* 飞书推送配置 */}
          <button
            id="marathon-webhook-btn"
            onClick={onOpenWebhookModal}
            className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-slate-300" />
            <span>推送配置</span>
          </button>

          {/* 刷新频率选择 */}
          <div className="flex items-center rounded border border-white/15 bg-black/60 text-xs">
            <span className="px-2 py-1 text-slate-400 border-r border-white/10 hidden sm:inline text-[11px]">
              频率
            </span>
            <button
              onClick={() => setRefreshInterval(3)}
              className={`px-2.5 py-1 cursor-pointer transition-colors ${
                refreshInterval === 3
                  ? 'bg-[#2000E0] text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3秒
            </button>
            <button
              onClick={() => setRefreshInterval(5)}
              className={`px-2.5 py-1 cursor-pointer transition-colors ${
                refreshInterval === 5
                  ? 'bg-[#2000E0] text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              5秒
            </button>
            <button
              onClick={() => setRefreshInterval(10)}
              className={`px-2.5 py-1 cursor-pointer transition-colors ${
                refreshInterval === 10
                  ? 'bg-[#2000E0] text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              10秒
            </button>
          </div>

          {/* 手动刷新按键 */}
          <button
            onClick={onManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded bg-white/10 hover:bg-white/20 text-white border border-white/15 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
            title="立即强制执行一次期现数据测算"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D4FF00]' : ''}`} />
          </button>

          {/* 核心行动点按键：仿照 Marathon BUY NOW 的高亮 Neon Volt 绿方块 (3-5% 比例核心点睛) */}
          <button
            id="marathon-gemini-btn"
            onClick={onOpenGeminiModal}
            className="px-3.5 py-1.5 rounded bg-[#D4FF00] hover:bg-[#b8e000] text-black font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ml-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-black" />
            <span>AI 智能研判</span>
          </button>
        </div>
      </div>
    </header>
  );
};
