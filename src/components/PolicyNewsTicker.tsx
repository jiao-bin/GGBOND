import React, { useState, useEffect } from 'react';
import { Radio, AlertTriangle, ChevronRight, ShieldAlert, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';
import { PolicyNewsItem } from '../types';

interface PolicyNewsTickerProps {
  newsList: PolicyNewsItem[];
  onOpenModal: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const PolicyNewsTicker: React.FC<PolicyNewsTickerProps> = ({
  newsList,
  onOpenModal,
  onRefresh,
  isRefreshing,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!newsList || newsList.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsList.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [newsList, isPaused]);

  if (!newsList || newsList.length === 0) return null;

  const currentItem = newsList[currentIndex] || newsList[0];

  const getDirectionBadge = (item: PolicyNewsItem) => {
    if (item.direction === 'bearish') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
          <TrendingDown className="w-3 h-3 text-rose-400" />
          {item.directionLabel || '出库抛储 · 短期偏空'}
        </span>
      );
    }
    if (item.direction === 'bullish') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          {item.directionLabel || '政策收储 · 支撑托底'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
        <ShieldAlert className="w-3 h-3 text-blue-400" />
        {item.directionLabel || '宏观常态化轮换'}
      </span>
    );
  };

  return (
    <div
      id="policy-news-ticker"
      className="bg-slate-950/90 border-b border-slate-800/80 text-slate-200 px-4 py-2 transition-all hover:bg-slate-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* 左侧：7x24 华储网与政策标签 */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <div className="flex items-center gap-1.5 font-bold text-xs text-rose-400">
            <Radio className="w-3.5 h-3.5" />
            <span>华储网 & 7x24 政策快讯</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {currentIndex + 1}/{newsList.length}
          </span>
        </div>

        {/* 中间：快讯轮播内容 */}
        <div
          className="flex-1 flex items-center gap-2 overflow-hidden cursor-pointer group w-full"
          onClick={onOpenModal}
          title="点击查看华储网官方公告与政策详情"
        >
          <span className="font-mono text-xs font-semibold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
            {currentItem.publishTime || '19:05:57'}
          </span>
          <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">
            {currentItem.title}
          </span>
          {getDirectionBadge(currentItem)}
          {currentItem.tonnage && (
            <span className="hidden md:inline-flex items-center text-[11px] font-mono font-bold text-amber-300 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 shrink-0">
              挂牌 {currentItem.tonnage.toLocaleString()} 吨
            </span>
          )}
        </div>

        {/* 右侧：动作按钮 */}
        <div className="flex items-center gap-2 shrink-0">
          {onRefresh && (
            <button
              id="policy-ticker-refresh-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRefresh();
              }}
              disabled={isRefreshing}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="立即爬取华储网最新公告"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          )}
          <button
            id="policy-ticker-open-modal-btn"
            onClick={onOpenModal}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all"
          >
            <span>政策看板</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
