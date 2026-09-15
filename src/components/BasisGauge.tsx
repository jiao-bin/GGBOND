import React from 'react';
import { Flame, Info, AlertTriangle } from 'lucide-react';

interface BasisGaugeProps {
  premiumRate: number;
  basisTon: number;
}

export const BasisGauge: React.FC<BasisGaugeProps> = ({ premiumRate, basisTon }) => {
  const rate = typeof premiumRate === 'number' && !isNaN(premiumRate) ? premiumRate : 0;
  const basis = typeof basisTon === 'number' && !isNaN(basisTon) ? basisTon : 0;

  // 标尺范围: -20% 到 +30%
  const minRange = -20;
  const maxRange = 30;
  const clampedRate = Math.min(Math.max(rate, minRange), maxRange);
  const positionPct = ((clampedRate - minRange) / (maxRange - minRange)) * 100;

  const isAlertOver20 = rate > 20.0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0 mt-0.5 sm:mt-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex flex-wrap items-center gap-1.5">
              <span>生猪期现升贴水博弈标尺</span>
              <span className="text-xs text-slate-400 font-normal hidden sm:inline">(Basis & Arbitrage Gauge)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              反映期货对现货的预期溢价幅度，超过 +20% 触发多头投机过热预警
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
          <div className="text-left sm:text-right">
            <div className="text-xs text-slate-400">当前升水率</div>
            <div className={`text-base font-bold font-mono ${isAlertOver20 ? 'text-amber-400 animate-pulse' : 'text-slate-100'}`}>
              {rate >= 0 ? '+' : ''}{rate.toFixed(2)}%
            </div>
          </div>
          <div className="text-right pl-3 border-l border-slate-800">
            <div className="text-xs text-slate-400">现货-期货基差</div>
            <div className="text-base font-bold font-mono text-slate-200">
              {basis >= 0 ? '+' : ''}{basis} <span className="text-xs text-slate-500 font-normal">元/吨</span>
            </div>
          </div>
        </div>
      </div>

      {/* 渐变指示标尺 */}
      <div className="mt-6 px-1 sm:px-2">
        <div className="relative">
          {/* 指针标记 - 安全区间限位保护，防止移动端截断 */}
          <div
            className="absolute -top-7 -translate-x-1/2 flex flex-col items-center transition-all duration-500 ease-out z-10"
            style={{ left: `${Math.max(6, Math.min(94, positionPct))}%` }}
          >
            <div className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono shadow-md whitespace-nowrap ${
              isAlertOver20
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50'
                : 'bg-slate-800 text-white border border-slate-700'
            }`}>
              {rate >= 0 ? '+' : ''}{rate.toFixed(1)}%
            </div>
            <div className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] ${
              isAlertOver20 ? 'border-t-amber-500' : 'border-t-slate-700'
            }`}></div>
          </div>

          {/* 进度条轨道 */}
          <div className="h-3.5 sm:h-3 rounded-full overflow-hidden flex shadow-inner bg-slate-800">
            {/* -20% ~ -10% 深度贴水 */}
            <div style={{ width: '20%' }} className="bg-emerald-600/70" title="深度贴水 (<-10%)"></div>
            {/* -10% ~ 0% 小幅贴水 */}
            <div style={{ width: '20%' }} className="bg-teal-500/70" title="小幅贴水 (-10%~0%)"></div>
            {/* 0% ~ 15% 正常升水 */}
            <div style={{ width: '30%' }} className="bg-blue-500/70" title="合理升水区间 (0%~15%)"></div>
            {/* 15% ~ 20% 偏高升水 */}
            <div style={{ width: '10%' }} className="bg-orange-500/70" title="偏高升水 (15%~20%)"></div>
            {/* > 20% 极端超额升水 预警红区 */}
            <div style={{ width: '20%' }} className="bg-rose-500 relative" title="极端升水 (>20% 警戒区)">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.2)_4px,rgba(0,0,0,0.2)_8px)]"></div>
            </div>
          </div>

          {/* 20% 预警虚线标记 */}
          <div
            className="absolute -top-1 bottom-0 w-0.5 bg-rose-400 z-0"
            style={{ left: `${((20 - minRange) / (maxRange - minRange)) * 100}%` }}
          >
            <span className="absolute -bottom-5 -translate-x-1/2 text-[9px] sm:text-[10px] font-mono text-rose-400 whitespace-nowrap font-semibold">
              +20%<span className="hidden sm:inline"> 警戒线</span>
            </span>
          </div>
          {/* 0% 平水线 */}
          <div
            className="absolute -top-1 bottom-0 w-0.5 bg-slate-400 z-0"
            style={{ left: `${((0 - minRange) / (maxRange - minRange)) * 100}%` }}
          >
            <span className="absolute -bottom-5 -translate-x-1/2 text-[9px] sm:text-[10px] font-mono text-slate-400 whitespace-nowrap">
              0%<span className="hidden sm:inline"> 平水</span>
            </span>
          </div>
        </div>

        {/* 刻度文字 - 响应式防挤压 */}
        <div className="flex justify-between text-[9px] sm:text-[10px] text-slate-400 mt-6 pt-1 font-mono">
          <span className="whitespace-nowrap">-20%<span className="hidden sm:inline"> (挤仓)</span></span>
          <span className="whitespace-nowrap">-10%<span className="hidden sm:inline"> (贴水)</span></span>
          <span className="whitespace-nowrap">0%</span>
          <span className="whitespace-nowrap">+10%<span className="hidden sm:inline"> (升水)</span></span>
          <span className="whitespace-nowrap">+20%<span className="hidden sm:inline"> (预警)</span></span>
          <span className="whitespace-nowrap">+30%<span className="hidden sm:inline"> (过热)</span></span>
        </div>
      </div>

      {/* 状态解读卡片 */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-xs">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="text-slate-400">
          <strong className="text-slate-200">套期保值与套利解读：</strong>
          {isAlertOver20 ? (
            <span className="text-amber-300">
              当前期货远月大幅升水已超 20%，预期博弈严重抢跑。大型养殖场可适度介入期货<strong>卖出套期保值 (Short Hedge)</strong>锁定远期肥猪养殖利润，散户警惕期现价格回归时期货回撤风险。
            </span>
          ) : premiumRate > 5 ? (
            <span>
              市场维持合理远月升水结构，反映出栏淡季与未来供需收紧预期，养殖端有压栏惜售和二次育肥倾向。
            </span>
          ) : premiumRate < -5 ? (
            <span>
              期货处于贴水状态，现货短期偏紧或出栏受阻，期货反映对远期出栏增量及冻品去化的悲观预期。
            </span>
          ) : (
            <span>期现处于平水震荡区间，基差风险适中，各方供需预期趋于一致。</span>
          )}
        </div>
      </div>
    </div>
  );
};
