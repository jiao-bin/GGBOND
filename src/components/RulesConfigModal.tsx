import React, { useState } from 'react';
import { AlertRule } from '../types';
import { X, SlidersHorizontal, Check, RotateCcw } from 'lucide-react';
import { DEFAULT_RULES } from '../utils/ruleEngine';

interface RulesConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: AlertRule[];
  onSaveRules: (rules: AlertRule[]) => void;
}

export const RulesConfigModal: React.FC<RulesConfigModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
}) => {
  const [localRules, setLocalRules] = useState<AlertRule[]>(rules);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    setLocalRules(
      localRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleThresholdChange = (id: string, val: number) => {
    setLocalRules(
      localRules.map((r) => (r.id === id ? { ...r, threshold: val } : r))
    );
  };

  const handleSecondaryThresholdChange = (id: string, val: number) => {
    setLocalRules(
      localRules.map((r) => (r.id === id ? { ...r, secondaryThreshold: val } : r))
    );
  };

  const handleResetDefaults = () => {
    setLocalRules(DEFAULT_RULES);
  };

  const handleSave = () => {
    onSaveRules(localRules);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                预警与异动规则阈值设定
              </h2>
              <p className="text-xs text-slate-400">
                可调整生猪期货升水率、现货亏损警戒线及养殖股抢跑幅度
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          {localRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition ${
                rule.enabled
                  ? 'bg-slate-950/80 border-slate-700/80'
                  : 'bg-slate-950/30 border-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => handleToggle(rule.id)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <span className="font-bold text-sm text-slate-100">{rule.title}</span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    rule.severity === 'critical'
                      ? 'bg-rose-500/20 text-rose-300'
                      : rule.severity === 'warning'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {rule.severity.toUpperCase()}
                </span>
              </div>

              <p className="mt-1.5 text-[11px] text-slate-400 leading-relaxed">
                {rule.description}
              </p>

              {rule.enabled && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">
                      {rule.conditionType === 'premium_high'
                        ? '升水警戒阈值 (%):'
                        : rule.conditionType === 'spot_loss_stock_surge'
                        ? '现货深度亏损线下限 (元/kg):'
                        : rule.conditionType === 'spot_below_cost'
                        ? '现金成本警戒 (元/kg):'
                        : rule.conditionType === 'fat_diff_high'
                        ? '标肥价差阈值 (元/kg):'
                        : rule.conditionType === 'weight_high'
                        ? '出栏均重红线 (kg):'
                        : '换手率阈值 (%):'}
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={rule.threshold}
                      onChange={(e) =>
                        handleThresholdChange(rule.id, parseFloat(e.target.value) || 0)
                      }
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-center focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {rule.conditionType === 'spot_loss_stock_surge' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">股价涨幅阈值 (%):</span>
                      <input
                        type="number"
                        step="0.1"
                        value={rule.secondaryThreshold ?? 3.0}
                        onChange={(e) =>
                          handleSecondaryThresholdChange(
                            rule.id,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-center focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置为默认规则</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              取消
            </button>
            <button
              id="save-rules-btn"
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition"
            >
              应用规则
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
