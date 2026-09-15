import React, { useState } from 'react';
import {
  Code,
  Check,
  Copy,
  FolderGit2,
  Download,
  Terminal,
  Cpu,
  Layers,
  ShieldCheck,
  ExternalLink,
  BookOpen,
  X
} from 'lucide-react';

interface OpenSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpenSourceModal: React.FC<OpenSourceModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'algorithms' | 'files' | 'export'>('overview');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">开源代码与架构审查 (Open Source)</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  MIT License
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                代码完全开源开放 · 零混淆 · 支持一键导出至 GitHub 或本地 ZIP 运行
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 标签栏 */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            系统概览与协议
          </button>
          <button
            onClick={() => setActiveTab('algorithms')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'algorithms'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            核心量化算法实现
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'files'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            工程文件目录树
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            导出 GitHub / ZIP
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  MIT 自由开源协议
                </div>
                <p className="text-slate-400 leading-relaxed">
                  本项目代码全部对您开放。您拥有对全部源代码的自由查看、修改、分发、商业部署与二次开发权限。项目中没有任何私有加密或混淆代码。
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-200 text-sm">本地一键拉取与运行</h4>
                <div className="relative rounded-lg bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-emerald-300">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'git clone <YOUR_REPO_URL>\ncd hog-quantum-radar\nnpm install\nnpm run dev',
                        'install-cmd'
                      )
                    }
                    className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
                  >
                    {copiedKey === 'install-cmd' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px]">已复制</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px]">复制</span>
                      </>
                    )}
                  </button>
                  <pre className="whitespace-pre-wrap leading-relaxed">
{`# 1. 克隆代码仓库
git clone <YOUR_REPO_URL>
cd hog-quantum-radar

# 2. 安装项目依赖
npm install

# 3. 启动开发服务器 (端口 3000)
npm run dev

# 4. 生产环境单文件编译与启动
npm run build
npm run start`}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="font-semibold text-slate-200 block mb-1">前端技术栈</span>
                  <span className="text-slate-400">React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="font-semibold text-slate-200 block mb-1">后端与模型</span>
                  <span className="text-slate-400">Node.js Express, Gemini 3.6 Flash (多模态 Vision OCR + 智能决策), Esbuild</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'algorithms' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-100 flex items-center justify-between">
                  <span>1. 期现升水率 (Basis & Premium Rate) 计算逻辑</span>
                  <span className="font-mono text-[10px] text-slate-500">server.ts / ruleEngine.ts</span>
                </div>
                <div className="font-mono p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-300">
                  {`const spotTon = spotPriceKg * 1000;
const basis = spotTon - futuresPriceTon; // 现货减期货
const premiumRate = ((futuresPriceTon - spotTon) / spotTon) * 100; // 期货对现货升水率
// 触发规则: 升水率 > 20% 时标记投机过热预警`}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-100 flex items-center justify-between">
                  <span>2. 股票领涨抢跑异动判别算法</span>
                  <span className="font-mono text-[10px] text-slate-500">ruleEngine.ts</span>
                </div>
                <div className="font-mono p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-300">
                  {`if (muyuanChangePct >= 3.5 && turnoverRate >= 1.5) {
  if (futuresChangePct < 1.0) {
    triggers.push({ type: 'STOCK_PRE_RUN', msg: '牧原大阳线抢跑异动！现货/期货尚未启动，资金先行建仓' });
  }
}`}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-100 flex items-center justify-between">
                  <span>3. OCR 智能容灾与数据清洗</span>
                  <span className="font-mono text-[10px] text-slate-500">server.ts</span>
                </div>
                <div className="font-mono p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-300">
                  {`// 候选模型队列: 优先 gemini-3.8-flash，降级备选 gemini-flash-latest 与 gemini-3.1-flash-lite
const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
// 自动清洗与防御 null.toFixed 崩溃机制
const formatSafeNum = (val, digits = 2, fallback = '-') =>
  typeof val === 'number' && !isNaN(val) ? val.toFixed(digits) : fallback;`}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-3 font-mono">
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] leading-relaxed text-slate-300">
                <div className="text-emerald-400 font-bold mb-2">项目核心开源代码结构：</div>
                <div>├── LICENSE                      <span className="text-slate-500"># MIT 协议正文</span></div>
                <div>├── README.md                    <span className="text-slate-500"># 完整工程文档与量化模型说明</span></div>
                <div>├── package.json                 <span className="text-slate-500"># 依赖清单与构建脚本</span></div>
                <div>├── server.ts                    <span className="text-slate-500"># 后端 Express、爬虫与 Gemini 3.6 API</span></div>
                <div>├── src/</div>
                <div>│   ├── App.tsx                  <span className="text-slate-500"># 主控制台、状态协调与沙盒模式</span></div>
                <div>│   ├── types.ts                 <span className="text-slate-500"># 宏微观指标定义与告警配置类型</span></div>
                <div>│   ├── services/</div>
                <div>│   │   ├── api.ts               <span className="text-slate-500"># 接口请求与容灾备用源</span></div>
                <div>│   │   ├── ruleEngine.ts        <span className="text-slate-500"># 量化告警规则判别引擎</span></div>
                <div>│   │   └── audioAlarm.ts        <span className="text-slate-500"># Web Audio 声音合成报警</span></div>
                <div>│   └── components/</div>
                <div>│       ├── Header.tsx           <span className="text-slate-500"># 顶栏与刷新控制器</span></div>
                <div>│       ├── KeyMetricsGrid.tsx   <span className="text-slate-500"># 四宫格核心看板</span></div>
                <div>│       ├── BasisGauge.tsx       <span className="text-slate-500"># 升贴水博弈动态标尺</span></div>
                <div>│       ├── ReportParserModal.tsx<span className="text-slate-500"># 后台全自动定时爬虫监控管道</span></div>
                <div>│       ├── GeminiDiagnosisModal <span className="text-slate-500"># 周期智能量化诊断</span></div>
                <div>│       └── WebhookModal.tsx     <span className="text-slate-500"># 企微/钉钉机器人推送</span></div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-slate-300 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
                  <FolderGit2 className="w-5 h-5" />
                  如何从 Google AI Studio 导出代码
                </div>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 leading-relaxed">
                  <li>
                    查看当前界面<strong>右上角</strong>的设置与操作区域（三点菜单或 Settings 图标）。
                  </li>
                  <li>
                    点击 <strong className="text-white">Export to GitHub</strong>：授权后系统会自动为您在 GitHub 创建对应仓库并推送当前全部代码。
                  </li>
                  <li>
                    点击 <strong className="text-white">Download ZIP</strong>：即刻打包下载包含所有前端代码、后端脚本、配置及说明文档的压缩包。
                  </li>
                </ol>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-200">无需任何特殊依赖</div>
                <p className="text-slate-400 leading-relaxed">
                  导出的代码可在任意纯净环境直接使用标准 Node.js 运行，没有任何平台绑定，可随时容器化（Docker）部署在您自己的私有服务器、阿里云、腾讯云或 Kubernetes 集群上。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>开源许可：MIT</span>
            <span>·</span>
            <span>版本：v1.0.0</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
          >
            关闭检查
          </button>
        </div>
      </div>
    </div>
  );
};
