# MHWS配装器 (mhws-set-builder) - 技术架构设计文档

## 1. 项目概述

### 1.1 项目目标

MHWS配装器是一个专为《怪物猎人：荒野》(Monster Hunter Wilds)设计的综合配装工具。它旨在通过先进的搜索算法，帮助玩家在海量的防具、武器、装饰品和护石组合中，快速找到满足特定技能需求的最佳装备方案。

### 1.2 核心功能

1. **全装备管理**：涵盖武器、防具、装饰品及护石的完整数据库管理。
2. **双模式配装**：
    - **手动模式**：玩家自由组合装备，实时查看技能统计和孔位状态。
    - **自动模式**：根据用户设定的目标技能，利用智能搜索算法自动生成最优配装方案。
3. **智能搜索算法**：基于骨架搜索 (Scaffold-based Search) 的高效算法，支持复杂技能组合的快速求解。
4. **差分数据存储**：采用 Base Data + Delta 的差分存储架构，既保证了数据的持久化，又极大地减少了 LocalStorage 的占用。
5. **响应式设计**：适配 PC 和移动端，提供流畅的配装体验。

### 1.3 业务规则

- **装备系统**：一套完整的配装包含以下装备 Equipment，1 件武器 Weapon、5 件防具 Armor（头、胸、手、腰、腿）和 1 个护石 Charm。
- **技能系统**：通过装备或装饰品 Accessory 可获得技能。
  - 技能分为武器技能（Weapon）、防具技能（Armor）、系列技能 (Series)及组合技能 (Group) 。
  - 武器技能可由武器、护石以及两者所具备的武器类孔位镶嵌装饰品提供。
  - 防具技能可由防具、护石以及两者所具备的防具类孔位镶嵌装饰品提供。
  - 系列技能及组合技能可由防具提供，DB 1.04 以后防具可提供多个系列或组合技能。
- **孔位系统**：装备拥有不同等级（1-3级）和类型（武器/防具）的孔位 Slot，可镶嵌等级小于或等于孔位等级的装饰品。
- **搜索逻辑**：算法优先保证满足用户设定的核心技能需求，并在此基础上优化剩余孔位或防御力。

---

## 2. 技术栈详细说明

### 2.1 前端框架

- **React 19.2.4 + TypeScript ~5.9.3**
  - 选择理由：组件化开发、强类型支持、生态成熟
  - 使用函数组件 + Hooks 模式
  - 严格的 TypeScript 类型定义

### 2.2 UI框架

- **Tailwind CSS 4.1.18**
  - 选择理由：快速开发、高度可定制、性能优秀
  - 使用 JIT 模式提升开发体验
- **shadcn/ui**
  - 选择理由：基于 Radix UI 的高质量组件库、支持主题定制
  - 主要使用组件：Button, Input, Select, Card, Table, Dialog, Badge 等

### 2.3 状态管理

- **React Context API + useReducer**
  - 选择理由：原生支持、无需额外依赖、适合中等复杂度应用
  - 全局状态包括：技能数据、护石数据、UI 状态、配装器上下文

### 2.4 数据存储与持久化

- **差分存储策略 (Differential Storage)**
  - **Base Data**: 官方提供的只读基础数据（技能、防具、武器、装饰品），从 JSON 文件加载。
  - **Delta Data**: 用户的修改（增、删、改）作为差分数据存储在 `LocalStorage` 中。
  - **DataStorage Service**: 统一管理数据的加载、合并 (Patch) 和保存。
- **导入/导出功能**
  - 支持全量 (Full) 或差分 (Diff) 模式的 JSON 文件导入导出。
  - 自动识别并处理数据迁移。

### 2.5 构建工具

- **Vite 7.3.1**
  - 选择理由：快速的冷启动、热更新、优化的打包。
  - ESM 原生支持。

### 2.6 开发工具

- **ESLint 9.39.2**：代码规范检查。
- **Prettier**：代码格式化。
- **TypeScript Strict Mode**：严格的类型检查。

---

## 3. 项目结构设计

```bash
mhws-set-builder/
├── public/                          # 静态资源
├── scripts/                         # 构建和数据生成脚本
│   ├── generate-database.ts         # 数据库生成脚本
│   └── json2csv/                    # 解包数据处理脚本
├── src/
│   ├── components/                  # React 组件
│   │   ├── charms/                  # 护石管理
│   │   ├── common/                  # 通用组件
│   │   ├── database/                # 数据库管理
│   │   ├── entities/                # 核心实体展示组件 (装备格、技能项)
│   │   ├── layout/                  # 布局组件
│   │   ├── set-builder/             # 配装器核心组件
│   │   ├── settings/                # 设置与数据管理
│   │   └── ui/                      # shadcn/ui 基础组件
│   ├── constants/                   # 全局常量定义
│   ├── contexts/                    # 领域 Context (Armor, Skill, SetBuilder...)
│   ├── data/                        # 初始 CSV 数据
│   ├── hooks/                       # 自定义 Hooks
│   ├── lib/                         # 工具库配置 (utils)
│   ├── services/                    # 核心业务服务
│   │   ├── set-search/              # 搜索算法
│   │   └── storage/                 # 数据持久化与差分存储服务
│   ├── types/                       # TypeScript 类型定义
│   ├── utils/                       # 纯函数工具
│   ├── App.tsx                      # 应用主入口
│   └── main.tsx                     # 渲染入口
├── components.json                  # shadcn/ui 配置
├── package.json                     # 项目依赖
├── vite.config.ts                   # Vite 配置
└── ARCHITECTURE.md                  # 架构文档
```

---

## 4. 数据模型设计

### 4.1 核心领域模型 (src/types/core.ts)

#### 4.1.1 基础类型

- **Skill**: 技能定义，包含 `category` (weapon/armor/series/group)、`maxLevel`、`accessoryLevel` (1-3) 等。
- **SkillWithLevel**: 装备或装饰品上携带的具体技能及等级。
- **Slot**: 孔位定义，包含 `type` (weapon/armor) 和 `level` (1-3)。
- **Accessory**: 装饰品定义，包含 `slotLevel`、`skills`。

#### 4.1.2 装备类型

- **Weapon**: 武器定义，包含 `type`、`attack`、`critical`、`attribute`、`sharpness`、`skills`、`slots`。
- **Armor**: 防具定义，包含 `type` (helm/body/arm/waist/leg)、`skills`、`slots`、`defense`、`resistance`、`series`。
- **Charm**: 护石定义，包含 `skills`、`slots`、以及用于评估的 `equivalentSlots` 和 `keySkillValue`。
- **Equipment**：装备定义，Weapon/Armor/Charm的联合类型。

#### 4.1.3 护石评估与验证类型

- **EquivalentSlots**: 统计护石技能和孔位转换后的等效孔位数量。
- **CharmValidationResult**: 包含验证状态（ACCEPTED/REJECTED_AS_INFERIOR等）、更优护石引用及被完爆护石列表。

### 4.2 配装业务模型 (src/types/set-builder.ts)

#### 4.2.1 配装容器

- **SlottedEquipment**: 泛型容器，将装备 Equipment 与其镶嵌的装饰品 Accessories 关联。

  ```typescript
  interface SlottedEquipment<T> {
    equipment: T;
    accessories: (Accessory | null)[];
  }
  ```

- **EquipmentSet**: 一套完整配装的容器，包含武器、五部位防具、护石。

#### 4.2.2 搜索相关类型

- **CategorizedSkills**: 将目标技能按获取方式分类（系列、组合、仅防具、武器装饰品、防具装饰品）。
- **SearchContext**: 搜索过程中的实时上下文，包含当前装备、当前技能总计、剩余孔位、技能缺口。
- **PreprocessedData**: 预处理后的索引数据，包含技能来源映射、各部位技能潜力 Map、装饰品快速查询表。
- **FinalSet**: 最终生成的配装方案，包含完整的装备组合、装饰品布局和剩余孔位。

---

## 5. 核心算法说明

### 5.1 装备比较与智能判定算法 (Equipment Comparison & Dominance Check)

为了在数据库管理和搜索预处理中高效地过滤冗余装备，项目采用了基于“技能对齐成本”的通用比较算法 (`src/utils/equipment-vs.ts`)。该算法不仅适用于护石，也适用于防具和武器。

#### 5.1.1 核心逻辑：技能缺口对齐判定法

判定装备 A 是否优于 B 的核心准则：**“在补齐 B 拥有但 A 缺失的技能后，A 剩余的资产是否仍不差于 B？”**

1. **类型前置检查**：必须是同类型装备（防具需同部位）。
2. **硬性指标检查 (Hard Skills)**：
    - 对于无法通过装饰品获得的技能（如系列技能），若 B 的等级 > A 的等级，则 A 绝不可能优于 B。
3. **计算技能缺口 (Gap)**：
    - 对所有可通过装饰品获得的技能（Soft Skills），计算 A 相对于 B 的等级缺口。
4. **模拟孔位扣除 (Cost Deduction)**：
    - 尝试使用 A 的孔位填补上述缺口。
    - **匹配规则**：技能类型（武器/防具）决定消耗的孔位类型。
    - **贪心策略**：优先消耗等级最低且满足要求的孔位。
    - 若 A 的孔位不足以填补缺口，则判定为“非上位替代”。
5. **盈余价值判定 (Surplus Value)**：
    - 在对齐技能后，比较 A 的剩余孔位与 B 的原始孔位。
    - 结合特有属性（攻击力、防御力、会心等）进行最终判定。

#### 5.1.2 判定结果分类

- **SUPERIOR (上位)**：A 在所有维度不差于 B，且至少在一个维度（技能、孔位、属性）严格占优。
- **INFERIOR (下位)**：B 优于 A。
- **EQUAL (等效)**：两者属性、技能和孔位完全一致。
- **INCOMPARABLE (互有优劣)**：对齐后仍各有侧重，均需保留。

### 5.2 配装搜索算法：骨架搜索 (Scaffold-based Search)

针对《荒野》复杂的技能系统，采用骨架搜索算法大幅缩小回溯范围。

#### 5.2.1 算法流程概述

1. **数据预处理 (`preprocess.ts`)**：
    - **装备筛选 (`equipment-filter.ts`)**：执行帕累托优化 (Pareto Optimization)，利用 `compareEquipment` 逻辑移除在技能、孔位和防御力上被其他装备“完爆”的劣势防具和护石。
    - **潜力计算**：计算每个防具部位对每个技能的 **理论最大潜力** (自带等级 + 最大孔位转换等级)，用于后续剪枝。
2. **武器技能提前求解 (Phase 1: Pruning - `accessory-solver.ts`)**：
    - **目的**：利用“武器技能”通常只能由武器孔位或护石提供的特性，尽早确定装饰品布局。
    - **策略**：优先使用武器和护石的孔位解决“武器技能”需求。若无法满足则直接剪枝，从而大幅减少后续防具搜索的分支数量。
3. **骨架生成 (`scaffold-generator.ts`)**：
    - **核心逻辑**：针对系列技能 (Series) 和组合技能 (Group)，筛选出必须穿戴的防具组合。
    - 采用递归回溯生成所有可能的“骨架”（部分填充的装备方案）。
4. **回溯填充搜索 (`armor-search.ts`)**：
    - 在骨架的基础上，递归遍历剩余部位的防具。
    - **智能剪枝 (`helpers.ts`)**：实时判断当前分支是否可能满足剩余技能缺口。
5. **装饰品最终求解 (Phase 2: Filling - `accessory-solver.ts`)**：
    - **目的**：当防具组合确定后，计算最终的技能缺口，并利用剩余的所有孔位（武器+防具+护石）进行填充。
    - **策略**：使用回溯算法寻找最优装饰品布局，生成最终的 `FinalSet`。
6. **结果评估与排序 (`result-evaluator.ts`)**：
    - 对生成的方案按孔位价值（权重：3级=4, 2级=2, 1级=1）和冗余技能进行综合评分和排序。

#### 5.2.2 核心剪枝逻辑 (shouldPrune)

```typescript
function shouldPrune(currentSkills, remainingTypes, deficits, preprocessedData, availableSlots): boolean {
  for (const skill of deficits) {
    let potential = 0;
    // 1. 计算剩余部位的最大潜力
    for (const type of remainingTypes) {
      potential += preprocessedData.maxPotentialPerArmorType.get(type)?.get(skill.id) ?? 0;
    }
    
    // 2. 计算当前已有孔位能提供的最大潜力
    potential += calculateMaxSlotPotential(availableSlots, skill.id);
    
    // 3. 如果 (当前值 + 潜力) < 目标值，则剪枝
    if ((currentSkills.get(skill.id) ?? 0) + potential < skill.targetLevel) {
      return true;
    }
  }
  return false;
}
```

#### 5.2.3 装饰品求解优化 (`accessory-solver.ts`)

为了应对装饰品组合的指数级爆炸，求解器引入了多重优化机制：

- **Memoization (记忆化缓存)**：
  - 使用 `solutionCache` 存储已计算的装饰品组合。
  - **Cache Key**：由“排序后的技能缺口”和“抽象化的剩余孔位分布”生成。这确保了在不同的防具组合下，如果遇到相同的技能需求和孔位条件，可以直接复用计算结果。
- **Fail-Fast 排序策略**：
  - 对技能缺口进行智能排序，优先处理“限制最严格”的技能（如只能由特定高级孔位提供的技能，或只有极少数装饰品支持的技能）。这使得回溯算法能在早期快速失败（Pruning），避免无效搜索。

### 5.3 结果评估与排序 (`result-evaluator.ts`)

生成的配装方案会根据以下标准进行自动排序：

1. **剩余孔位价值**：优先展示拥有更多或更高等级剩余孔位的方案。
2. **关键技能溢出控制**：在孔位价值相同的情况下，优先选择额外携带的有用技能（Key Skills）较少的方案，以追求配装的精准度。

### 5.4 Search Service Facade & Web Worker

为了保证 UI 的流畅性并隔离复杂性，项目采用了 **Facade (门面) 模式** 结合 **Web Worker** 的架构。

- **Service Facade (`services/set-search/index.ts`)**:
  - 对外提供统一的 `findOptimalSets` 异步接口。
  - 内部封装了 Worker 的生命周期管理、Promise 包装、错误处理及任务取消 (Cancellation) 逻辑。
  - 使得上层 UI 组件无需关心底层的多线程实现细节。
- **Search Worker (`search.worker.ts`)**:
  - 接收主线程的搜索请求（包含技能需求、固定装备、全量数据）。
  - 在后台线程执行 `findOptimalSets` 算法。
  - 通过 `postMessage` 实时向主线程发送进度更新 (`progress`) 和最终结果 (`success`/`error`)。

---

## 6. 组件架构设计

### 6.1 组件层级图

```mermaid
graph TD
    A[App] --> B[MainLayout]
    B --> C[Navigation]
    B --> E[Main Content Area]

    E --> F[SetBuilder]
    E --> G[DatabaseManager]
    E --> H[CharmManager]
    E --> I[Settings]

    F --> F1[SkillRequirements]
    F --> F2[EquipmentCell]
    F --> F3[SearchResultsView]

    G --> G1[SkillList]
    G --> G2[ArmorList]
    G --> G3[WeaponList]
    G --> G4[AccessoryList]

    F2 --> J[EquipmentSelector]
    F2 --> K[AccessorySelector]
```

### 6.2 核心组件职责

- **DatabaseManager**: 统一管理技能、防具、武器和装饰品的查看与编辑。
- **CharmManager**: 专门的护石管理界面，支持护石的智能判定与评估。
- **SetBuilder**: 配装器核心界面，负责管理用户当前的技能需求和装备选择。
- **EquipmentCell**: 装备单元格，展示已选装备、孔位及装饰品，并触发选择器。
- **EquipmentSelector**: 通用选择器组件，用于从数据库中筛选并选择特定部位的装备。
- **SearchResultsView**: 展示自动配装算法生成的 `FinalSet` 列表，支持方案预览和应用。

---

## 7. 数据流设计

### 7.1 状态管理架构

项目采用多层级的 React Context 进行领域驱动的状态管理：

- **全局 Context**: `AppContext` (配置), `ThemeContext`.
- **领域 Context**:
  - `SkillContext`, `ArmorContext`, `WeaponContext`, `AccessoryContext`, `CharmContext`: 负责各自领域数据的 CRUD 及持久化。
  - `SetBuilderContext`: 核心业务 Context，管理配装模式（手动/自动）、用户需求、当前选择的 `EquipmentSet` 以及搜索结果。

### 7.2 核心业务流：自动配装

```mermaid
sequenceDiagram
    participant User
    participant SetBuilder
    participant SetBuilderContext
    participant SearchService
    participant SearchResultsView

    User->>SetBuilder: 设定目标技能
    SetBuilder->>SetBuilderContext: 更新需求 (requiredSkills)
    User->>SetBuilder: 点击"开始自动配装"
    SetBuilderContext->>SearchService: 调用 findOptimalSets(requiredSkills, fixedEquipment)
    SearchService->>SearchService: 执行骨架搜索算法
    SearchService-->>SetBuilderContext: 返回 FinalSet[]
    SetBuilderContext->>SearchResultsView: 渲染搜索结果
    User->>SearchResultsView: 选择并应用方案
    SearchResultsView->>SetBuilderContext: 更新当前 EquipmentSet
```

### 7.3 数据生命周期与初始化 (Data Lifecycle)

应用的数据流遵循 **Load -> Hydrate -> Interaction -> Persist** 的闭环：

1. **Bootstrapping (引导)**: 应用启动时，各个 Domain Context (如 `ArmorProvider`) 挂载。
2. **Storage Loading**: `DataStorage` 服务并行加载两份数据：
    - **Base Data**: 从 `/public/data/*.json` 读取静态只读数据。
    - **Delta Data**: 从 `LocalStorage` 读取用户的自定义修改（如新增的护石、修改过的装备属性）。
3. **Patching & Hydration**: `DataStorage` 将 Delta 应用于 Base Data，生成运行时的全量数据集，并注入到 React Context 中供 UI 使用。
4. **Runtime Mutation**: 用户在 UI 中的操作（如添加护石）会更新 Context 中的状态，并同步触发 `DataStorage` 将新的差分数据写入 `LocalStorage`。

---

## 8. 扩展性与维护

### 8.1 预留的扩展接口

- **多语言支持 (i18n)**：架构设计上预留了加载不同语言包的能力。
- **云端同步**：`DataStorage` 服务预留了对接云端 API 的接口，未来可支持配装方案云备份。

### 8.2 数据维护

- **脚本化更新**：通过 `scripts/generate-database.ts` 可快速从 CSV 源文件重新生成基础数据库 JSON，便于应对游戏版本更新。
- **版本迁移**：`DataStorage` 服务内置了版本检测与迁移逻辑，确保用户数据在应用升级时的平滑过渡。
