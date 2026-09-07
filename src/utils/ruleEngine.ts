import { HogMarketData, AlertRule, TriggeredAlert } from '../types';

export const DEFAULT_RULES: AlertRule[] = [
  {
    id: 'rule_premium_20',
    title: '生猪期货远月大幅升水超 20%',
    description: '期货相对现货升水率 > 20.0%，市场预期强烈看涨，资金博弈加剧，注意期现回归风险。',
    enabled: true,
    conditionType: 'premium_high',
    threshold: 20.0,
    severity: 'warning',
  },
  {
    id: 'rule_deep_loss_stock_surge',
    title: '现货深度亏损区股价大阳线抢跑',
    description: '现货处于深度亏损区 (< 12.0 元/kg)，但牧原股份等养殖龙头涨幅 > 3.0%，资金提前左侧博弈周期反转抢跑！',
    enabled: true,
    conditionType: 'spot_loss_stock_surge',
    threshold: 12.0, // 现货低于 12 元
    secondaryThreshold: 3.0, // 股价涨幅超过 3%
    severity: 'critical',
  },
  {
    id: 'rule_spot_cash_cost',
    title: '现货击穿行业完全成本线',
    description: '生猪现货跌破 14.0 元/kg，行业普遍进入全亏状态，产能去化预期升温。',
    enabled: true,
    conditionType: 'spot_below_cost',
    threshold: 14.0,
    severity: 'info',
  },
  {
    id: 'rule_turnover_abnormal',
    title: '牧原股份高换手异动',
    description: '牧原股份日换手率 > 3.5%，主力资金大单博弈，短期分歧或启动信号。',
    enabled: true,
    conditionType: 'turnover_surge',
    threshold: 3.5,
    severity: 'info',
  },
  {
    id: 'rule_fat_diff_high',
    title: '标肥价差大幅走扩超 0.8元/kg',
    description: '肥猪较标猪溢价 > 0.8 元/kg，大猪供应紧俏，极度刺激二次育肥养殖户截流标猪压栏！',
    enabled: true,
    conditionType: 'fat_diff_high',
    threshold: 0.8,
    severity: 'warning',
  },
  {
    id: 'rule_weight_overflow',
    title: '样本出栏均重逼近 125.5kg 预警红线',
    description: '全国出栏平均体重 > 125.5 kg，压栏大猪积压严重，临近交割抛售践踏风险急剧上升。',
    enabled: true,
    conditionType: 'weight_high',
    threshold: 125.5,
    severity: 'critical',
  },
];

export function evaluateRules(
  data: HogMarketData,
  rules: AlertRule[] = DEFAULT_RULES
): TriggeredAlert[] {
  const triggered: TriggeredAlert[] = [];
  const now = new Date().toLocaleTimeString('zh-CN', { hour12: false });

  for (const rule of rules) {
    if (!rule.enabled) continue;

    if (rule.conditionType === 'premium_high') {
      if (data.spread.premiumRate > rule.threshold) {
        triggered.push({
          id: `${rule.id}-${Date.now()}`,
          timestamp: now,
          title: `🚨 ${rule.title}`,
          content: `当前生猪期货升水率高达 ${data.spread.premiumRate.toFixed(2)}% (阈值: >${rule.threshold}%)，期货主力报价 ${data.futures.priceTon} 元/吨，现货折算 ${data.spot.priceTon} 元/吨，基差达 ${data.spread.basisTon} 元/吨。预期博弈高度升温！`,
          severity: rule.severity,
          dispatchedToFeishu: false,
          dispatchedToWecom: false,
          rawMetrics: {
            spotKg: data.spot.priceKg,
            futuresTon: data.futures.priceTon,
            premiumRate: data.spread.premiumRate,
            stockChange: data.stock.changePct,
          },
        });
      }
    } else if (rule.conditionType === 'spot_loss_stock_surge') {
      const isSpotLow = data.spot.priceKg < rule.threshold;
      const isStockSurge = data.stock.changePct > (rule.secondaryThreshold ?? 3.0);
      if (isSpotLow && isStockSurge) {
        triggered.push({
          id: `${rule.id}-${Date.now()}`,
          timestamp: now,
          title: `⚡ ${rule.title}`,
          content: `现货处于深度亏损区 (${data.spot.priceKg.toFixed(2)} 元/kg < ${rule.threshold} 元)，但 ${data.stock.name} 逆势大涨 ${data.stock.changePct.toFixed(2)}% (最新价 ${data.stock.price.toFixed(2)} 元，换手率 ${data.stock.turnoverRate}%)，资金出现典型周期底部大阳线抢跑异动！`,
          severity: rule.severity,
          dispatchedToFeishu: false,
          dispatchedToWecom: false,
          rawMetrics: {
            spotKg: data.spot.priceKg,
            futuresTon: data.futures.priceTon,
            premiumRate: data.spread.premiumRate,
            stockChange: data.stock.changePct,
          },
        });
      }
    } else if (rule.conditionType === 'spot_below_cost') {
      if (data.spot.priceKg < rule.threshold) {
        triggered.push({
          id: `${rule.id}-${Date.now()}`,
          timestamp: now,
          title: `📉 ${rule.title}`,
          content: `全国生猪现货均价 ${data.spot.priceKg.toFixed(2)} 元/kg，已击穿行业完全成本警戒线 (${rule.threshold} 元/kg)，行业陷入整体现金流失血亏损。`,
          severity: rule.severity,
          dispatchedToFeishu: false,
          dispatchedToWecom: false,
          rawMetrics: {
            spotKg: data.spot.priceKg,
            futuresTon: data.futures.priceTon,
            premiumRate: data.spread.premiumRate,
            stockChange: data.stock.changePct,
          },
        });
      }
    } else if (rule.conditionType === 'turnover_surge') {
      if (data.stock.turnoverRate > rule.threshold) {
        triggered.push({
          id: `${rule.id}-${Date.now()}`,
          timestamp: now,
          title: `🔥 ${rule.title}`,
          content: `${data.stock.name} 今日换手率达到 ${data.stock.turnoverRate.toFixed(2)}% (高于阈值 ${rule.threshold}%)，成交量活跃，资金关注度显著提升。`,
          severity: rule.severity,
          dispatchedToFeishu: false,
          dispatchedToWecom: false,
          rawMetrics: {
            spotKg: data.spot.priceKg,
            futuresTon: data.futures.priceTon,
            premiumRate: data.spread.premiumRate,
            stockChange: data.stock.changePct,
          },
        });
      }
    } else if (rule.conditionType === 'fat_diff_high') {
      const currentDiff = data.microData?.standardFatDiff;
      if (currentDiff !== undefined && currentDiff > rule.threshold) {
        triggered.push({
          id: `${rule.id}-${Date.now()}`,
          timestamp: now,
          title: `⚖️ ${rule.title}`,
          content: `今日全国标肥价差扩大至 +${currentDiff.toFixed(2)} 元/kg (预警阈值 >${rule.threshold}元)，大肥猪溢价显著，极度刺激二次育肥养殖户截流标猪并压栏，短期近月现货抗跌但需警惕后期集中出栏！`,
          severity: rule.severity,
          dispatchedToFeishu: false,
          dispatchedToWecom: false,
          rawMetrics: {
            spotKg: data.spot.priceKg,
            futuresTon: data.futures.priceTon,
            premiumRate: data.spread.premiumRate,
            stockChange: data.stock.changePct,
          },
        });
      }
    } else if (rule.conditionType === 'weight_high') {
      const currentWeight = data.microData?.avgSlaughterWeight;
      if (currentWeight !== undefined && currentWeight > rule.threshold) {
        triggered.push({
          id: `${rule.id}-${Date.now()}`,
          timestamp: now,
          title: `🚨 ${rule.title}`,
          content: `重点监测样本生猪出栏均重已达 ${currentWeight.toFixed(1)} kg (高危红线 ${rule.threshold}kg)，大猪库存积压严重，一旦标肥价差收窄或二育利润收缩，极易引发集中抢跑踩踏！`,
          severity: rule.severity,
          dispatchedToFeishu: false,
          dispatchedToWecom: false,
          rawMetrics: {
            spotKg: data.spot.priceKg,
            futuresTon: data.futures.priceTon,
            premiumRate: data.spread.premiumRate,
            stockChange: data.stock.changePct,
          },
        });
      }
    }
  }

  return triggered;
}

// 格式化飞书/微信机器人文本（与原 Python 脚本的输出格式保持高度一致且更丰富）
export function formatReportText(data: HogMarketData, alerts: TriggeredAlert[] = []): string {
  const lines: string[] = [
    `时间: ${new Date().toLocaleString('zh-CN')}`,
    `• 生猪现货均价: ${data.spot.priceKg.toFixed(2)} 元/kg (折合 ${data.spot.priceTon.toFixed(0)} 元/吨)`,
    `• 生猪期货主力: ${data.futures.priceTon.toFixed(0)} 元/吨 (${data.futures.changePct >= 0 ? '+' : ''}${data.futures.changePct.toFixed(2)}%)`,
    `• 期货升水率: ${data.spread.premiumRate >= 0 ? '+' : ''}${data.spread.premiumRate.toFixed(2)}% [基差: ${data.spread.basisTon.toFixed(0)} 元/吨]`,
    `• 牧原股份: ${data.stock.price.toFixed(2)} 元 (${data.stock.changePct >= 0 ? '+' : ''}${data.stock.changePct.toFixed(2)}%)`,
    `• 当日换手率: ${data.stock.turnoverRate.toFixed(2)}%`,
    `• 标肥价差: ${data.microData && typeof data.microData.standardFatDiff === 'number' ? `${data.microData.standardFatDiff > 0 ? '+' : ''}${data.microData.standardFatDiff.toFixed(2)} 元/kg [${data.microData.standardFatStatusText || ''}]` : '未获取'}`,
    `• 样本出栏均重: ${data.microData && typeof data.microData.avgSlaughterWeight === 'number' ? `${data.microData.avgSlaughterWeight.toFixed(1)} kg [${data.microData.weightStatusText || ''}]` : '未获取'}`,
    `• 二育销量占比: ${data.microData && typeof data.microData.secondFatteningRate === 'number' ? `${data.microData.secondFatteningRate.toFixed(1)}%` : '未获取'}`,
    `• 猪粮比价: ${data.macro.pigGrainRatio.toFixed(2)}:1 [${data.macro.cyclePhase}]`,
  ];

  if (alerts.length > 0) {
    lines.push('\n【⚠️ 触发预警异动】');
    for (const a of alerts) {
      lines.push(`${a.title}\n${a.content}`);
    }
  } else {
    lines.push('\n--- 监控运行正常，未触发极端异动 ---');
  }

  return lines.join('\n');
}
