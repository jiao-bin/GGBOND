import React from 'react';
import { HogMarketData } from '../../types';
import {
  Weight,
  Layers,
  Activity,
  Warehouse,
  FileText,
  Clock,
  Sparkles,
  Database,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

interface MarathonMicroPanelProps {
  data: HogMarketData;
  onOpenReportModal: () => void;
  onOpenFrozenModal: () => void;
}

export const MarathonMicroPanel: React.FC<MarathonMicroPanelProps> = ({
  data,
  onOpenReportModal,
  onOpenFrozenModal,
}) => {
  const micro = data.microData;
  if (!micro) return null;

  const isPersisted = micro.isPersisted ?? true;
  const lastPersistedTime = micro.lastPersistedTime;

  return (
    <div className="rounded border border-white/14 marathon-card-translucent overflow-hidden">
      {/* 顶部标题与状态标签 */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-white text-black text-[10px] font-bold font-mono uppercase tracking-wider badge-tag">
              MICRO
            </span>
            <h2 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              生猪微观供需高频指标矩阵
            </h2>
          </div>
          {isPersisted && (
            <span className="hidden md:flex items-center gap-1 text-[11px] text-[#D4FF00] bg-white/[0.04] px-2 py-0.5 rounded border border-white/10 font-mono">
              <Database className="w-3 h-3 text-[#D4FF00]" />
              <span>数据持久化已就绪</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 冻品库容记忆弹窗按键 */}
          <button
            onClick={onOpenFrozenModal}
            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Warehouse className="w-3 h-3 text-[#D4FF00]" />
            <span>冻品库容走势</span>
          </button>

          {/* 研报解析提取按键 */}
          <button
            onClick={onOpenReportModal}
            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1 transition-all cursor-pointer border border-white/15"
          >
            <FileText className="w-3 h-3 text-slate-300" />
            <span>提取产业研报</span>
          </button>
        </div>
      </div>

      {/* 5大微观指标网格 (透明底板，让背后的生命游戏像素动画能够透光显现) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-white/10 bg-transparent text-xs">
        {/* 1. 标肥价差 */}
        <div className="p-3.5 flex flex-col justify-between marathon-card-invert cursor-pointer group">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-white font-medium">标肥价差</span>
              <span className="text-[11px] text-slate-500 font-mono">高频日度</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-white">
                {micro.standardFatDiff >= 0 ? '+' : ''}
                {micro.standardFatDiff.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">元/kg</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {micro.standardFatStatusText || '大肥相对标猪溢价'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-xs text-slate-500 flex items-center justify-between">
            <span>二育风向标</span>
            <span className="text-[#D4FF00] font-mono font-bold">{micro.standardFatDiff > 0.5 ? '大肥紧俏' : '价差平缓'}</span>
          </div>
        </div>

        {/* 2. 出栏均重 */}
        <div className="p-3.5 flex flex-col justify-between marathon-card-invert cursor-pointer group">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-white font-medium">出栏均重</span>
              <span className="text-[11px] text-slate-500 font-mono">周度抽样</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-white">
                {micro.avgSlaughterWeight?.toFixed(1) || '122.9'}
              </span>
              <span className="text-xs text-slate-400">kg/头</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {micro.weightStatusText || '样本企业出栏均重'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-xs text-slate-500 flex items-center justify-between">
            <span>压栏水位</span>
            <span className={`font-mono font-bold ${micro.avgSlaughterWeight > 125 ? 'text-[#FF4600]' : 'text-emerald-400'}`}>
              {micro.avgSlaughterWeight > 125 ? '严重压栏' : '正常出栏'}
            </span>
          </div>
        </div>

        {/* 3. 二次育肥占比 */}
        <div className="p-3.5 flex flex-col justify-between marathon-card-invert cursor-pointer group">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-white font-medium">二育销量占比</span>
              <span className="text-[11px] text-slate-500 font-mono">补栏情绪</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-white">
                {micro.secondFatteningRate?.toFixed(1) || '8.6'}
              </span>
              <span className="text-xs text-slate-400">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {micro.secondFatteningSentiment || '二育进出场博弈情绪'}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-xs text-slate-500 flex items-center justify-between">
            <span>投机补栏</span>
            <span className="text-slate-300 font-mono">温和理性</span>
          </div>
        </div>

        {/* 4. 屠企开工率 */}
        <div className="p-3.5 flex flex-col justify-between marathon-card-invert cursor-pointer group">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-white font-medium">屠宰开工率</span>
              <span className="text-[11px] text-slate-500 font-mono">终端负荷</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-white">
                {micro.slaughterOperatingRate?.toFixed(1) || '29.6'}
              </span>
              <span className="text-xs text-slate-400">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              重点屠宰企业产能负荷率
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-xs text-slate-500 flex items-center justify-between">
            <span>白条走货</span>
            <span className="text-slate-300 font-mono">平淡消化</span>
          </div>
        </div>

        {/* 5. 冻品库容率 (保持统一深黑质感与7:2:1比例) */}
        <div
          onClick={onOpenFrozenModal}
          className="p-3.5 flex flex-col justify-between bg-white/[0.02] marathon-card-invert cursor-pointer group"
          title="点击查看历周冻品抽样库容走势及手动校准"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <div className="flex items-center gap-1">
                <Warehouse className="w-3 h-3 text-[#D4FF00]" />
                <span className="font-bold text-white">冻品库容率</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-black font-mono font-bold badge-tag">
                已记忆
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black font-mono text-[#D4FF00] group-hover:scale-105 transition-transform">
                {micro.frozenInventoryRate?.toFixed(1) || '32.3'}
              </span>
              <span className="text-xs text-slate-400">%</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">
              全国重点屠企冷库库容占用比
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 text-xs text-[#D4FF00] flex items-center justify-between font-mono">
            <span>抽样历史走势</span>
            <span className="flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              <span>校准 [+]</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 底部研报证据切片 */}
      <div className="px-4 py-2 bg-[#040507] border-t border-white/10 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-slate-400">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-1.5 py-0.5 rounded bg-white text-black font-mono text-[10px] uppercase font-bold shrink-0 shadow-xs">
            REPORT {micro.lastReportTime || '08:35'}
          </span>
          <span className="text-slate-300 truncate font-mono text-[11px]">
            {micro.extractedSnippet ||
              '全国外三元生猪出栏均价微幅震荡，标肥差保持溢价，二育观望，重点屠企冻品库存维持中位震荡。'}
          </span>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span>来源: {micro.lastReportSource || '我的钢铁网农产品'}</span>
          <span className="text-white/20">|</span>
          <button
            onClick={onOpenReportModal}
            className="text-[#D4FF00] hover:underline cursor-pointer"
          >
            更新研报 [↗]
          </button>
        </div>
      </div>
    </div>
  );
};
