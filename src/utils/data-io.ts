/**
 * MHWS护石管理器 - 通用数据IO工具
 *
 * 提供与具体数据类型无关的、统一的数据对比和验证功能。
 */
import type { DataItem } from "@/types";

/**
 * 数据迁移统计信息
 * 描述了将本地数据迁移到官方版本时发生的变化
 */
export interface MigrationStats {
  mergedData: DataItem[];
  // 官方新增的条目数（本地没有，从官方数据添加）
  officialAdded: number;
  // 官方更新的条目数（本地有但不同，被官方数据覆盖）
  officialUpdated: number;
  // 用户保留的条目ID列表（官方没有，本地保留）
  userRetainedIds: string[];
}

/**
 * 数据验证结果
 * 描述了当前本地数据与官方标准数据的差异
 */
export interface ValidationResult {
  isValid: boolean;
  // 缺失的官方条目数
  missingOfficial: number;
  // 与官方不一致的条目数
  mismatched: number;
  // 用户私有的额外条目数
  userPrivate: number;
  // 详细的错误/差异描述
  errors: string[];
}

/**
 * 描述一组数据相对于其基准版本的变化。
 * T 必须是包含 `id: string` 的对象类型。
 */
export interface DataDelta<T extends { id: string }> {
  /**
   * 新增的条目。
   * 这些是不存在于基准数据中的全新条目。
   */
  added: T[];

  /**
   * 被修改的条目。
   * 这些条目的 `id` 存在于基准数据中，但内容已发生变化。
   * 我们存储完整的对象以简化 Patch 逻辑。
   */
  modified: T[];

  /**
   * 被删除的条目ID。
   * 这些条目的 `id` 存在于基准数据中，但已被用户删除。
   * 只存储 ID 以节省空间。
   */
  deleted: string[];
}

/**
 * Diff 算法: 对比基准数据和当前数据，生成 DataDelta 对象。
 *
 * @param baseData - 基准数据数组
 * @param currentData - 当前数据数组
 * @returns DataDelta<T> - 描述变化的差异对象
 */
export function createDiff<T extends { id: string }>(
  baseData: T[],
  currentData: T[],
): DataDelta<T> {
  const baseMap = new Map(baseData.map((item) => [item.id, item]));
  const currentMap = new Map(currentData.map((item) => [item.id, item]));

  const added: T[] = [];
  const modified: T[] = [];
  const deleted: string[] = [];

  // 遍历当前数据，查找新增和修改项
  for (const currentItem of currentData) {
    const baseItem = baseMap.get(currentItem.id);
    if (!baseItem) {
      // 在基准数据中不存在 -> 新增
      added.push(currentItem);
    } else if (JSON.stringify(currentItem) !== JSON.stringify(baseItem)) {
      // 存在但内容不同 -> 修改
      modified.push(currentItem);
    }
  }

  // 遍历基准数据，查找删除项
  for (const baseItem of baseData) {
    if (!currentMap.has(baseItem.id)) {
      // 在当前数据中不存在 -> 删除
      deleted.push(baseItem.id);
    }
  }

  return { added, modified, deleted };
}

/**
 * Patch 算法: 将 DataDelta 应用于基准数据，生成合并后的完整数据。
 *
 * @param baseData - 基准数据数组
 * @param delta - 描述变化的差异对象
 * @returns T[] - 合并后的完整数据数组
 */
export function patch<T extends { id: string }>(
  baseData: T[],
  delta: DataDelta<T>,
): T[] {
  // 1. 从基准数据开始
  const patchedMap = new Map(baseData.map((item) => [item.id, item]));

  // 2. 应用删除
  for (const id of delta.deleted) {
    patchedMap.delete(id);
  }

  // 3. 应用修改
  for (const item of delta.modified) {
    patchedMap.set(item.id, item);
  }

  // 4. 应用新增
  for (const item of delta.added) {
    patchedMap.set(item.id, item);
  }

  return Array.from(patchedMap.values());
}

/**
 * 核心数据对比与合并函数 (Reconcile)
 *
 * 逻辑：
 * 1. 官方数据 (officialData) 具有最高优先级：官方新增或修改的条目将直接采用。
 * 2. 用户私有数据 (仅在 currentData 中存在) 将被保留。
 * 3. 稳定性假设：条目 ID 在跨版本间是稳定不变的。
 *
 * @param currentData - 当前本地存储的数据
 * @param officialData - 官方最新的初始数据
 * @returns 迁移统计信息 (包含合并后的最终数据)
 */
export function reconcileData(
  currentData: DataItem[],
  officialData: DataItem[],
): MigrationStats {
  const currentMap = new Map(currentData.map((item) => [item.id, item]));
  const officialMap = new Map(officialData.map((item) => [item.id, item]));

  // 默认包含所有官方数据（这涵盖了“官方新增”和“官方更新”的情况）
  const mergedData: DataItem[] = [...officialData];

  let officialAdded = 0;
  let officialUpdated = 0;
  const userRetainedIds: string[] = [];

  // 1. 统计官方数据的变化
  officialData.forEach((officialItem) => {
    const currentItem = currentMap.get(officialItem.id);

    if (!currentItem) {
      // 本地不存在，视为官方新增
      officialAdded++;
    } else if (JSON.stringify(currentItem) !== JSON.stringify(officialItem)) {
      // 本地存在但内容不同，视为官方更新
      officialUpdated++;
    }
  });

  // 2. 处理用户私有数据
  currentData.forEach((currentItem) => {
    // 如果官方数据中没有这个ID，说明是用户私有数据，需要保留
    if (!officialMap.has(currentItem.id)) {
      mergedData.push(currentItem);
      userRetainedIds.push(currentItem.id);
    }
  });

  return {
    mergedData,
    officialAdded,
    officialUpdated,
    userRetainedIds,
  };
}

/**
 * 验证数据库数据与初始数据的一致性
 *
 * 复用 reconcileData 的逻辑，但从“验证”的角度解释结果：
 * - officialAdded -> 缺失官方数据
 * - officialUpdated -> 数据不匹配
 * - userRetainedIds -> 包含非官方数据
 *
 * @param currentData - 当前应用内的数据
 * @param initialData - 从JSON文件加载的初始数据
 * @returns 验证结果
 */
export function validateData(
  currentData: DataItem[],
  initialData: DataItem[],
): ValidationResult {
  const stats = reconcileData(currentData, initialData);

  const errors: string[] = [];
  if (stats.officialAdded > 0) {
    errors.push(`缺失官方数据: ${stats.officialAdded} 条`);
  }
  if (stats.officialUpdated > 0) {
    errors.push(`与官方数据不一致: ${stats.officialUpdated} 条`);
  }
  if (stats.userRetainedIds.length > 0) {
    errors.push(`包含非官方(用户)数据: ${stats.userRetainedIds.length} 条`);
  }

  return {
    isValid:
      stats.officialAdded === 0 &&
      stats.officialUpdated === 0 &&
      stats.userRetainedIds.length === 0,
    missingOfficial: stats.officialAdded,
    mismatched: stats.officialUpdated,
    userPrivate: stats.userRetainedIds.length,
    errors,
  };
}
