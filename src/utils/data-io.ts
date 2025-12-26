/**
 * MHWS护石管理器 - 通用数据IO工具
 *
 * 提供与具体数据类型无关的、统一的数据导入、导出、对比和验证功能。
 */
import type { DataId, DataItem } from "@/types";
import { DataStorage } from "@/services/DataStorage";
import { DATABASE_VERSION } from "@/types/constants";

/**
 * 统一的导出数据结构
 */
export interface ExportPayload {
  version: string;
  exportedAt: string;
  dataType: DataId | "all";
  data: DataItem[];
}

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
export interface VerificationResult {
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
): VerificationResult {
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

/**
 * 将任何类型的数据导出为JSON文件
 *
 * @param id - 要导出的数据ID
 */
export function exportData(id: DataId): void {
  const data = DataStorage.loadData(id);
  const payload: ExportPayload = {
    version: DATABASE_VERSION,
    exportedAt: new Date().toISOString(),
    dataType: id,
    data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  // 根据数据类型生成文件名
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `mhws-charms-${id}-${dateStr}.json`;

  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 从JSON文件导入数据，并进行基础验证
 *
 * @param file - 要导入的JSON文件
 * @throws 当文件读取失败或格式不正确时抛出错误
 */
export async function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const payload = JSON.parse(content) as ExportPayload;

        // 基础结构验证
        if (
          !payload.version ||
          !payload.dataType ||
          !Array.isArray(payload.data)
        ) {
          throw new Error(
            "无效的数据结构: 缺少 version, dataType 或 data 字段",
          );
        }

        // 将数据保存到 DataStorage
        DataStorage.saveData(payload.dataType as DataId, payload.data);
        resolve();
      } catch (error) {
        reject(
          new Error(
            `导入失败：文件格式不正确或内容无效。(${error instanceof Error ? error.message : String(error)})`,
          ),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("读取文件失败"));
    };

    reader.readAsText(file);
  });
}
