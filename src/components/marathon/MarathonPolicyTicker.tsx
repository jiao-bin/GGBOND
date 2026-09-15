import React from 'react';
import { PolicyNewsItem } from '../../types';
import { Radio, RefreshCw, ExternalLink, ChevronRight, AlertTriangle } from 'lucide-react';

interface MarathonPolicyTickerProps {
  newsList: PolicyNewsItem[];
  onOpenModal: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const MarathonPolicyTicker: React.FC<MarathonPolicyTickerProps> = ({
  newsList,
  onOpenModal,
  onRefresh,
  isRefreshing,
}) => {
  const topNews = newsList && newsList.length > 0 ? newsList[0] : null;

  return (
    <div className="border-b border-white/10 bg-[#050608]/75 backdrop-blur-xs relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 text-xs">
        {/* 左侧标识 (移动端两端对齐，集成控制按钮) */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-[#FF4600]/15 border border-[#FF4600]/40 text-[#FF4600] font-semibold text-xs flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF4600] animate-pulse" />
              <span>政策快讯</span>
            </div>
            <span className="text-slate-400 hidden md:inline text-xs">
              华储网收抛储 · 发改委预警 · 7x24小时政策流
            </span>
          </div>

          {/* 移动端专属快捷按钮 */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/15 text-xs flex items-center justify-center active:scale-95 disabled:opacity-50 cursor-pointer"
              title="手动刷新政策公告"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#D4FF00]' : ''}`} />
            </button>
            <button
              onClick={onOpenModal}
              className="px-2 py-0.5 rounded bg-[#D4FF00]/10 hover:bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/40 text-[11px] font-semibold flex items-center gap-0.5 active:scale-95 cursor-pointer"
            >
              <span>详情</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 中间动态轮播内容 (移动端自适应满宽，文字严格截断不撑屏) */}
        <div className="w-full sm:flex-1 min-w-0 flex items-center justify-start gap-1.5 overflow-hidden">
          {topNews ? (
            <div
              onClick={onOpenModal}
              className="w-full min-w-0 flex items-center gap-1.5 cursor-pointer group hover:text-white transition-colors"
            >
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px] sm:text-[11px] border border-white/15 shrink-0">
                {topNews.publishTime || '18:00'}
              </span>

              <span
                className={`px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-medium shrink-0 ${
                  topNews.category === '收储/入库'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : topNews.category === '抛储/出库'
                    ? 'bg-[#FF4600]/20 text-[#FF4600] border border-[#FF4600]/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {topNews.category}
              </span>

              <span className="text-slate-200 group-hover:text-[#D4FF00] text-xs truncate min-w-0 flex-1">
                {topNews.title}
              </span>

              <span className="text-slate-500 text-xs hidden lg:inline shrink-0">
                [{topNews.source}]
              </span>
            </div>
          ) : (
            <span className="text-slate-500 text-xs truncate">正在监听全国官方储备肉抛储/收储及发改委调控预警...</span>
          )}
        </div>

        {/* 桌面端右侧控制区 */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/15 text-xs flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="手动刷新政策公告"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#D4FF00]' : ''}`} />
            <span>{isRefreshing ? '刷新中' : '刷新'}</span>
          </button>

          <button
            onClick={onOpenModal}
            className="px-2.5 py-1 rounded bg-[#D4FF00]/10 hover:bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/40 text-xs font-semibold flex items-center gap-1 active:scale-95 cursor-pointer"
          >
            <span>政策详情</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
