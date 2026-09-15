import React from 'react';
import { Scale, ArrowRight, ShieldCheck, AlertCircle, Target } from 'lucide-react';

interface MarathonBasisGaugeProps {
  premiumRate: number;
  basisTon: number;
}

export const MarathonBasisGauge: React.FC<MarathonBasisGaugeProps> = ({
  premiumRate,
  basisTon,
}) => {
  // 升贴水区间判定
  let statusText = '平水基准区间 (期现无明显套利空间)';
  let adviceText = '期现价差在合理无套利区间，关注现货实际供需拉动。';
  let zoneColor = 'text-white border-white/30';
  let zoneBadge = '期现平水';

  if (premiumRate > 15) {
    statusText = '极高升水区间 (>+15%) · 远期情绪亢奋';
    adviceText = '期货对现货过度溢价，基差深度为负。产业套保盘可锁定高额养殖利润，择机卖出套保或空头配置。';
    zoneColor = 'text-[#FF4600] border-[#FF4600]/50';
    zoneBadge = '大幅升水';
  } else if (premiumRate > 5) {
    statusText = '温和升水区间 (+5% ~ +15%) · 远期看涨预期';
    adviceText = '市场预期后市猪价筑底回升，期货提前定价下半年供应收缩预期。关注现货反弹幅度是否兑现。';
    zoneColor = 'text-[#D4FF00] border-[#D4FF00]/50';
    zoneBadge = '温和升水';
  } else if (premiumRate < -5) {
    statusText = '深度贴水区间 (<-5%) · 极度悲观预期';
    adviceText = '期货深度贴水现货，市场对远期供应极度悲观。警惕交割月基差强制回归驱动的现货急跌或期货超跌反弹。';
    zoneColor = 'text-emerald-400 border-emerald-500/50';
    zoneBadge = '深度贴水';
  } else if (premiumRate < 0) {
    statusText = '温和贴水区间 (-5% ~ 0%) · 期货偏弱';
    adviceText = '期货略低于现货，基差为正，反映近期出栏承压或弱现实扰动。';
    zoneColor = 'text-cyan-300 border-cyan-500/50';
    zoneBadge = '适度贴水';
  }

  // 标尺百分比 (范围从 -15% 到 +25%)
  const minRange = -15;
  const maxRange = 25;
  const clampedRate = Math.max(minRange, Math.min(maxRange, premiumRate));
  const pointerPct = ((clampedRate - minRange) / (maxRange - minRange)) * 100;

  return (
    <div className="rounded border border-white/14 marathon-card-translucent marathon-card-invert p-4">
      {/* 标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 sm:pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-white text-black text-[10px] font-bold font-mono uppercase tracking-wider badge-tag shrink-0">
            BASIS SCALE
          </span>
          <h2 className="font-bold text-xs sm:text-sm text-white uppercase tracking-wider font-mono">
            期现升贴水博弈标尺与基差分布
          </h2>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${zoneColor} bg-black preserve-color shrink-0`}>
            {zoneBadge}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            基差(现-期): <strong className="text-white font-bold">{basisTon >= 0 ? '+' : ''}{basisTon} 元/吨</strong>
          </span>
        </div>
      </div>

      {/* 分段标尺 */}
      <div className="mt-4 pt-3 sm:pt-2">
        <div className="relative mb-2">
          {/* 刻度指示滑块 - 带有白底与白箭头，边界安全保护，防止移动端边缘溢出截断 */}
          <div
            className="absolute -top-5 sm:-top-4 transition-all duration-300 z-10 flex flex-col items-center -translate-x-1/2 pointer-events-none select-none"
            style={{ left: `${Math.max(8, Math.min(92, pointerPct))}%` }}
          >
            <div className="px-2 py-0.5 rounded bg-white text-black text-xs font-mono font-black shadow-md border border-slate-300 gauge-pointer flex items-center justify-center whitespace-nowrap">
              <span className="pointer-val text-black font-black text-xs">
                {premiumRate >= 0 ? '+' : ''}
                {premiumRate.toFixed(2)}%
              </span>
            </div>
            <div className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-white gauge-pointer-arrow" />
          </div>

          {/* 标尺轨道 - 移动端专属微缩标签，杜绝挤压与文字重叠换行 */}
          <div className="h-7 sm:h-6 w-full flex rounded border border-white/15 bg-black overflow-hidden font-mono text-[10px] sm:text-[11px] font-bold">
            {/* 深度贴水区 (-15% ~ -5%) */}
            <div className="w-[25%] bg-emerald-950/40 border-r border-white/10 flex items-center justify-center text-emerald-400 preserve-color px-0.5 text-center">
              <span className="sm:hidden">贴水&lt;-5%</span>
              <span className="hidden sm:inline">深度贴水 (&lt;-5%)</span>
            </div>
            {/* 平水区 (-5% ~ +5%) */}
            <div className="w-[25%] bg-white/[0.04] border-r border-white/10 flex items-center justify-center text-slate-300 preserve-color px-0.5 text-center">
              <span className="sm:hidden">平水±5%</span>
              <span className="hidden sm:inline">平水区间 (-5%~+5%)</span>
            </div>
            {/* 温和升水区 (+5% ~ +15%) */}
            <div className="w-[25%] bg-[#2000E0]/20 border-r border-white/10 flex items-center justify-center text-[#D4FF00] preserve-color px-0.5 text-center">
              <span className="sm:hidden">升水+15%</span>
              <span className="hidden sm:inline">温和升水 (+5%~+15%)</span>
            </div>
            {/* 极端升水区 (+15% ~ +25%) */}
            <div className="w-[25%] bg-red-950/40 flex items-center justify-center text-[#FF4600] preserve-color px-0.5 text-center">
              <span className="sm:hidden">高升&gt;15%</span>
              <span className="hidden sm:inline">极高升水 (&gt;+15%)</span>
            </div>
          </div>
        </div>

        {/* 标尺底部刻度标签 - 移动端优化字体与间距，防止重叠挤压 */}
        <div className="flex justify-between text-[9px] sm:text-[11px] text-slate-400 sm:text-slate-500 px-0.5 sm:px-1 font-mono pt-1">
          <span className="whitespace-nowrap">-15%<span className="hidden sm:inline"> (深贴水)</span></span>
          <span className="whitespace-nowrap">-5%</span>
          <span className="whitespace-nowrap">0%<span className="hidden sm:inline"> (平水)</span></span>
          <span className="whitespace-nowrap">+5%</span>
          <span className="whitespace-nowrap">+15%</span>
          <span className="whitespace-nowrap">+25%<span className="hidden sm:inline"> (极高升水)</span></span>
        </div>
      </div>

      {/* 产业博弈解读与交易策略建议 */}
      <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-xs">
        <div className="flex items-center gap-2 shrink-0">
          <Target className="w-4 h-4 text-[#D4FF00] shrink-0" />
          <span className="text-white font-bold font-mono advice-label">{statusText}</span>
        </div>
        <div className="text-slate-300 text-xs sm:max-w-xl leading-relaxed advice-text font-medium">
          {adviceText}
        </div>
      </div>
    </div>
  );
};
