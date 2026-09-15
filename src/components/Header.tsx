import React from 'react';
import {
  Activity,
  RefreshCw,
  Volume2,
  VolumeX,
  Bell,
  Sparkles,
  SlidersHorizontal,
  Clock,
  Radio,
  PlayCircle,
  FileText,
  Code,
} from 'lucide-react';

interface HeaderProps {
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  countdown: number;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  audioAlarmEnabled: boolean;
  setAudioAlarmEnabled: (val: boolean) => void;
  onOpenWebhookModal: () => void;
  onOpenGeminiModal: () => void;
  onOpenRulesModal: () => void;
  onOpenReportModal?: () => void;
  onOpenPolicyModal?: () => void;
  policyNewsCount?: number;
  onOpenSourceModal?: () => void;
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
  onToggleSandbox: () => void;
}

export const Header: React.FC<HeaderProps> = ({
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
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo 与 核心状态 */}
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-400 border border-emerald-300 text-[#2000E0] shadow-lg shadow-emerald-500/25">
              <Activity className="w-6 h-6 text-[#2000E0] animate-pulse stroke-[2.5]" />
              {activeAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-bold text-white items-center justify-center">
                    {activeAlertsCount}
                  </span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  生猪高频监控雷达
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    0成本·期现异动
                  </span>
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      marketStatus?.isSandbox
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        marketStatus?.isSandbox
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    ></span>
                    {marketStatus?.statusText || '实盘行情实时连线'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                全时段实盘监测 · 大商所生猪期货各月合约 + 权威现货 + 牧原股份实时联动
              </p>
            </div>
          </div>

          {/* 控制按钮与高频更新设置 */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* 自动刷新与倒计时 */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/80">
              <button
                id="toggle-auto-refresh-btn"
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                  autoRefresh
                    ? marketStatus?.isSandbox
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  autoRefresh
                    ? marketStatus?.isSandbox
                      ? 'bg-amber-300 animate-pulse'
                      : 'bg-white animate-ping'
                    : 'bg-slate-600'
                }`}></span>
                {autoRefresh
                  ? marketStatus?.isSandbox
                    ? '沙盒模拟中'
                    : '实时刷新中'
                  : '已暂停'}
              </button>

              {autoRefresh && (
                <div className="flex items-center gap-1 px-2 text-slate-300 font-mono">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>{countdown}s</span>
                </div>
              )}

              {/* 刷新频率选择 */}
              <select
                id="refresh-interval-select"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-slate-900 text-slate-300 text-xs rounded border border-slate-700 px-1.5 py-1 focus:outline-none focus:border-emerald-500"
              >
                <option value={3}>3秒 (超高频)</option>
                <option value={5}>5秒 (推荐)</option>
                <option value={10}>10秒</option>
                <option value={30}>30秒</option>
                <option value={60}>1分钟</option>
              </select>
            </div>

            {/* 手动即刻刷新 */}
            <button
              id="manual-refresh-btn"
              type="button"
              onClick={onManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="立即测算更新"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">立即测算</span>
            </button>

            {/* 警报声音开关 */}
            <button
              id="toggle-audio-alarm-btn"
              type="button"
              onClick={() => setAudioAlarmEnabled(!audioAlarmEnabled)}
              className={`p-1.5 rounded-lg border transition ${
                audioAlarmEnabled
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
              title={audioAlarmEnabled ? '异动报警声效已开启' : '异动报警声效已静音'}
            >
              {audioAlarmEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* 规则阈值配置 */}
            <button
              id="open-rules-btn"
              type="button"
              onClick={onOpenRulesModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="自定义预警触发阈值"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">预警规则</span>
            </button>

            {/* 后台自动化爬虫采集管道 */}
            {onOpenReportModal && (
              <button
                id="header-open-report-btn"
                type="button"
                onClick={onOpenReportModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition"
                title="后台全自动定时爬虫采集管道（中国养猪网 + 东方财富研报 API）"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>自动采集管道</span>
              </button>
            )}

            {/* 华储网官方储备肉公告 & 7x24 快讯 */}
            {onOpenPolicyModal && (
              <button
                id="header-open-policy-btn"
                type="button"
                onClick={onOpenPolicyModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition shadow-sm"
                title="华储网官方公告 (www.cmerchant.com) 与金十/新浪 7x24 储备肉/收储/抛储/发改委预警"
              >
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>华储网政策</span>
                {policyNewsCount !== undefined && policyNewsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {policyNewsCount}
                  </span>
                )}
              </button>
            )}

            {/* 飞书 / 企微 Webhook 设置 */}
            <button
              id="open-webhook-btn"
              type="button"
              onClick={onOpenWebhookModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition"
            >
              <Bell className="w-3.5 h-3.5 text-blue-400" />
              <span>机器人推送</span>
            </button>

            {/* Gemini AI 宏观周期诊断 */}
            <button
              id="open-gemini-btn"
              type="button"
              onClick={onOpenGeminiModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI周期研判</span>
            </button>

            {/* 开源协议与代码审查 */}
            {onOpenSourceModal && (
              <button
                id="header-open-source-btn"
                type="button"
                onClick={onOpenSourceModal}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 transition shadow-sm font-medium"
                title="查看开源代码、核心算法实现与 GitHub/ZIP 导出"
              >
                <Code className="w-3.5 h-3.5" />
                <span>开源代码</span>
              </button>
            )}
          </div>
        </div>

        {/* 底部副标信息：最后更新时间与数据源校验 */}
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              最新检测: <strong className="text-slate-300 font-mono">{lastUpdateTime || '--:--:--'}</strong>
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline">
              升贴水公式: <code className="text-slate-300 bg-slate-800/80 px-1 py-0.5 rounded">(LH主力 - 现货*1000) / (现货*1000) × 100%</code>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {onOpenSourceModal && (
              <button
                type="button"
                onClick={onOpenSourceModal}
                className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Code className="w-3 h-3" />
                MIT 开源协议 · 审查架构
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>期现套利与周期大单雷达运行中</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
