import React, { useState } from 'react';
import {
  TickHistoryItem,
  HogMarketData,
  TriggeredAlert,
} from '../../types';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Activity,
  Send,
  AlertTriangle,
  Flame,
  CheckCircle,
  Building2,
  Trash2,
  Crosshair,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MarathonChartAndAlertsProps {
  history: TickHistoryItem[];
  data: HogMarketData;
  activeAlerts: TriggeredAlert[];
  alertHistory: TriggeredAlert[];
  onDispatchAlert: (alert: TriggeredAlert) => void;
  onClearHistory: () => void;
  onOpenWebhookModal: () => void;
}

export const MarathonChartAndAlerts: React.FC<MarathonChartAndAlertsProps> = ({
  history,
  data,
  activeAlerts,
  alertHistory,
  onDispatchAlert,
  onClearHistory,
  onOpenWebhookModal,
}) => {
  const [chartMode, setChartMode] = useState<'prices' | 'premium'>('prices');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
      {/* =========================================================
          LEFT: 走势图与板块联动 (7 Cols)
      ========================================================= */}
      <div className="lg:col-span-7 space-y-3.5">
        {/* 1. 分时走势图 */}
        <div className="rounded border border-white/14 marathon-card-translucent p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-white text-black text-[10px] font-bold font-mono uppercase tracking-wider badge-tag">
                CHART
              </span>
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                期现基差高频分时走势
              </h3>
              <span className="text-[11px] text-slate-500 hidden sm:inline font-mono">
                ({history.length} 采样点)
              </span>
            </div>

            {/* 切换图表模式 */}
            <div className="flex items-center rounded border border-white/15 bg-black text-xs font-mono">
              <button
                onClick={() => setChartMode('prices')}
                className={`px-3 py-1 cursor-pointer transition-colors ${
                  chartMode === 'prices'
                    ? 'bg-[#2000E0] text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                期现价格 (元/吨)
              </button>
              <button
                onClick={() => setChartMode('premium')}
                className={`px-3 py-1 cursor-pointer transition-colors border-l border-white/10 ${
                  chartMode === 'premium'
                    ? 'bg-[#2000E0] text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                升水率 (%)
              </button>
            </div>
          </div>

          {/* 图表本体 */}
          <div className="h-64 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'prices' ? (
                <ComposedChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c1f28" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#555B6D"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => (v ? v.slice(0, 5) : '')}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={['dataMin - 100', 'dataMax + 100']}
                    stroke="#555B6D"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={['dataMin - 1', 'dataMax + 1']}
                    stroke="#555B6D"
                    fontSize={10}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#040507',
                      borderColor: '#2000E0',
                      borderRadius: '4px',
                      color: '#F3F3EE',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="futuresTon"
                    name="期货主力 (元/吨)"
                    stroke="#D4FF00"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="spotTon"
                    name="现货折算 (元/吨)"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="muyuanPrice"
                    name="牧原股价 (元)"
                    stroke="#3B82F6"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </ComposedChart>
              ) : (
                <ComposedChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c1f28" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#555B6D"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => (v ? v.slice(0, 5) : '')}
                  />
                  <YAxis stroke="#555B6D" fontSize={10} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#040507',
                      borderColor: '#2000E0',
                      borderRadius: '4px',
                      color: '#F3F3EE',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                  <Line
                    type="monotone"
                    dataKey="premiumRate"
                    name="升水率 (%)"
                    stroke="#D4FF00"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. 养殖板块集群与能繁母猪产能 */}
        <div className="rounded border border-white/14 marathon-card-translucent p-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-white text-black text-[10px] font-bold font-mono uppercase tracking-wider badge-tag">
                EQUITY
              </span>
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                生猪养殖龙头股盘口联动
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              周期定位: <strong className="text-white">{data.macro?.cyclePhase || '抢跑筑底期'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 text-xs">
            {/* 牧原 */}
            <div className="p-2.5 rounded marathon-card-translucent-subtle marathon-card-invert border border-[#2000E0] cursor-pointer">
              <div className="flex justify-between text-slate-400 text-xs">
                <span>002714 牧原股份</span>
                <span className="bg-white text-black font-mono font-bold badge-tag px-1 rounded-xs text-[10px]">龙头</span>
              </div>
              <div className="text-lg font-black font-mono text-white mt-1">
                {data.stock.price.toFixed(2)}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-0.5 font-mono">
                <span className={data.stock.changePct >= 0 ? 'text-emerald-400 font-bold' : 'text-[#FF4600] font-bold'}>
                  {data.stock.changePct >= 0 ? '+' : ''}
                  {data.stock.changePct.toFixed(2)}%
                </span>
                <span>换手 {data.stock.turnoverRate.toFixed(1)}%</span>
              </div>
            </div>

            {/* 温氏 */}
            <div className="p-2.5 rounded marathon-card-translucent-subtle marathon-card-invert border border-white/10 cursor-pointer">
              <div className="flex justify-between text-slate-400 text-xs">
                <span>300498 温氏股份</span>
                <span className="font-mono text-slate-500">二哥</span>
              </div>
              <div className="text-lg font-black font-mono text-white mt-1">14.38</div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-0.5 font-mono">
                <span className="text-[#FF4600] font-bold">-0.62%</span>
                <span>换手 0.8%</span>
              </div>
            </div>

            {/* 新希望 */}
            <div className="p-2.5 rounded marathon-card-translucent-subtle marathon-card-invert border border-white/10 cursor-pointer">
              <div className="flex justify-between text-slate-400 text-xs">
                <span>000876 新希望</span>
                <span className="font-mono text-slate-500">饲料+</span>
              </div>
              <div className="text-lg font-black font-mono text-white mt-1">7.05</div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-0.5 font-mono">
                <span className="text-emerald-400 font-bold">+0.71%</span>
                <span>换手 1.1%</span>
              </div>
            </div>

            {/* 巨星农牧 */}
            <div className="p-2.5 rounded marathon-card-translucent-subtle marathon-card-invert border border-white/10 cursor-pointer">
              <div className="flex justify-between text-slate-400 text-xs">
                <span>603477 巨星农牧</span>
                <span className="font-mono text-slate-500">弹性</span>
              </div>
              <div className="text-lg font-black font-mono text-white mt-1">15.14</div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-0.5 font-mono">
                <span className="text-[#FF4600] font-bold">-0.20%</span>
                <span>换手 1.5%</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 text-xs text-slate-400 flex flex-col sm:flex-row justify-between gap-1 font-mono">
            <span>{data.macro?.sowCapacityStatus || '能繁母猪存栏约3990万头 (绿色合理波动区间)'}</span>
            <span className="text-[#D4FF00]">猪粮比价: {data.macro?.pigGrainRatio || 5.12} : 1</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          RIGHT: 实时异动与推送 (5 Cols)
      ========================================================= */}
      <div className="lg:col-span-5 space-y-3.5">
        <div className="rounded border border-white/14 marathon-card-translucent p-4 flex flex-col h-full">
          {/* 预警中心标题 */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-[#FF4600] text-black text-[10px] font-bold font-mono uppercase tracking-wider">
                ALERT
              </span>
              <h3 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                实时异动与机器人推送
              </h3>
            </div>

            <div className="flex items-center gap-2 font-mono">
              <button
                onClick={onOpenWebhookModal}
                className="text-xs text-[#D4FF00] hover:underline cursor-pointer"
              >
                配置推送 [⚙]
              </button>
              {alertHistory.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  title="清空预警日志"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 当前正在触发的警戒项 */}
          <div className="mt-3">
            <div className="text-xs text-slate-400 mb-2 flex items-center justify-between font-mono">
              <span>当前触发异常 ({activeAlerts.length})</span>
              {activeAlerts.length > 0 && (
                <span className="w-2 h-2 rounded-none bg-[#FF4600] animate-ping" />
              )}
            </div>

            {activeAlerts.length > 0 ? (
              <div className="space-y-2">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded border border-[#FF4600]/60 bg-[#FF4600]/10 text-xs relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-[#FF4600]">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{alert.title}</span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded bg-[#FF4600] text-black font-bold text-[10px]">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{alert.content}</p>
                    <div className="mt-2.5 pt-2 border-t border-[#FF4600]/30 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-mono">{alert.timestamp}</span>
                      <button
                        onClick={() => onDispatchAlert(alert)}
                        className="px-2.5 py-1 rounded bg-[#2000E0] text-white font-bold hover:bg-[#3B14FF] flex items-center gap-1 cursor-pointer transition-transform active:scale-95 text-xs font-mono"
                      >
                        <Send className="w-3 h-3 text-[#D4FF00]" />
                        <span>推送至群组</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded border border-white/10 marathon-card-translucent-subtle text-center text-xs text-slate-400">
                <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto mb-1 opacity-90" />
                <span className="font-mono">所有期现基差与异动参数处于安全监控区间</span>
              </div>
            )}
          </div>

          {/* 历史警戒流水 */}
          <div className="mt-4 flex-1">
            <div className="text-xs text-slate-400 mb-1.5 font-mono">
              异动流水日志 ({alertHistory.length})
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {alertHistory.length > 0 ? (
                alertHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded marathon-card-translucent-subtle border border-white/5 hover:border-white/20 transition-colors flex items-center justify-between gap-2 font-mono text-[11px]"
                  >
                    <div className="truncate">
                      <span className="text-slate-500 mr-1.5">[{item.timestamp}]</span>
                      <span className="text-slate-300">{item.title}</span>
                    </div>
                    <span className="text-[#FF4600] shrink-0 font-medium">
                      {item.severity}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic py-2 text-center font-mono">
                  暂无历史触发日志
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
