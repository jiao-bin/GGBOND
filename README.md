# 生猪全景量化监控雷达 (Hog Quantum Radar) 🐖📊

> **0 成本·全天候生猪期现货多维量化博弈与周期监控雷达**
> 
> 深度整合**大连商品交易所生猪期货全合约实盘**、**全国权威生猪现货均价**、**行业龙头（牧原/温氏/新希望）A 股股票走势**、**涌益微观日度数据 (标肥差/均重/二育)** 以及 **Google Gemini 3.6 Flash 多模态 AI 周期智能诊断**。

---

## 🌟 核心特性与量化模型

### 1. 期现升水率 (Basis & Premium Rate) 模型
- **基差计算公式**：$\text{Basis (元/吨)} = \text{现货价格 (元/吨)} - \text{期货价格 (元/吨)}$
- **升水率计算公式**：$\text{Premium Rate} = \frac{\text{期货价格} - \text{现货折算吨价}}{\text{现货折算吨价}} \times 100\%$
- **风控与套利规则**：
  - **升水率 > +20%**：触发极端投机过热预警，提示盘面虚高、期现大概率收敛（适宜养殖端逢高卖出套保）。
  - **升水率处于 -10% ~ -20% 深度贴水**：反映盘面悲观预期已充分计价，关注近月反弹或现货抗跌机会。

### 2. 微观多因子指标驱动 (涌益咨询日度体系)
- **标肥价差 (大猪 vs 标猪)**：反映终端大猪供需结构。正价差拉大时，养殖户压栏惜售意愿强烈；倒挂（负价差）时，大猪集中抛售，现货短期承压。
- **出栏均重 (Slaughter Weight)**：以 125.0 kg 为关键分水岭，均重上升表明供应后移、远期抛压加剧。
- **二次育肥占比 (Secondary Fattening)**：量化投机补栏热度（>10% 属于二育高度活跃，透支后市消费）。
- **猪粮比价 (Pig-to-Grain Ratio)**：接入发改委三级预警红绿灯标尺（<5.0:1 启动一级收储预警）。

### 3. 龙头股“大阳线抢跑异动”监测
- 实时追踪牧原股份 (002714.SZ) 等养殖龙头。
- 当股票单日涨幅突破 3.5% 且换手率异动放大、而生猪期货/现货尚未显著启动时，自动标记“**股票抢跑异动**”，预警产业聪明资金提前建仓。

### 4. Gemini 3.6 Flash 多模态图表 OCR 与周期诊断
- **涌益行情图表秒级 OCR**：支持直接上传或粘贴涌益咨询日度市场图片/截图，通过多模态 Vision 模型高精度抽取全国外三元均价、各省报价（河南、山东、四川、广东等）、标肥差、均重及屠宰开工率。
- **智能策略生成**：结合当前宏观周期位置、期现结构与微观指标，自动给出养殖企业卖保/买保建议与投机交易头寸管理策略。

### 5. 多通道告警与自动化
- **企业微信 / 钉钉 Webhook 告警**：支持一键配置并推送期现异动至企业交易群。
- **本地高频蜂鸣报警音**：异动触发时即时声响提示。
- **沙盒模拟演练**：非交易时段可一键开启随机扰动沙盒模拟，方便测试各类异动策略。

---

## 🛠️ 项目技术架构

```text
├── index.html                  # 前端 HTML 入口与 Meta 配置
├── server.ts                   # Express 后端服务：数据代理、爬虫、多模型轮询 OCR、Gemini 诊断
├── src/
│   ├── main.tsx                # React 挂载入口
│   ├── App.tsx                 # 主看板：数据轮询调度、沙盒控制、多模态面板
│   ├── types.ts                # 全局 TypeScript 业务类型与指标定义
│   ├── services/
│   │   ├── api.ts              # 后端 API 交互客户端与降级缓存
│   │   ├── ruleEngine.ts       # 量化异动判别引擎与指标打分
│   │   └── audioAlarm.ts       # Web Audio API 报警音效合成器
│   └── components/
│       ├── Header.tsx          # 顶部导航、刷新倒计时、沙盒切换与弹窗入口
│       ├── KeyMetricsGrid.tsx  # 现货、期货、升水率、牧原股票四宫格核心监控
│       ├── BasisGauge.tsx      # 期现升贴水博弈动态标尺与临界指示器
│       ├── YongyiMicroCard.tsx # 涌益微观指标卡（标肥差/均重/二育）
│       ├── SectorPeersCard.tsx # 生猪板块同业对照（温氏/新希望等）与猪粮比价
│       ├── YongyiOcrScanner.tsx# 智能图片/表格 OCR 识别器与数据同步
│       ├── GeminiAnalysisModal # AI 周期智能诊断报告与套保建议
│       ├── FuturesCurveModal   # 生猪期货远近月期限结构 (Contango/Backwardation) 曲线
│       ├── RuleSettingsModal   # 自定义量化阈值与报警规则配置
│       └── WebhookModal        # 企业微信/钉钉 Webhook 机器人告警推送
```

---

## 🚀 本地快速启动指南

### 1. 环境准备
- Node.js 18+ 或 20+
- npm 或 bun / pnpm

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
在项目根目录创建 `.env` 文件：
```env
# 可选：配置 Gemini API Key 以启用 AI 智能分析与图片 OCR 功能
GEMINI_API_KEY=your_gemini_api_key_here
```
> 若未配置 `GEMINI_API_KEY`，系统会自动启用内置经典量化规则算法兜底，基础行情与监控功能 100% 可用。

### 4. 启动开发服务器
```bash
npm run dev
```
开发服务器将自动启动并监听 `http://localhost:3000`。

### 5. 编译构建与生产启动
```bash
# 编译前端及后端单一 CommonJS 包 (dist/server.cjs)
npm run build

# 启动生产服务
npm run start
```

---

## 📡 API 端点说明

| 路径 | 方法 | 功能描述 |
| :--- | :--- | :--- |
| `/api/market-data` | GET | 获取生猪期货全合约、全国现货折算、牧原股价与期现升水率 |
| `/api/futures-contracts` | GET | 获取大商所生猪近月、主力、远月全部合约报价与期限结构 |
| `/api/micro-data/yongyi` | GET | 获取涌益咨询全国及分省微观指标（标肥差、出栏均重、二育占比） |
| `/api/micro-data/ocr-yongyi-image` | POST | 接收图片 Base64，调用 Gemini 3.6 Flash 进行行情数据提取 |
| `/api/gemini/analyze-hog-cycle` | POST | 宏微观数据聚合推理，生成生猪周期深度量化诊断与套保建议 |
| `/api/alerts/webhook/test` | POST | 测试企业微信 / 钉钉机器人 Webhook 告警消息推送 |
| `/api/health` | GET | 后端健康检查与心跳监测 |

---

## 📦 如何导出或下载本应用全部源码

本应用完全开放，您可通过以下方式获取完整源码：
1. **GitHub 导出**：在 Google AI Studio 界面右上角点击 **Settings（设置）** 菜单 -> 选择 **Export to GitHub**，直接将当前项目推送到您自己的 GitHub 代码仓库。
2. **下载 ZIP 压缩包**：在右上角菜单中选择 **Download ZIP**，即可一键下载包含全部前端源码、后端服务、配置文件及依赖声明的完整源码压缩包在本地解压使用。

---

## 📄 开源许可证

本项目遵循 [MIT License](LICENSE) 开源协议。
