import React, { useState } from 'react';
import { HogMarketData } from '../types';
import { X, Sparkles, RefreshCw, AlertCircle, Copy, Check } from 'lucide-react';
import Markdown from 'react-markdown';

interface GeminiDiagnosisModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: HogMarketData;
}

export const GeminiDiagnosisModal: React.FC<GeminiDiagnosisModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.1-flash-lite');
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/analyze-hog-cycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotKg: data.spot.priceKg,
          futuresTon: data.futures.priceTon,
          premiumRate: data.spread.premiumRate,
          muyuanPrice: data.stock.price,
          muyuanChange: data.stock.changePct,
          pigGrainRatio: data.macro.pigGrainRatio,
          standardFatDiff: data.microData?.standardFatDiff,
          avgSlaughterWeight: data.microData?.avgSlaughterWeight,
          secondFatteningRate: data.microData?.secondFatteningRate,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setAnalysisText(json.analysis);
        if (json.modelUsed) {
          setModelUsed(json.modelUsed);
        }
        setIsFallback(!!json.isFallback);
      } else {
        setError(json.error || '生成分析报告失败');
      }
    } catch (err: any) {
      setError(err.message || '网络连接异常');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!analysisText) return;
    navigator.clipboard.writeText(analysisText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                宏观生猪周期与套保智能研判
                <span className={`text-[10px] font-normal px-2 py-0.5 rounded border ${
                  isFallback
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {modelUsed}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                结合当前生猪期现升水率 ({data.spread.premiumRate}%) 及龙头股异动进行深度策略剖析
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
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* 当前基准盘面摘要条 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 font-mono">
            <div>
              <span className="text-slate-500 block text-[11px]">现货均价</span>
              <strong className="text-slate-200">{data.spot.priceKg.toFixed(2)} 元/kg</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">期货主力</span>
              <strong className="text-slate-200">{data.futures.priceTon} 元/吨</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">升贴水率</span>
              <strong className={data.spread.premiumRate > 15 ? 'text-amber-400' : 'text-slate-200'}>
                {data.spread.premiumRate >= 0 ? '+' : ''}{data.spread.premiumRate.toFixed(2)}%
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">牧原股份</span>
              <strong className="text-slate-200">{data.stock.price} 元 ({data.stock.changePct}%)</strong>
            </div>
          </div>

          {/* 生成控制或报告展示 */}
          {!analysisText && !loading && !error && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-sm font-semibold text-slate-200">
                一键启动 AI 宏观周期分析
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                由专业商品策略大模型对当前基差结构、养殖企业套期保值策略、二次育肥预期及牧原股份抢跑逻辑进行全方位诊断。
              </p>
              <button
                id="start-gemini-analysis-btn"
                type="button"
                onClick={handleGenerate}
                className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>立即生成诊断报告</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-sm font-medium text-slate-200">
                AI 策略引擎正在综合期现基差与周期供需进行研判...
              </p>
              <p className="text-xs text-slate-500">
                测算套保边际效益与养殖股左侧博弈驱动力
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>生成失败</span>
              </div>
              <p>{error}</p>
              <button
                type="button"
                onClick={handleGenerate}
                className="mt-2 px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-medium"
              >
                重试
              </button>
            </div>
          )}

          {analysisText && !loading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400">诊断报告生成完成</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '已复制' : '复制研报'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>重新诊断</span>
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 leading-relaxed font-sans text-xs">
                <Markdown>{analysisText}</Markdown>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-[11px] text-slate-500">
          <span>提示：分析内容仅供衍生品与现货贸易决策参考，不构成任何直接投资建议。</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
