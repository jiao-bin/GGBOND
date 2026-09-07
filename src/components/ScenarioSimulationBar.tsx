import React from 'react';
import { Play, Sparkles, ShieldAlert, TrendingUp, RefreshCw } from 'lucide-react';

interface ScenarioSimulationBarProps {
  onApplyScenario: (params: {
    spotKg: number;
    futuresTon: number;
    muyuanPrice: number;
    muyuanChange: number;
    muyuanTurnover: number;
  }) => void;
  onResetDefault: () => void;
}

export const ScenarioSimulationBar: React.FC<ScenarioSimulationBarProps> = ({
  onApplyScenario,
  onResetDefault,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-400">
            <Play className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-200">
              行情场景一键注入 / 异动回测
            </span>
            <span className="text-[11px] text-slate-400 ml-2">
              快速测试原模型中的预警与异动逻辑响应
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* 场景 1: 正常平衡市 */}
          <button
            id="scenario-normal-btn"
            type="button"
            onClick={() =>
              onApplyScenario({
                spotKg: 15.2,
                futuresTon: 15800,
                muyuanPrice: 41.5,
                muyuanChange: 0.8,
                muyuanTurnover: 1.4,
              })
            }
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            常态平衡市 (升水+3.9%)
          </button>

          {/* 场景 2: 现货亏损+股价抢跑 (异动预警) */}
          <button
            id="scenario-pre-running-btn"
            type="button"
            onClick={() =>
              onApplyScenario({
                spotKg: 11.4,
                futuresTon: 14200,
                muyuanPrice: 44.8,
                muyuanChange: 4.85,
                muyuanTurnover: 3.8,
              })
            }
            className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-medium transition flex items-center gap-1"
          >
            <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
            <span>现货亏损(&lt;12) + 股价抢跑(&gt;3%)</span>
          </button>

          {/* 场景 3: 升水超20% (升水预警) */}
          <button
            id="scenario-high-premium-btn"
            type="button"
            onClick={() =>
              onApplyScenario({
                spotKg: 14.1,
                futuresTon: 17600,
                muyuanPrice: 43.2,
                muyuanChange: 2.1,
                muyuanTurnover: 2.2,
              })
            }
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium transition flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>期货远月狂热 (升水&gt;24%)</span>
          </button>

          {/* 场景 4: 现货反弹挤仓贴水 */}
          <button
            id="scenario-discount-btn"
            type="button"
            onClick={() =>
              onApplyScenario({
                spotKg: 19.2,
                futuresTon: 17800,
                muyuanPrice: 46.5,
                muyuanChange: -1.2,
                muyuanTurnover: 1.9,
              })
            }
            className="px-2.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 transition"
          >
            现货挤仓 (贴水-7.3%)
          </button>

          {/* 恢复真实基准 */}
          <button
            id="scenario-reset-btn"
            type="button"
            onClick={onResetDefault}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            title="重置为实时/默认行情"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
