import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';
import { TickHistoryItem } from '../types';
import { LineChart as LineChartIcon, BarChart2, TrendingUp } from 'lucide-react';

interface RadarChartSectionProps {
  history: TickHistoryItem[];
}

export const RadarChartSection: React.FC<RadarChartSectionProps> = ({ history }) => {
  const [activeTab, setActiveTab] = useState<'spread' | 'premium' | 'stock'>('spread');

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
      {/* 头部与切换 Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <LineChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              动态时序分时监控雷达
            </h3>
            <p className="text-xs text-slate-400">
              实时追踪生猪期现价格、升水率与牧原股份盘口波动 (最新 {history.length} 次检测)
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80 text-xs">
          <button
            id="tab-chart-spread"
            type="button"
            onClick={() => setActiveTab('spread')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              activeTab === 'spread'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            期现价格对比
          </button>
          <button
            id="tab-chart-premium"
            type="button"
            onClick={() => setActiveTab('premium')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              activeTab === 'premium'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            升水率与20%警戒线
          </button>
          <button
            id="tab-chart-stock"
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              activeTab === 'stock'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            牧原股份走势
          </button>
        </div>
      </div>

      {/* 图表展示区 */}
      <div className="h-64 w-full mt-4">
        {activeTab === 'spread' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                unit="元"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any, name: string) => [
                  `${Number(val).toLocaleString()} 元/吨`,
                  name === 'futuresTon' ? '生猪期货主力(LH0)' : '生猪现货均价折算',
                ]}
              />
              <Line
                type="monotone"
                dataKey="futuresTon"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
                name="futuresTon"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="spotTon"
                stroke="#34d399"
                strokeWidth={2}
                dot={false}
                name="spotTon"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'premium' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis
                domain={[-15, 35]}
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                unit="%"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`${Number(val).toFixed(2)}%`, '期现升水率']}
              />
              {/* 20% 警戒红线 */}
              <ReferenceLine
                y={20}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{ value: '⚠️ 20% 预警红线', fill: '#f43f5e', fontSize: 11, position: 'insideTopRight' }}
              />
              {/* 0% 平水线 */}
              <ReferenceLine
                y={0}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                label={{ value: '0% 平水', fill: '#94a3b8', fontSize: 10, position: 'insideBottomLeft' }}
              />
              <Area
                type="monotone"
                dataKey="premiumRate"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPremium)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'stock' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis
                domain={['auto', 'auto']}
                stroke="#64748b"
                tick={{ fontSize: 11 }}
                unit="元"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any, name: string) => [
                  name === 'muyuanPrice' ? `${val} 元` : `${val}%`,
                  name === 'muyuanPrice' ? '牧原股份最新价' : '涨跌幅',
                ]}
              />
              <Line
                type="monotone"
                dataKey="muyuanPrice"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={false}
                name="muyuanPrice"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 底部图例与简注 */}
      <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-4">
          {activeTab === 'spread' && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                <span>大商所生猪期货主力 (LH0)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>全国现货均价折吨 (现货×1000)</span>
              </span>
            </>
          )}
          {activeTab === 'premium' && (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>实时升贴水率</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-rose-500"></span>
                <span>20% 预警阈值红线</span>
              </span>
            </>
          )}
          {activeTab === 'stock' && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span>牧原股份 (002714) 分时变动</span>
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-500 font-mono">
          数据高频采样推流模式
        </span>
      </div>
    </div>
  );
};
