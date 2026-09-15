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
    <div className="border-b border-white/10 bg-[#050608]/75 backdrop-blur-xs relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* 左侧标识 */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="px-2 py-0.5 rounded bg-[#FF4600]/15 border border-[#FF4600]/40 text-[#FF4600] font-semibold text-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4600] animate-pulse" />
            <span>政策快讯</span>
          </div>
          <span className="text-slate-400 hidden md:inline text-xs">
            华储网收抛储 · 发改委预警 · 7x24小时政策流
          </span>
        </div>

        {/* 中间动态轮播内容 */}
        <div className="flex-1 min-w-0 flex items-center justify-center sm:justify-start gap-2 overflow-hidden px-2">
          {topNews ? (
            <div
              onClick={onOpenModal}
              className="flex items-center gap-2 truncate cursor-pointer group hover:text-white transition-colors"
            >
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[11px] border border-white/15">
                {topNews.publishTime || '18:00'}
              </span>

              <span
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                  topNews.category === '收储/入库'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : topNews.category === '抛储/出库'
                    ? 'bg-[#FF4600]/20 text-[#FF4600] border border-[#FF4600]/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {topNews.category}
              </span>

              <span className="text-slate-200 group-hover:text-[#D4FF00] truncate">
                {topNews.title}
              </span>

              <span className="text-slate-500 text-xs hidden lg:inline">
                [{topNews.source}]
              </span>
            </div>
          ) : (
            <span className="text-slate-500">正在监听全国官方储备肉抛储/收储及发改委调控预警...</span>
          )}
        </div>

        {/* 右侧控制 */}
        <div className="flex items-center gap-2 shrink-0">
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
