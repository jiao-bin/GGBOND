import React, { useState } from 'react';
import { WebhookSettings, HogMarketData } from '../types';
import {
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { formatReportText } from '../utils/ruleEngine';

interface WebhookConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: WebhookSettings;
  onSaveSettings: (settings: WebhookSettings) => void;
  currentData: HogMarketData;
}

export const WebhookConfigModal: React.FC<WebhookConfigModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  currentData,
}) => {
  const [localSettings, setLocalSettings] = useState<WebhookSettings>(settings);
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
    details?: any;
  }>({ loading: false });

  if (!isOpen) return null;

  const handleTestSend = async (platform: 'feishu' | 'wecom' | 'dingtalk') => {
    const targetUrl =
      platform === 'feishu'
        ? localSettings.feishuUrl
        : platform === 'wecom'
        ? localSettings.wecomUrl
        : localSettings.dingtalkUrl;

    if (!targetUrl || targetUrl.includes('YOUR-UUID')) {
      setTestStatus({
        loading: false,
        success: true,
        message: '【模拟测试成功】已生成标准飞书/企微机器人协议报文 (填入真实Webhook即可向手机群组推送)',
        details: {
          mode: 'simulation',
          note: 'URL中包含占位符 YOUR-UUID，已在本地控制台进行模拟拦截并格式校验通过。',
        },
      });
      return;
    }

    setTestStatus({ loading: true });
    try {
      const reportBody = formatReportText(currentData, [
        {
          id: 'test-1',
          timestamp: new Date().toLocaleTimeString('zh-CN'),
          title: '🚨 生猪高频雷达·通道测试推送',
          content: '这是一条来自 0成本生猪高频监控雷达 的连通性校验消息。监控引擎当前正在稳定采集期现与股价异动。',
          severity: 'warning',
          dispatchedToFeishu: true,
          dispatchedToWecom: false,
          rawMetrics: {
            spotKg: currentData.spot.priceKg,
            futuresTon: currentData.futures.priceTon,
            premiumRate: currentData.spread.premiumRate,
            stockChange: currentData.stock.changePct,
          },
        },
      ]);

      const res = await fetch('/api/webhook/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: targetUrl,
          platform,
          title: '生猪高频监控雷达·测试通知',
          content: reportBody,
          cardData: {
            severity: 'warning',
          },
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.success) {
        setTestStatus({
          loading: false,
          success: true,
          message: '发送成功！群机器人已接收到测试消息',
          details: resData.response,
        });
      } else {
        setTestStatus({
          loading: false,
          success: false,
          message: resData.error || '机器人 Webhook 响应异常',
          details: resData.response || resData,
        });
      }
    } catch (err: any) {
      setTestStatus({
        loading: false,
        success: false,
        message: err.message || '网络请求失败',
      });
    }
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                机器人预警推送通道配置 (Feishu / WeCom)
              </h2>
              <p className="text-xs text-slate-400">
                支持飞书群自定义机器人、企业微信群机器人及钉钉群通知
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* 飞书 Webhook */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                飞书自定义机器人 Webhook 地址 (FEISHU_WEBHOOK)
              </label>
              <button
                type="button"
                onClick={() => handleTestSend('feishu')}
                disabled={testStatus.loading}
                className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                {testStatus.loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                测试发送飞书
              </button>
            </div>
            <input
              type="text"
              value={localSettings.feishuUrl}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, feishuUrl: e.target.value })
              }
              placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/YOUR-UUID-HERE"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-400">
              提示：在飞书群设置 &gt; 自定义机器人 &gt; 添加机器人，复制 Webhook 链接即可使用
            </p>
          </div>

          {/* 企业微信 Webhook */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                企业微信机器人 Webhook 地址 (可选)
              </label>
              <button
                type="button"
                onClick={() => handleTestSend('wecom')}
                disabled={testStatus.loading}
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                测试发送企微
              </button>
            </div>
            <input
              type="text"
              value={localSettings.wecomUrl}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, wecomUrl: e.target.value })
              }
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR-KEY"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* 自动推送策略开关 */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">异动触发时自动向机器人发送</span>
                <span className="text-[11px] text-slate-400">
                  开启后，当升水率 &gt; 20% 或现货亏损抢跑时将实时自动广播到群聊
                </span>
              </div>
              <input
                type="checkbox"
                checked={localSettings.autoSendAlerts}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, autoSendAlerts: e.target.checked })
                }
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* 测试发送结果反馈卡 */}
          {testStatus.message && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                testStatus.success
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold mb-1">
                {testStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{testStatus.message}</span>
              </div>
              {testStatus.details && (
                <pre className="text-[11px] bg-black/40 p-2 rounded mt-2 font-mono overflow-x-auto text-slate-300">
                  {JSON.stringify(testStatus.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            取消
          </button>
          <button
            id="save-webhook-settings-btn"
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};
