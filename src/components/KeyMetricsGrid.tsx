import React, { useEffect, useState } from 'react';
import { HogMarketData } from '../types';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Flame,
  Scale,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Info,
  MapPin,
  X,
} from 'lucide-react';

interface KeyMetricsGridProps {
  data: HogMarketData;
  selectedContract?: string;
  onSelectContract?: (symbol: string) => void;
  onUpdateSpotPrice?: (newSpotKg: number) => void;
  onSyncSpotPrice?: () => Promise<void>;
}

export const KeyMetricsGrid: React.FC<KeyMetricsGridProps> = ({
  data,
  selectedContract = 'LH0',
  onSelectContract,
  onUpdateSpotPrice,
  onSyncSpotPrice,
}) => {
  const [spotFlash, setSpotFlash] = useState<'up' | 'down' | null>(null);
  const [futuresFlash, setFuturesFlash] = useState<'up' | 'down' | null>(null);
  const [stockFlash, setStockFlash] = useState<'up' | 'down' | null>(null);
  const [isCalibratingSpot, setIsCalibratingSpot] = useState(false);
  const [inputSpotPrice, setInputSpotPrice] = useState(data.spot.priceKg.toString());
  const [isSyncingSpot, setIsSyncingSpot] = useState(false);
  const [syncTip, setSyncTip] = useState<string | null>(null);
  const [showProvinceModal, setShowProvinceModal] = useState(false);

  // 监听数据变动触发动态微闪特效
  useEffect(() => {
    setFuturesFlash(data.futures.changePct >= 0 ? 'up' : 'down');
    const t = setTimeout(() => setFuturesFlash(null), 800);
    return () => clearTimeout(t);
  }, [data.futures.priceTon]);

  useEffect(() => {
    setStockFlash(data.stock.changePct >= 0 ? 'up' : 'down');
    const t = setTimeout(() => setStockFlash(null), 800);
    return () => clearTimeout(t);
  }, [data.stock.price]);

  const handleSpotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputSpotPrice);
    if (!isNaN(val) && val > 5 && val < 40 && onUpdateSpotPrice) {
      onUpdateSpotPrice(val);
      setIsCalibratingSpot(false);
    }
  };

  const handleSyncSpot = async () => {
    if (!onSyncSpotPrice || isSyncingSpot) return;
    setIsSyncingSpot(true);
    setSyncTip(null);
    try {
      await onSyncSpotPrice();
      if (data.spot.isToday) {
        setSyncTip('已同步今日最新外三元出栏定盘价');
      } else {
        setSyncTip(`今日尚未发布定盘，如实采用前一日 (${data.spot.date}) 官方基准`);
      }
      setTimeout(() => setSyncTip(null), 4000);
    } catch {
      setSyncTip('同步失败，请重试');
      setTimeout(() => setSyncTip(null), 3000);
    } finally {
      setIsSyncingSpot(false);
    }
  };

  const isDeepLoss = data.spot.priceKg < data.spot.deepLossCostKg;
  const isLoss = data.spot.priceKg < data.spot.cashCostKg;
  const isHighPremium = data.spread.premiumRate > 20.0;
  const isStockSurge = data.stock.changePct > 3.0;
  const isPreRunning = isDeepLoss && isStockSurge;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. 生猪现货均价 */}
      <div
        id="card-spot-price"
        className={`relative overflow-hidden rounded-xl border bg-slate-900/90 p-4 transition-all duration-300 shadow-sm ${
          isDeepLoss
            ? 'border-rose-500/60 ring-1 ring-rose-500/30'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>全国外三元生猪现货</span>
          </div>
          <div className="flex items-center gap-1.5">
            {data.spot.isToday ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 font-mono">
                今日定盘 ({data.spot.date})
              </span>
            ) : (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono flex items-center gap-1"
                title={data.spot.statusNote || '今日尚未抓取到定盘，采用前一日数据'}
              >
                <Calendar className="w-2.5 h-2.5 text-amber-400" />
                前一日定盘 ({data.spot.date})
              </span>
            )}
            {data.spot.provinces && data.spot.provinces.length > 0 && (
              <button
                type="button"
                onClick={() => setShowProvinceModal(true)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border border-blue-800/60 transition flex items-center gap-1 font-mono"
                title="查看全国31省市外三元每日出栏涨跌明细表"
              >
                <MapPin className="w-2.5 h-2.5 text-blue-400" />
                <span>31省报价</span>
              </button>
            )}
            {onSyncSpotPrice && (
              <button
                type="button"
                onClick={handleSyncSpot}
                disabled={isSyncingSpot}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1"
                title="联网核对并同步全国生猪出栏定盘均价 (抓不到今日绝不篡改日期)"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isSyncingSpot ? 'animate-spin' : ''}`} />
                <span>{isSyncingSpot ? '校验中' : '同步'}</span>
              </button>
            )}
            {onUpdateSpotPrice && (
              <button
                type="button"
                onClick={() => setIsCalibratingSpot(!isCalibratingSpot)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="校准特定区域猪价"
              >
                {isCalibratingSpot ? '取消' : '校准'}
              </button>
            )}
          </div>
        </div>

        {syncTip && (
          <div className={`mt-2 text-[10px] py-1 px-2 rounded flex items-center gap-1 border ${
            data.spot.isToday
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}>
            <Info className="w-3 h-3 shrink-0" />
            <span>{syncTip}</span>
          </div>
        )}

        {isCalibratingSpot ? (
          <form onSubmit={handleSpotSubmit} className="mt-3 flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={inputSpotPrice}
              onChange={(e) => setInputSpotPrice(e.target.value)}
              className="w-24 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-sm text-white font-mono"
              placeholder="元/kg"
              autoFocus
            />
            <span className="text-xs text-slate-400">元/kg</span>
            <button
              type="submit"
              className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition"
            >
              确定
            </button>
          </form>
        ) : (
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono tracking-tight text-white">
                {data.spot.priceKg.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-normal">元/kg</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-mono block">
                折合 {data.spot.priceTon.toLocaleString()} 元/吨
              </span>
              <span
                className={`text-xs font-semibold font-mono ${
                  data.spot.changePct >= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {data.spot.changePct >= 0 ? '+' : ''}
                {data.spot.changePct.toFixed(2)}%
              </span>
            </div>
          </div>
        )}

        {/* 盈亏区间标识 & 数据源 */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">成本线参考:</span>
            {isDeepLoss ? (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium border border-rose-500/20">
                <AlertTriangle className="w-3 h-3" />
                深度亏损区 (&lt;12.0)
              </span>
            ) : isLoss ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium border border-amber-500/20">
                低于完全成本 (13.8)
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                正常养殖盈利区间
              </span>
            )}
          </div>

          {/* 中国养猪网玄田数据同步: 内三元 / 土杂猪 / 玉米 / 猪粮比 */}
          {(data.spot.neiSanYuanKg || data.spot.maizeTon) && (
            <div className="py-1 px-2 rounded bg-slate-950/60 border border-slate-800/80 text-[10px] font-mono flex items-center justify-between text-slate-300">
              <span title="生猪(内三元)">内三元: <strong className="text-white">{data.spot.neiSanYuanKg ? data.spot.neiSanYuanKg.toFixed(2) : '11.02'}</strong></span>
              <span className="text-slate-600">|</span>
              <span title="生猪(土杂猪)">土杂猪: <strong className="text-white">{data.spot.tuZaZhuKg ? data.spot.tuZaZhuKg.toFixed(2) : '10.53'}</strong></span>
              <span className="text-slate-600">|</span>
              <span title="玉米(饲料原料)">玉米: <strong className="text-amber-300">{data.spot.maizeTon || 2381}</strong></span>
              <span className="text-slate-600">|</span>
              <span title="猪粮比">粮比: <strong className="text-cyan-300">{data.macro.pigGrainRatio}:1</strong></span>
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span className="truncate max-w-[170px]" title={data.spot.source}>
              源: {data.spot.source}
            </span>
            <span className="text-slate-400 shrink-0 font-mono flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5 text-slate-500" />
              {data.spot.date}
            </span>
          </div>
          {data.spot.statusNote ? (
            <div className="text-[9px] text-amber-300/90 bg-amber-950/30 rounded px-1.5 py-1 border border-amber-800/40 leading-relaxed flex items-start gap-1">
              <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
              <span>{data.spot.statusNote}</span>
            </div>
          ) : (
            <div className="text-[9px] text-slate-500 bg-slate-950/40 rounded px-1.5 py-1 border border-slate-800/40 leading-relaxed">
              💡 现货以中国养猪网/农业农村部每日定盘发布 (08:30~09:30) 为准，非电子连续撮合。
            </div>
          )}
        </div>
      </div>

      {/* 2. 生猪期货主力合约 (带多月份合约切换与逐笔报价) */}
      <div
        id="card-futures-price"
        className={`relative overflow-hidden rounded-xl border bg-slate-900/90 p-4 transition-all duration-300 shadow-sm ${
          futuresFlash === 'up'
            ? 'border-rose-500 bg-rose-950/20'
            : futuresFlash === 'down'
            ? 'border-emerald-500 bg-emerald-950/20'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Scale className="w-4 h-4 text-blue-400" />
            <span>大商所生猪期货</span>
            {data.futures.time && (
              <span className="text-[10px] text-slate-500 font-mono">
                {data.futures.time}
              </span>
            )}
          </div>
          {/* 合约选择器 */}
          {data.futures.allContracts && data.futures.allContracts.length > 0 ? (
            <select
              value={selectedContract}
              onChange={(e) => onSelectContract && onSelectContract(e.target.value)}
              className="bg-slate-950 text-blue-400 border border-blue-500/30 rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none focus:border-blue-400 max-w-[140px] truncate"
            >
              {data.futures.allContracts.map((c) => (
                <option key={c.symbol} value={c.symbol} className="bg-slate-900 text-slate-200">
                  {c.name} · {c.priceTon}元
                </option>
              ))}
            </select>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              {data.futures.contract}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono tracking-tight text-white">
              {data.futures.priceTon.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-normal">元/吨</span>
          </div>
          <div className="text-right">
            <div
              className={`flex items-center gap-0.5 text-sm font-semibold font-mono justify-end ${
                data.futures.changePct >= 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {data.futures.changePct >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>
                {data.futures.changePct >= 0 ? '+' : ''}
                {data.futures.changePct.toFixed(2)}%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {data.futures.changeAmount >= 0 ? '+' : ''}
              {data.futures.changeAmount} 点
            </span>
          </div>
        </div>

        {/* 盘口极值与昨结 */}
        <div className="mt-2 text-[10px] text-slate-500 flex justify-between font-mono">
          <span>今开: {data.futures.open || data.futures.priceTon}</span>
          <span>高: {data.futures.high}</span>
          <span>低: {data.futures.low}</span>
          <span>昨结: {data.futures.settlePrice}</span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>持仓: {data.futures.openInterest.toLocaleString()} 手</span>
          <span>成交: {data.futures.volume.toLocaleString()} 手</span>
        </div>
      </div>

      {/* 3. 期现升水率 (核心模型算法) */}
      <div
        id="card-premium-rate"
        className={`relative overflow-hidden rounded-xl border bg-slate-900/90 p-4 transition-all duration-300 shadow-sm ${
          isHighPremium
            ? 'border-amber-500/70 bg-amber-950/20 ring-1 ring-amber-500/30'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Flame className={`w-4 h-4 ${isHighPremium ? 'text-amber-400 animate-pulse' : 'text-purple-400'}`} />
            <span>期现升贴水率 (Basis)</span>
          </div>
          {isHighPremium && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              升水&gt;20%预警
            </span>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span
              className={`text-3xl font-bold font-mono tracking-tight ${
                data.spread.premiumRate > 15
                  ? 'text-amber-400'
                  : data.spread.premiumRate >= 0
                  ? 'text-rose-400'
                  : 'text-emerald-400'
              }`}
            >
              {data.spread.premiumRate >= 0 ? '+' : ''}
              {data.spread.premiumRate.toFixed(2)}%
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-mono">
              基差: {data.spread.basisTon >= 0 ? '+' : ''}
              {data.spread.basisTon.toLocaleString()} 元/吨
            </span>
            <span className="text-[11px] text-slate-500">
              {data.spread.premiumRate >= 0 ? '期货相对现货升水' : '现货相对期货升水'}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 truncate max-w-[150px]" title={data.spread.statusText}>
            {data.spread.statusText}
          </span>
          {data.microData ? (
            <span
              className={`font-mono font-semibold ${
                data.microData.standardFatDiff >= 0.8 ? 'text-red-400' : 'text-amber-400'
              }`}
              title="微信公众号早报提取: 标肥价差"
            >
              标肥差: {data.microData.standardFatDiff > 0 ? `+${data.microData.standardFatDiff}` : data.microData.standardFatDiff}元
            </span>
          ) : (
            <span className="text-slate-500 font-mono">阈值: 20%</span>
          )}
        </div>
      </div>

      {/* 4. 牧原股份 (002714) */}
      <div
        id="card-muyuan-stock"
        className={`relative overflow-hidden rounded-xl border bg-slate-900/90 p-4 transition-all duration-300 shadow-sm ${
          isPreRunning
            ? 'border-rose-500 bg-rose-950/20 ring-1 ring-rose-500/40'
            : stockFlash === 'up'
            ? 'border-rose-500 bg-rose-950/10'
            : stockFlash === 'down'
            ? 'border-emerald-500 bg-emerald-950/10'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-4 h-4 text-rose-400" />
            <span>养殖龙头 · {data.stock.name}</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">{data.stock.code}</span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono tracking-tight text-white">
              {data.stock.price.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-normal">元</span>
          </div>
          <div className="text-right">
            <div
              className={`flex items-center gap-0.5 text-sm font-semibold font-mono justify-end ${
                data.stock.changePct >= 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {data.stock.changePct >= 0 ? '+' : ''}
              {data.stock.changePct.toFixed(2)}%
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              换手: {data.stock.turnoverRate.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
          {isPreRunning ? (
            <span className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
              <Flame className="w-3 h-3 text-rose-400" />
              大阳线抢跑异动!
            </span>
          ) : (
            <span className="text-slate-400">成交量: {data.stock.volume}</span>
          )}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>总市值: {data.stock.marketCap}</span>
            <span
              className="text-[10px] text-slate-500 font-mono hidden sm:inline"
              title="根据牧原股份最新总股本 57.73 亿股动态测算 (57.73亿股 × 当前股价)"
            >
              ({data.stock.totalShares || '57.73亿股'})
            </span>
          </div>
        </div>
      </div>

      {/* 31省市外三元每日出栏涨跌表详情弹窗 */}
      {showProvinceModal && data.spot.provinces && data.spot.provinces.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base sm:text-lg">
                      全国 31 省市外三元生猪出栏行情涨跌明细
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      中国养猪网每日实盘
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    定盘发布日期: <span className="font-mono text-slate-200">{data.spot.date}</span> ｜ 全国算术均价: <span className="font-mono text-amber-300 font-bold">{data.spot.priceKg.toFixed(2)} 元/kg</span> ｜ 覆盖 {data.spot.provinces.length} 个省份及直辖市
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProvinceModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {data.spot.provinces.map((prov) => {
                  const isUp = prov.change > 0;
                  const isDown = prov.change < 0;
                  return (
                    <div
                      key={prov.province}
                      className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-medium text-xs sm:text-sm text-slate-200">
                          {prov.province}
                        </span>
                        <span
                          className={`text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                            isUp
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : isDown
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-700/30 text-slate-400 border border-slate-700/40'
                          }`}
                        >
                          {isUp ? `+${prov.change}` : isDown ? `${prov.change}` : '0.00'}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-base sm:text-lg font-bold font-mono text-white">
                          {prov.price.toFixed(2)}
                          <span className="text-[10px] font-normal text-slate-400 ml-0.5">元/kg</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {Math.round(prov.price * 1000)}元/吨
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate">
                数据来源：中国养猪网全国各省市外三元过磅成交加权统计
              </span>
              <button
                type="button"
                onClick={() => setShowProvinceModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition shrink-0 ml-2"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
