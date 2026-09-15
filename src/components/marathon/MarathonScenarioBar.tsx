import React, { useState } from 'react';
import { Play, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp, ShieldAlert, Cpu } from 'lucide-react';

interface MarathonScenarioBarProps {
  onApplyScenario: (params: {
    spotKg: number;
    futuresTon: number;
    muyuanPrice: number;
    muyuanChange: number;
    muyuanTurnover: number;
  }) => Promise<void>;
  onResetDefault: () => Promise<void>;
  isSandbox?: boolean;
  onToggleSandbox?: () => void;
}

export const MarathonScenarioBar: React.FC<MarathonScenarioBarProps> = ({
  onApplyScenario,
  onResetDefault,
  isSandbox,
  onToggleSandbox,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const presets = [
    {
      id: 'deep_discount',
      code: 'VEC.01',
      name: '暴跌深贴水',
      desc: '现货12.50 / 期货11,200 (贴水-10.4%) · 极度悲观',
      params: {
        spotKg: 12.50,
        futuresTon: 11200,
        muyuanPrice: 38.20,
        muyuanChange: -5.80,
        muyuanTurnover: 4.12,
      },
    },
    {
      id: 'panic_spot_9',
      code: 'VEC.02',
      name: '现货跌破10元',
      desc: '现货9.80 / 期货11,000 · 跌破深度亏损线',
      params: {
        spotKg: 9.80,
        futuresTon: 11000,
        muyuanPrice: 36.50,
        muyuanChange: -6.40,
        muyuanTurnover: 4.85,
      },
    },
    {
      id: 'high_premium',
      code: 'VEC.03',
      name: '期货大幅升水',
      desc: '现货11.07 / 期货13,200 (升水+19.2%) · 远期看涨逼仓',
      params: {
        spotKg: 11.07,
        futuresTon: 13200,
        muyuanPrice: 48.50,
        muyuanChange: 7.20,
        muyuanTurnover: 3.80,
      },
    },
    {
      id: 'muyuan_surge',
      code: 'VEC.04',
      name: '龙头拉板异动',
      desc: '牧原涨幅+9.98% / 换手6.5% · 股市资金提前抢跑',
      params: {
        spotKg: 11.20,
        futuresTon: 12100,
        muyuanPrice: 48.36,
        muyuanChange: 9.98,
        muyuanTurnover: 6.50,
      },
    },
  ];

  const handleRunPreset = async (preset: typeof presets[0]) => {
    setActivePreset(preset.id);
    await onApplyScenario(preset.params);
  };

  const handleReset = async () => {
    setActivePreset(null);
    await onResetDefault();
  };

  return (
    <div className="rounded border border-white/14 marathon-card-translucent transition-colors duration-200 text-slate-200 overflow-hidden">
      {/* 模块标题与状态 */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-none bg-[#2000E0]" />
          <span className="font-bold text-xs text-white uppercase tracking-wider font-mono">
            STRESS TEST // 极端行情压力测试沙盒
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            (模拟基差突变、现货恐慌下行、期现背离等极端行情下的系统瞬时响应)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activePreset && (
            <span className="px-2 py-0.5 rounded bg-[#2000E0] text-white text-[11px] font-bold border border-[#3B14FF]">
              沙盒模拟进行中
            </span>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{isOpen ? '收起详情' : '展开参数'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 快捷情景测试按钮 */}
      <div className="p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleRunPreset(preset)}
              className={`px-3 py-1.5 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                activePreset === preset.id
                  ? 'bg-[#2000E0] text-white font-bold border-[#3B14FF] shadow-sm'
                  : 'bg-white/[0.04] hover:bg-white/10 text-slate-200 border-white/10 hover:border-white/25'
              }`}
              title={preset.desc}
            >
              <span className={`text-[10px] font-mono font-bold ${activePreset === preset.id ? 'text-[#D4FF00]' : 'text-slate-400'}`}>
                {preset.code}
              </span>
              <span>{preset.name}</span>
            </button>
          ))}

          {activePreset && (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded text-xs bg-[#FF4600]/15 hover:bg-[#FF4600]/25 text-[#FF4600] border border-[#FF4600]/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>恢复真实行情</span>
            </button>
          )}
        </div>

        {onToggleSandbox && (
          <button
            onClick={onToggleSandbox}
            className={`px-2.5 py-1.5 rounded text-xs border flex items-center gap-1.5 transition-all cursor-pointer ${
              isSandbox
                ? 'bg-[#2000E0] text-white border-[#3B14FF]'
                : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-[#D4FF00]" />
            <span>沙盒: {isSandbox ? '运行中' : '待命'}</span>
          </button>
        )}
      </div>

      {/* 展开的参数详情 */}
      {isOpen && (
        <div className="px-3 sm:px-4 pb-3 pt-1 border-t border-white/10 bg-black/40 text-xs text-slate-400 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {presets.map((p) => (
            <div key={p.id} className="p-2 rounded bg-black border border-white/10">
              <div className="font-semibold text-slate-200 mb-0.5 flex items-center justify-between">
                <span>{p.code} · {p.name}</span>
                <span className="text-[#D4FF00] font-mono text-[10px]">[+]</span>
              </div>
              <div className="text-[11px] text-slate-400">{p.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
