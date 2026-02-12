# 🐉 MHWS 配装器 (MHWS Set Builder)

[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.5.6-orange)](package.json)

**MHWS 配装器** 是一款专为《怪物猎人：荒野》(Monster Hunter Wilds) 打造的全功能配装系统。它结合了 **多阶段骨架搜索算法** 与直观的 UI 界面，旨在帮助猎人根据技能需求快速找到最优解。

---

## ✨ 核心功能

### 🚀 双模式配装器 (Set Builder)

- **手动/自动模式**：支持手动配装及自动搜索配装，汇总反馈全身技能信息。
- **多维度约束**：自动搜索支持自定义护石、锁定特定装备、设定目标技能等级等多种搜索条件。
- **多阶段搜索**：针对《怪物猎人：荒野》中的技能设计（系列/组合技能、武器技能、防具技能），将搜索分解为预处理、武器技能求解、防具骨架生成、防具回溯填充及装饰品最终求解五个阶段。
- **结果预览**：实时生成并展示多种配装方案，包含技能总计、剩余孔位及防御性能。

### 💎 护石管理器 (Charm Manager)

- **护石管理**：支持护石的记录、整理及展示，支持上下位验证。
- **技能对齐判定法 (Skill Alignment)**：上下位判定的核心逻辑——“在消耗孔位补齐 B 拥有但 A 缺失的技能后，A 剩余的资产是否仍占优？”
- **智能判定**：识别并分类判定结果（上位、下位、等效、互有优劣），自动标记冗余护石。
- **等效孔位计算**：将护石技能自动换算为对应等级的孔位，统一评估标准。

### 🛡️ 全装备数据库管理 (Database)

- **差分数据存储 (Differential Storage)**：采用 `Base Data + Delta` 架构。
  - **Base Data**: 官方基础数据（技能、装饰品、防具、武器、护石），由 CSV 脚本静态生成。
  - **Delta Data**: 用户自定义修改（新增自定义护石、调整装备属性等）以差分形式持久化于 `LocalStorage`。

### 📊 数据管理与交互

- **导入/导出**：支持 JSON 格式完整备份（全量/差分模式），方便跨设备同步。
- **响应式设计**：完美适配 PC 与移动端，随时随地调整配装。

---

## 🛠️ 技术栈

- **核心框架**: [`React 19.2.4`](https://react.dev/) + [`TypeScript 5.9.3`](https://www.typescriptlang.org/)
- **UI 方案**: [`Tailwind CSS 4.1.18`](https://tailwindcss.com/) + [`shadcn/ui`](https://ui.shadcn.com/) (基于 Radix UI)
- **状态管理**: 基于 Context API + `useReducer` 的领域驱动设计
- **构建工具**: [`Vite 7.3.1`](https://vitejs.dev/)
- **性能优化**: Web Worker (搜索算法离线化) + Zod 校验

---

## 📂 项目结构

```bash
src/
├── components/          # React 组件 (配装器、护石管理、UI 基础库)
├── contexts/            # 领域驱动的状态管理中心
├── hooks/               # 业务逻辑封装与自定义 Hooks
├── services/            
│   ├── set-search/      # 配装搜索实现
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

### 2. 生成数据库

本项目内置便于存储的 CSV 数据库，每次运行前转换为 JSON 格式数据库

```bash
npm run generate
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
```

---

## 🧠 核心算法逻辑

### 1. 骨架搜索 (Scaffold-based Search)

- **阶段 1：预处理**：计算防具部位技能潜力，执行帕累托过滤。
- **阶段 2：武器技能求解**：利用护石与武器孔位优先满足武器技能，无法满足时直接剪枝。
- **阶段 3：防具骨架生成**：针对系列/组合技能生成必需的装备组合框架。
- **阶段 4：防具回溯填充**：在框架基础上，结合实时潜力剪枝完成全部位搜索。
- **阶段 5：装饰品求解**：应用记忆化搜索寻找最优孔位布局。

### 2. 技能缺口对齐判定 (Gap Alignment)

用于判定装备 A 是否优于装备 B 的核心准则：

1. 检查无法通过孔位补齐的硬性指标（如系列技能）。
2. 计算 A 对 B 的技能等级缺口。
3. 尝试用 A 的孔位填补缺口（遵循武器/防具孔位匹配逻辑）。
4. 比较填补后的剩余孔位价值与基础属性（防御、会心等）。

---

## 🤝 贡献与反馈

欢迎通过提交 Issue 或 Pull Request 来改进算法或修复数据。

- **算法建议**：请参考 `ARCHITECTURE.md` 中的算法详细说明，提出修改意见。
- **数据更新**：本项目数据源来自于 dtlnor 大佬的解包数据：[MHWs-in-json](https://github.com/dtlnor/MHWs-in-json)，如有纰漏，欢迎指正。

---

## 📄 开源协议

基于 [MIT License](LICENSE) 开源。
