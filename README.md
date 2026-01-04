# 🐉 MHWS 配装器 (MHWS Set Builder)

[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**MHWS 配装器** 是一款专为《怪物猎人：荒野》(Monster Hunter Wilds) 打造的全功能配装系统。它结合了强大的 **骨架搜索算法** 与直观的 UI 界面，旨在帮助猎人们在海量的装备组合中快速找到最优解。

---

## ✨ 核心功能

### 🚀 智能自动配装

- **骨架搜索算法 (Scaffold-based Search)**：针对《荒野》复杂的系列技能与组合技能进行深度优化，通过骨架生成与智能剪枝技术，秒级完成海量组合搜索。
- **多维度约束**：支持固定特定装备、设定目标技能等级、指定武器孔位等多种搜索条件。
- **结果预览**：实时生成并展示多种配装方案，包含技能总计、剩余孔位及防御性能。

### 🛡️ 全装备数据库管理

- **完整覆盖**：内置武器、防具（头、胸、手、腰、腿）、装饰品及护石的完整数据。
- **自动加载**：系统启动时自动解析官方 CSV 数据，确保数据与游戏同步。
- **手动配装模式**：支持自由组合装备，实时查看属性变化，适合精细化微调。

### 💎 护石智能评估系统

- **等效孔位计算**：将护石技能自动换算为对应等级的孔位，统一评估标准。
- **智能判定 (完爆检查)**：添加新护石时自动执行 Dominance Check，识别并建议清理被现有护石“完爆”的劣质品。
- **核心价值评分**：基于核心技能与孔位权重的综合评分系统，助你快速锁定极品护石。

### 📊 数据管理与交互

- **导入/导出**：支持 JSON 格式完整备份，方便跨设备同步。
- **CSV 导出**：支持将护石数据导出为 CSV，方便使用 Excel 进行离线分析。
- **响应式设计**：完美适配 PC 与移动端，随时随地调整配装。

---

## 🛠️ 技术栈

- **核心框架**: [`React 19.2.3`](https://react.dev/) + [`TypeScript 5.9.3`](https://www.typescriptlang.org/)
- **样式方案**: [`Tailwind CSS 4.1.18`](https://tailwindcss.com/)
- **UI 组件**: [`shadcn/ui`](https://ui.shadcn.com/) (基于 Radix UI)
- **构建工具**: [`Vite 7.3.0`](https://vitejs.dev/)
- **状态管理**: React Context API + `useReducer`
- **本地存储**: LocalStorage (100% 本地运行，保护隐私)

---

## 📂 项目结构

```bash
src/
├── components/          # React 组件 (配装器、护石管理、UI 基础库)
├── contexts/            # 领域驱动的状态管理中心
├── hooks/               # 业务逻辑封装与自定义 Hooks
├── services/            
│   ├── set-search/      # 核心算法：v7.2 骨架搜索实现
│   └── storage/         # 数据持久化与导入导出服务
├── types/               # 严格的 TypeScript 类型定义
├── utils/               # 核心算法工具 (护石计算、数据解析)
└── data/                # 初始官方 CSV 数据源
```

---

## ⚡ 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 生成数据库并启动开发服务器

```bash
# 脚本会自动解析 src/data 中的 CSV 并生成本地数据库索引
npm run dev
```

### 3. 构建生产版本

```bash
npm run build
```

---

## 🤝 贡献与反馈

欢迎通过提交 Issue 或 Pull Request 来改进算法或修复数据。

- **算法建议**：如果你有更高效的剪枝思路，请参考 `ARCHITECTURE.md` 中的算法说明。
- **数据更新**：数据源位于 `src/data/*.csv`。

---

## 📄 开��协议

基于 [MIT License](LICENSE) 开源。
