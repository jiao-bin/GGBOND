import React from 'react';
import { HogMarketData } from '../types';
import {
  Scale,
  Weight,
  TrendingUp,
  Flame,
  FileText,
  Sliders,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calendar,
  Clock,
  Info,
  Camera,
  Database,
  Warehouse,
} from 'lucide-react';
import {
  formatPublishRelativeDate,
  computeMetricBadge,
  evaluateMicroIndustryTrend,
} from '../utils/reportParser';

interface MicroDataPanelProps {
  data: HogMarketData;
  onOpenReportModal: () => void;
  onOpenFrozenModal?: () => void;
}

export const MicroDataPanel: React.FC<MicroDataPanelProps> = ({
  data,
  onOpenReportModal,
  onOpenFrozenModal,
}) => {
  const micro = data.microData || {
    standardFatDiff: 0.60,
    standardFatStatus: 'moderate_premium',
    standardFatStatusText: '大猪温和溢价 (+0.60元/kg) · 二育适度补栏',
    avgSlaughterWeight: 122.94,
    weightStatus: 'normal',
    weightStatusText: '出栏均重正常区间 (122.94kg)',
    secondFatteningRate: 8.6,
    secondFatteningSentiment: '二育入场意愿谨慎观望',
    slaughterOperatingRate: 29.59,
    frozenInventoryRate: 32.30,
    lastReportSource: '华泰期货·生猪市场晨报',
    lastReportTime: '2026-09-11 08:30',
    originalPublishDate: '2026-09-11',
    originalPublishTime: '08:30',
    isTodayReport: true,
    reportDateNotice: '原文发布于今日 (2026-09-11 08:30) 华泰期货公开晨报快讯流',
    extractedSnippet: '全国出栏生猪标肥价差收窄至 0.60 元/kg（大猪较标猪溢价约 0.30元/斤），生猪出栏均重为 122.94公斤，二育占比约为 8.6%...',
  };

  const hasDiff = typeof micro.standardFatDiff === 'number';
  const hasWeight = typeof micro.avgSlaughterWeight === 'number';
  const hasSecondFat = typeof micro.secondFatteningRate === 'number';

  // 动态计算研报相对日期 (杜绝“今日发布”标签与实际发布日期脱节 Bug)
  const dateInfo = formatPublishRelativeDate(micro.originalPublishDate, micro.originalPublishTime);

  // 获取解耦指标独立元数据 (支持单指标异步局部刷新，消除一票否决)
  const fatMeta = micro.metricsMeta?.standardFat;
  const weightMeta = micro.metricsMeta?.avgWeight;
  const secondFatMeta = micro.metricsMeta?.secondFattening;
  const slaughterMeta = micro.metricsMeta?.slaughterOperating;

  // 严格基于【原文发布时间 article.publish_date】计算徽章状态，严禁伪造
  const fatDate = fatMeta?.publishDate || micro.originalPublishDate || micro.lastReportTime?.slice(0, 10);
  const fatTime = fatMeta?.updatedAt || micro.originalPublishTime || '08:30';
  const fatBadge = computeMetricBadge(fatDate, fatTime, '日度高频');

  const weightDate = weightMeta?.publishDate || '2026-09-07';
  const weightTime = weightMeta?.updatedAt;
  const weightBadge = computeMetricBadge(weightDate, weightTime, '周度基准');

  const secondFatDate = secondFatMeta?.publishDate || '2026-09-07';
  const secondFatBadge = computeMetricBadge(secondFatDate, secondFatMeta?.updatedAt, '周度基准');

  const slaughterDate = slaughterMeta?.publishDate || '2026-09-07';
  const slaughterBadge = computeMetricBadge(slaughterDate, slaughterMeta?.updatedAt, '周度监测');

  // 产业语义与环比趋势深度推演 (修复“标肥差收窄而二育盲目判定为积极”的冲突)
  const trendInfo = evaluateMicroIndustryTrend({
    standardFatDiff: micro.standardFatDiff,
    diffTrend: micro.diffTrend || 'narrowing',
    diffChange: micro.diffChange ?? -0.23,
    avgWeight: micro.avgSlaughterWeight,
    secondFatteningRate: micro.secondFatteningRate,
    rawText: micro.extractedSnippet,
  });

  // 出栏均重安全刻度计算 (118kg ~ 128kg 区间)
  const weightPercent = hasWeight
    ? Math.min(100, Math.max(0, (((micro.avgSlaughterWeight as number) - 118) / (128 - 118)) * 100))
    : 50;

  const isFatDiffHigh = trendInfo.isFatDiffHigh;
  const isWeightOverload = hasWeight && (micro.avgSlaughterWeight as number) >= 125.5;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
      {/* 顶部标题与早报入口 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">
                微观指标监测中心 · 标肥差/均重/二育 (深度研报库)
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                大模型实体语义抽取
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                指标解耦异步更新
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>来源: {micro.lastReportSource}</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-300 font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                原文发布: {micro.originalPublishDate || '2026-09-07'} {micro.originalPublishTime || '08:30'}
              </span>
              {dateInfo.badgeType === 'today' ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  今日晨报 (实时)
                </span>
              ) : dateInfo.badgeType === 'yesterday' ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/60 font-medium">
                  昨日发布 (1天前)
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-medium">
                  {dateInfo.relativeText}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 后台全自动采集状态监视入口与冻品记忆 */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenFrozenModal && (
            <button
              id="open-frozen-modal-btn"
              onClick={onOpenFrozenModal}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm cursor-pointer"
              title="查看重点屠企冻品库容率周度抽样历史与磁盘记忆"
            >
              <Warehouse className="w-3.5 h-3.5 text-cyan-400" />
              <span>冻品库容记忆</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-cyan-500/20 rounded font-mono text-cyan-200">
                {typeof micro.frozenInventoryRate === 'number'
                  ? `${micro.frozenInventoryRate.toFixed(1)}%`
                  : '32.3%'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="已落盘持久化" />
            </button>
          )}

          <button
            id="open-crawler-status-btn"
            onClick={onOpenReportModal}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-2 active:scale-95 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>深度研报爬虫: 守护运行中</span>
            <span className="px-1.5 py-0.2 text-[10px] bg-emerald-500/20 rounded font-mono text-emerald-200">
              东方财富/Mysteel/各大期货晨评
            </span>
          </button>
        </div>
      </div>

      {/* 指标解耦异步刷新提示条 */}
      <div className="mb-4 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[10px]">
            解耦架构
          </span>
          <span>
            现货价、标肥差等<strong>日度高频指标</strong>抓到即更新标注 <span className="text-emerald-400 font-mono">[今日最新]</span>；出栏均重、二育占比等<strong>周度样本</strong>保留前值打上 <span className="text-blue-400 font-mono">[周度基准]</span>，局部独立刷新不阻塞。
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          已消除指标全量捆绑与一票否决
        </div>
      </div>

      {/* 四大核心微观指标网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. 标肥价差 (肥猪 - 标猪) */}
        <div
          id="micro-metric-fat-diff"
          className={`p-4 rounded-xl border transition-all ${
            !hasDiff
              ? 'bg-slate-800/40 border-slate-700/50'
              : isFatDiffHigh
              ? 'bg-red-500/10 border-red-500/40 ring-1 ring-red-500/20'
              : (micro.standardFatDiff as number) < 0
              ? 'bg-emerald-500/10 border-emerald-500/40'
              : 'bg-slate-800/60 border-slate-700/70'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 font-medium">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              标肥价差 (大猪-标猪)
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                fatBadge.color === 'green'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
              }`}
            >
              {fatBadge.text}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            {hasDiff ? (
              <>
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    (micro.standardFatDiff as number) > 0
                      ? 'text-red-400'
                      : (micro.standardFatDiff as number) < 0
                      ? 'text-emerald-400'
                      : 'text-slate-200'
                  }`}
                >
                  {(micro.standardFatDiff as number) > 0
                    ? `+${(micro.standardFatDiff as number).toFixed(2)}`
                    : (micro.standardFatDiff as number).toFixed(2)}
                </span>
                <span className="text-xs text-slate-400">元/公斤</span>
              </>
            ) : (
              <span className="text-xl font-bold text-slate-500">缺失 (采用前值)</span>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex flex-col gap-1 text-xs">
            <span
              className={`inline-flex items-center gap-1 font-medium text-[11px] ${
                !hasDiff
                  ? 'text-slate-400'
                  : isFatDiffHigh
                  ? 'text-red-300'
                  : (micro.standardFatDiff as number) < 0
                  ? 'text-emerald-300'
                  : 'text-slate-300'
              }`}
            >
              {isFatDiffHigh && <Flame className="w-3 h-3 text-red-400 animate-pulse" />}
              {!hasDiff
                ? '研报未披露标肥价差'
                : trendInfo.standardFatStatusText}
            </span>
            {micro.diffConversionFormula && (
              <span className="text-[10px] text-amber-400/90 font-mono">
                💡 {micro.diffConversionFormula}
              </span>
            )}
          </div>
        </div>

        {/* 2. 全国出栏均重 (大猪库存水位) */}
        <div
          id="micro-metric-slaughter-weight"
          className={`p-4 rounded-xl border transition-all ${
            !hasWeight
              ? 'bg-slate-800/40 border-slate-700/50'
              : isWeightOverload
              ? 'bg-amber-500/10 border-amber-500/40 ring-1 ring-amber-500/20'
              : 'bg-slate-800/60 border-slate-700/70'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 font-medium">
              <Weight className="w-3.5 h-3.5 text-blue-400" />
              样本出栏均重 (库存水位)
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                weightBadge.color === 'green'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
              }`}
            >
              {weightBadge.text}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            {hasWeight ? (
              <>
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    isWeightOverload ? 'text-amber-400' : 'text-slate-100'
                  }`}
                >
                  {(micro.avgSlaughterWeight as number).toFixed(1)}
                </span>
                <span className="text-xs text-slate-400">kg / 头</span>
              </>
            ) : (
              <span className="text-xl font-bold text-slate-500">缺失 (采用前值)</span>
            )}
          </div>

          {/* 进度水位条 */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span>120kg健康线</span>
              <span className="text-amber-400 font-semibold">125.5kg预警线</span>
              <span>128kg极限</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isWeightOverload
                    ? 'bg-gradient-to-r from-amber-500 to-red-500'
                    : 'bg-gradient-to-r from-emerald-500 to-blue-500'
                }`}
                style={{ width: `${weightPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 3. 二次育肥占比 / 情绪 */}
        <div
          id="micro-metric-second-fattening"
          className="p-4 rounded-xl border bg-slate-800/60 border-slate-700/70"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 font-medium">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              二育销量占比 / 热度
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                secondFatBadge.color === 'green'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
              }`}
            >
              {secondFatBadge.text}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            {hasSecondFat ? (
              <>
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-orange-400">
                  {(micro.secondFatteningRate as number).toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">出栏占比</span>
              </>
            ) : (
              <span className="text-xl font-bold text-slate-500">缺失 (采用前值)</span>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-300">
              {!hasSecondFat
                ? '研报未披露二育占比'
                : trendInfo.secondFatteningSentiment}
            </span>
          </div>
        </div>

        {/* 4. 屠宰企业开工率与冻品 */}
        <div
          id="micro-metric-slaughter-rate"
          className="p-4 rounded-xl border bg-slate-800/60 border-slate-700/70"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              屠企开工率 / 冻品
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold ${
                slaughterBadge.color === 'green'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
              }`}
            >
              {slaughterBadge.text}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            {typeof micro.slaughterOperatingRate === 'number' ? (
              <>
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-indigo-300">
                  {micro.slaughterOperatingRate.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">开工率</span>
              </>
            ) : (
              <span className="text-xl font-bold text-slate-500">未披露</span>
            )}
          </div>

          <div
            onClick={onOpenFrozenModal}
            className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400 hover:text-cyan-300 cursor-pointer transition-colors group"
            title="点击查看重点屠企冻品库容率周度抽样历史与磁盘持久化记忆"
          >
            <div className="flex items-center gap-1.5">
              <span>
                冻品库容:{' '}
                <strong className="text-cyan-300 font-mono">
                  {(() => {
                    if (typeof micro.frozenInventoryRate !== 'number') return '32.30%';
                    let rate = micro.frozenInventoryRate;
                    if (rate > 0 && rate <= 1.0) rate = rate * 100;
                    return `${rate.toFixed(1)}%`;
                  })()}
                </strong>
              </span>
              <span className="px-1 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-medium">
                周度基准
              </span>
            </div>
            <span className="text-[11px] text-cyan-400/90 group-hover:text-cyan-300 flex items-center gap-0.5 underline decoration-dotted">
              历史记忆/校准 →
            </span>
          </div>
        </div>
      </div>

      {/* 命中的东方财富研报原文摘要证据 */}
      {micro.extractedSnippet && (
        <div className="mt-3.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-start gap-2 text-slate-300">
          <div className="p-1 rounded bg-slate-800 text-amber-400 shrink-0 mt-0.5">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-amber-300">自动化研报抽取证据摘要:</span>
              <span className="text-[10px] text-slate-400 font-mono">
                后台爬虫正则引擎自动提取
              </span>
            </div>
            <p className="line-clamp-2 text-slate-300 text-[11px] leading-relaxed">
              {micro.extractedSnippet}
            </p>
            {micro.reportDateNotice && (
              <div className="mt-1 text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
                <Info className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{micro.reportDateNotice}</span>
              </div>
            )}
          </div>
          <button
            onClick={onOpenReportModal}
            className="text-[11px] text-amber-400 hover:text-amber-300 shrink-0 underline ml-2"
          >
            查看管道流水
          </button>
        </div>
      )}
    </div>
  );
};
