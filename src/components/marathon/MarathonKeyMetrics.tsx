import React, { useState } from 'react';
import { HogMarketData } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  RefreshCw,
  Edit2,
  Check,
  X,
  Sliders,
  ChevronDown,
  Info,
  Flame,
  Coins,
  Building2,
  Target,
} from 'lucide-react';

interface MarathonKeyMetricsProps {
  data: HogMarketData;
  selectedContract: string;
  onSelectContract: (contract: string) => void;
  onUpdateSpotPrice?: (spotKg: number) => Promise<void>;
  onSyncSpotPrice?: () => Promise<void>;
}

// 走势微型图形组件 (Sparkline) - 支持悬停自动反相为纯黑线
const MiniSparkline: React.FC<{
  data: number[];
  isPositive?: boolean;
}> = ({ data, isPositive = true }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 64;
  const height = 22;
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - 4) + 2;
    const y = height - 3 - ((val - min) / range) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M ${points[0]} L ${points.join(' L ')} L ${width - 2},${height} L 2,${height} Z`;

  return (
    <svg width={width} height={height} className="sparkline overflow-visible shrink-0">
      <path
        d={areaD}
        className="sparkline-fill"
        fill={isPositive ? '#22c55e' : '#FF4600'}
        fillOpacity="0.18"
      />
      <path
        d={pathD}
        className="sparkline-line"
        fill="none"
        stroke={isPositive ? '#22c55e' : '#FF4600'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const MarathonKeyMetrics: React.FC<MarathonKeyMetricsProps> = ({
  data,
  selectedContract,
  onSelectContract,
  onUpdateSpotPrice,
  onSyncSpotPrice,
}) => {
  const { spot, futures, spread, stock } = data;

  // 现货校准状态
  const [isEditingSpot, setIsEditingSpot] = useState(false);
  const [tempSpotInput, setTempSpotInput] = useState(spot.priceKg.toString());
  const [isSyncingSpot, setIsSyncingSpot] = useState(false);

  // 合约选项
  const CONTRACT_OPTIONS = [
    { value: 'LH0', label: 'LH0 主力连续' },
    { value: 'LH2611', label: 'LH2611 合约' },
    { value: 'LH2701', label: 'LH2701 合约' },
    { value: 'LH2703', label: 'LH2703 合约' },
  ];

  const handleSaveSpot = async () => {
    const val = parseFloat(tempSpotInput);
    if (!isNaN(val) && val > 0 && val < 50 && onUpdateSpotPrice) {
      await onUpdateSpotPrice(val);
      setIsEditingSpot(false);
    }
  };

  const handleTriggerSync = async () => {
    if (onSyncSpotPrice) {
      setIsSyncingSpot(true);
      try {
        await onSyncSpotPrice();
      } finally {
        setTimeout(() => setIsSyncingSpot(false), 800);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* =========================================================
          POD 01: 外三元生猪出栏现货
      ========================================================= */}
      <div className="rounded border border-white/14 marathon-card-translucent flex flex-col justify-between marathon-card-invert overflow-hidden group cursor-pointer">
        <div className="p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-white text-black text-[10px] font-bold font-mono uppercase tracking-wider badge-tag">
                SPOT
              </span>
              <span className="text-white font-bold text-xs tracking-wide">外三元生猪现货</span>
            </div>
            <span className="text-[11px] text-slate-300 font-mono font-medium">全国/河南基准</span>
          </div>

          <div className="mt-2">
            {isEditingSpot ? (
              <div className="flex items-center gap-1.5 my-1">
                <input
                  type="number"
                  step="0.01"
                  value={tempSpotInput}
                  onChange={(e) => setTempSpotInput(e.target.value)}
                  className="w-24 px-2 py-1 bg-black rounded border border-[#2000E0] text-white font-mono text-xl font-bold focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveSpot}
                  className="p-1.5 rounded bg-[#D4FF00] text-black hover:bg-[#b8e000] cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsEditingSpot(false)}
                  className="p-1.5 rounded bg-white/10 text-white hover:bg-white/20 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                    {spot.priceKg.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400">元/kg</span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ({spot.priceTon.toLocaleString()} 元/吨)
                  </span>
                </div>
                {/* 7日微型走势图 */}
                <MiniSparkline
                  data={[10.62, 10.65, 10.68, 10.74, 10.71, 10.77, spot.priceKg]}
                  isPositive={spot.changePct >= 0}
                />
              </div>
            )}

            <div className="flex items-center gap-2 mt-2 text-xs">
              <span
                className={`px-1.5 py-0.5 font-mono font-bold text-xs flex items-center gap-0.5 rounded-xs ${
                  spot.changePct >= 0
                    ? 'change-pill-positive bg-emerald-500/20 text-emerald-400'
                    : 'change-pill-negative bg-[#FF4600]/20 text-[#FF4600]'
                }`}
              >
                {spot.changePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {spot.changePct >= 0 ? '+' : ''}
                {spot.changePct.toFixed(2)}%
              </span>
              <span className="text-slate-400 text-xs">
                {spot.date ? spot.date.slice(5) : '今日'} {spot.publishTime || '09:00'} 定盘
              </span>
            </div>
          </div>
        </div>

        {/* 底部信息带 (7:2:1 比例：深黑底板 + 亮白字 + 荧光绿同步按键与符号) */}
        <div className="bg-[#12141C]/80 text-slate-300 px-3 py-1.5 text-[11px] flex items-center justify-between font-mono font-bold tracking-tight bar-invert">
          <div className="flex items-center gap-2">
            <span className="bar-text-light text-slate-200">行业完全成本: 13.80元</span>
            <button
              onClick={handleTriggerSync}
              disabled={isSyncingSpot}
              className="bar-btn-sync text-[#D4FF00] hover:underline cursor-pointer flex items-center gap-1 font-bold"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingSpot ? 'animate-spin' : ''}`} />
              <span className="bar-btn-text text-[#D4FF00]">同步</span>
            </button>
          </div>
          <span className="bar-plus-symbol text-[#D4FF00] font-bold">[ + ]</span>
        </div>
      </div>

      {/* =========================================================
          POD 02: 大商所生猪主力期货
      ========================================================= */}
      <div className="rounded border border-white/14 marathon-card-translucent flex flex-col justify-between marathon-card-invert overflow-hidden group cursor-pointer">
        <div className="p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-white text-black text-[10px] font-bold font-mono uppercase tracking-wider badge-tag">
                FUTURES
              </span>
              <span className="text-white font-bold text-xs tracking-wide">生猪主力合约</span>
            </div>

            {/* 合约选择器 */}
            <select
              value={selectedContract}
              onChange={(e) => onSelectContract(e.target.value)}
              className="bg-[#12141C] rounded text-white text-[11px] font-mono px-2 py-0.5 focus:outline-none cursor-pointer"
            >
              {CONTRACT_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                  {futures.priceTon.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">元/吨</span>
              </div>
              <MiniSparkline
                data={[11700, 11720, 11780, 11740, 11790, 11820, futures.priceTon]}
                isPositive={futures.changePct >= 0}
              />
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs">
              <span
                className={`px-1.5 py-0.5 font-mono font-bold text-xs flex items-center gap-0.5 rounded-xs ${
                  futures.changePct >= 0
                    ? 'change-pill-positive bg-emerald-500/20 text-emerald-400'
                    : 'change-pill-negative bg-[#FF4600]/20 text-[#FF4600]'
                }`}
              >
                {futures.changePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {futures.changePct >= 0 ? '+' : ''}
                {futures.changePct.toFixed(2)}% ({futures.changeAmount >= 0 ? '+' : ''}
                {futures.changeAmount})
              </span>
              <span className="text-slate-400 text-xs font-mono">
                {futures.contract || selectedContract}
              </span>
            </div>
          </div>
        </div>

        {/* 底部暗底盘口量仓带 */}
        <div className="bg-[#12141C]/80 text-slate-300 px-3 py-1.5 text-[11px] flex items-center justify-between font-mono bar-invert">
          <div className="flex items-center gap-3">
            <span>持仓: {futures.openInterest?.toLocaleString() || '220,067'}</span>
            <span>成交: {futures.volume?.toLocaleString() || '159,665'}</span>
          </div>
          <span className="bar-plus-symbol text-[#D4FF00] font-bold">[ + ]</span>
        </div>
      </div>

      {/* =========================================================
          POD 03: 期现升贴水博弈
      ========================================================= */}
      <div className="rounded border border-white/14 marathon-card-translucent flex flex-col justify-between marathon-card-invert overflow-hidden group cursor-pointer">
        <div className="p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-white text-black text-[10px] font-bold font-mono uppercase tracking-wider badge-tag">
                BASIS
              </span>
              <span className="text-white font-bold text-xs tracking-wide">期现升贴水率</span>
            </div>
            <span className="text-xs font-mono font-bold">
              {spread.status === 'high_premium'
                ? '大幅升水'
                : spread.status === 'moderate_premium'
                ? '温和升水'
                : spread.status === 'discount'
                ? '期货贴水'
                : '平水博弈'}
            </span>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl sm:text-4xl font-black tracking-tight font-mono ${
                    spread.premiumRate > 0 ? 'text-[#D4FF00]' : 'text-[#FF4600]'
                  }`}
                >
                  {spread.premiumRate > 0 ? '+' : ''}
                  {spread.premiumRate.toFixed(2)}%
                </span>
                <span className="text-xs text-slate-400">升水率</span>
              </div>
              <MiniSparkline
                data={[6.8, 7.2, 7.9, 8.1, 7.8, 8.0, spread.premiumRate]}
                isPositive={spread.premiumRate >= 0}
              />
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="px-1.5 py-0.5 rounded bg-white text-black font-mono text-xs font-bold shadow-xs">
                基差: {spread.basisTon >= 0 ? '+' : ''}
                {spread.basisTon} 元/吨
              </span>
              <span className="text-slate-400 text-xs truncate">
                {spread.statusText || '远期看涨预期'}
              </span>
            </div>
          </div>
        </div>

        {/* 底部升水状态条 */}
        <div className="bg-[#12141C]/80 text-slate-300 px-3 py-1.5 text-[11px] flex items-center justify-between font-mono bar-invert">
          <div className="flex items-center gap-2">
            <span className="text-[#D4FF00]">● 实时定价</span>
            <span className="bar-text-light">贴水 &lt; -5% | 升水 &gt; +5%</span>
          </div>
          <span className="bar-plus-symbol text-[#D4FF00] font-bold">[ + ]</span>
        </div>
      </div>

      {/* =========================================================
          POD 04: 养殖龙头 · 牧原股份
      ========================================================= */}
      <div className="rounded border border-white/14 marathon-card-translucent flex flex-col justify-between marathon-card-invert overflow-hidden group cursor-pointer">
        <div className="p-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-white text-black text-[10px] font-bold font-mono uppercase tracking-wider badge-tag">
                EQUITY
              </span>
              <span className="text-white font-bold text-xs tracking-wide">龙头 · 牧原股份</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">002714.SZ</span>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">
                  {stock.price.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400">元</span>
              </div>
              <MiniSparkline
                data={[38.1, 38.2, 38.0, 38.4, 38.6, 38.4, stock.price]}
                isPositive={stock.changePct >= 0}
              />
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs">
              <span
                className={`px-1.5 py-0.5 font-mono font-bold text-xs flex items-center gap-0.5 rounded-xs ${
                  stock.changePct >= 0
                    ? 'change-pill-positive bg-emerald-500/20 text-emerald-400'
                    : 'change-pill-negative bg-[#FF4600]/20 text-[#FF4600]'
                }`}
              >
                {stock.changePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stock.changePct >= 0 ? '+' : ''}
                {stock.changePct.toFixed(2)}%
              </span>
              <span className="text-slate-400 text-xs">
                换手率: <span className="font-mono">{stock.turnoverRate.toFixed(2)}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* 底部同行联动对比条 */}
        <div className="bg-[#12141C]/80 text-slate-300 px-3 py-1.5 text-[11px] flex items-center justify-between font-mono bar-invert">
          <div className="flex items-center gap-2">
            <span>温氏: 14.38 (-0.6%)</span>
            <span>新希望: 7.05 (+0.7%)</span>
          </div>
          <span className="bar-plus-symbol text-[#D4FF00] font-bold">[ + ]</span>
        </div>
      </div>
    </div>
  );
};
