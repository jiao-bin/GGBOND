import React, { useState } from 'react';
import { TriggeredAlert, HogMarketData } from '../types';
import {
  Bell,
  AlertTriangle,
  Flame,
  Send,
  Trash2,
  Copy,
  Check,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatReportText } from '../utils/ruleEngine';

interface AlertPanelProps {
  alerts: TriggeredAlert[];
  alertHistory: TriggeredAlert[];
  currentData: HogMarketData;
  onDispatchAlert: (alert: TriggeredAlert) => void;
  onClearHistory: () => void;
  onOpenWebhookModal: () => void;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  alertHistory,
  currentData,
  onDispatchAlert,
  onClearHistory,
  onOpenWebhookModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [showConsoleReport, setShowConsoleReport] = useState(false);

  const reportText = formatReportText(currentData, alerts);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* 实时活动报警列表 */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${alerts.length > 0 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                实时预警中心
                {alerts.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                    {alerts.length} 个异动已触发
                  </span>
                ) : (
                  <span className="text-xs font-normal text-emerald-400">
                    · 运行正常，暂无极端异动
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                依据升水率超20%及现货亏损&股价大阳线抢跑算法持续研判
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="view-report-text-btn"
              type="button"
              onClick={() => setShowConsoleReport(!showConsoleReport)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showConsoleReport ? '隐藏文本报告' : '查看原格式文本'}</span>
            </button>
            <button
              id="configure-webhook-shortcut-btn"
              type="button"
              onClick={onOpenWebhookModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs border border-blue-500/30 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>配置机器人</span>
            </button>
          </div>
        </div>

        {/* 原脚本格式报告预览抽屉 */}
        {showConsoleReport && (
          <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
              <span>飞书/企业微信机器人原始推送模版</span>
              <button
                type="button"
                onClick={handleCopyReport}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已复制' : '复制内容'}</span>
              </button>
            </div>
            <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed">
              {reportText}
            </pre>
          </div>
        )}

        {/* 当前触发的异动报警卡片 */}
        <div className="mt-4 space-y-2.5">
          {alerts.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800/50">
              <span className="text-slate-400">当前升水率处于正常阈值内，且未检测到现货深度亏损抢跑</span>
              <p className="mt-1 text-[11px] text-slate-600">
                可点击上方「行情场景一键注入」测试升水超20%或抢跑触发效果
              </p>
            </div>
          ) : (
            alerts.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  item.severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-500/50 text-rose-100 ring-1 ring-rose-500/30'
                    : 'bg-amber-950/20 border-amber-500/50 text-amber-100 ring-1 ring-amber-500/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.severity === 'critical' ? (
                      <Flame className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="font-bold text-sm text-white">{item.title}</span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.timestamp}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDispatchAlert(item)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition self-start sm:self-auto"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>推送飞书/企微</span>
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-300 leading-relaxed font-sans">
                  {item.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 历史监测流水日志 */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              异动记录与推送流水 ({alertHistory.length})
            </h3>
          </div>
          {alertHistory.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空流水</span>
            </button>
          )}
        </div>

        <div className="mt-3 max-h-56 overflow-y-auto space-y-2 pr-1 text-xs">
          {alertHistory.length === 0 ? (
            <div className="py-4 text-center text-slate-500">
              暂无异动流水，异动触发时将自动归档至此
            </div>
          ) : (
            alertHistory.map((h, i) => (
              <div
                key={h.id || i}
                className="flex items-start justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        h.severity === 'critical' ? 'bg-rose-400' : 'bg-amber-400'
                      }`}
                    ></span>
                    <span className="font-medium text-slate-200">{h.title}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{h.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{h.content}</p>
                </div>
                {h.dispatchedToFeishu && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-mono shrink-0 ml-2">
                    已推送
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
