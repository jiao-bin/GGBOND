import React from 'react';
import { HogMarketData } from '../types';
import { Layers, Activity, TrendingUp, TrendingDown, Wheat } from 'lucide-react';

interface SectorPeersCardProps {
  data: HogMarketData;
}

export const SectorPeersCard: React.FC<SectorPeersCardProps> = ({ data }) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              生猪养殖龙头板块联动
            </h3>
            <p className="text-xs text-slate-400">
              对照温氏、新希望及宏观猪粮比价，验证板块抢跑真实性
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">猪粮比价:</span>
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded ${
              data.macro.pigGrainRatio < 5.0
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : data.macro.pigGrainRatio < 6.0
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {data.macro.pigGrainRatio.toFixed(2)} : 1
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3.5">
        {data.peers.map((peer) => (
          <div
            key={peer.code}
            className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-200 text-xs">{peer.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{peer.code}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1 font-mono">
                <span className="text-sm font-bold text-white">{typeof peer.price === 'number' ? peer.price.toFixed(2) : '-'}</span>
                <span className="text-[10px] text-slate-400">元</span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`text-xs font-semibold font-mono flex items-center gap-0.5 justify-end ${
                  (peer.changePct ?? 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {(peer.changePct ?? 0) >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {(peer.changePct ?? 0) >= 0 ? '+' : ''}
                {typeof peer.changePct === 'number' ? peer.changePct.toFixed(2) : '0.00'}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                换手 {typeof peer.turnoverRate === 'number' ? peer.turnoverRate.toFixed(2) : '0.00'}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 底部宏观周期定位标尺 */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Wheat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-400">
            周期推演阶段: <strong className="text-emerald-400">{data.macro.cyclePhase}</strong>
          </span>
        </div>
        <div className="text-slate-500 text-[11px] truncate max-w-lg">
          {data.macro.cyclePhaseDesc}
        </div>
      </div>
    </div>
  );
};
