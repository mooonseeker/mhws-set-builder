/**
 * MHWS护石管理器 - 通用数据IO工具
 *
 * 提供与具体数据类型无关的、统一的数据导入、导出和验证功能。
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
 * 统一的验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
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

/**
 * 验证数据库数据与初始数据的一致性
 *
 * @param currentData - 当前应用内的数据
 * @param initialData - 从JSON文件加载的初始数据
 * @returns 验证结果
 */
export function validateData(
  currentData: DataItem[],
  initialData: DataItem[],
): ValidationResult {
  const errors: string[] = [];

  // 1. 检查数量是否一致
  if (currentData.length !== initialData.length) {
    errors.push(
      `数量不匹配：当前 ${currentData.length} 个, 初始 ${initialData.length} 个`,
    );
  }

  // 2. 创建初始数据的ID映射以便快速查找
  const initialDataMap = new Map<string, DataItem>(
    initialData.map((item) => [item.id, item]),
  );

  // 3. 检查当前数据中的每一项
  currentData.forEach((currentItem) => {
    const initialItem = initialDataMap.get(currentItem.id);

    if (!initialItem) {
      errors.push(`ID为 "${currentItem.id}" 的项目在初始数据中不存在`);
      return;
    }

    // 深度比较所有属性
    const itemKeys = Object.keys(currentItem);
    for (const key of itemKeys) {
      // 深比较，处理对象和数组
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (
        JSON.stringify((currentItem as any)[key]) !==
        JSON.stringify((initialItem as any)[key])
      ) {
        errors.push(
          `ID为 "${currentItem.id}" 的项目属性 "${String(key)}" 不匹配`,
        );
      }
    }
  });

  // 4. 反向检查：确保所有初始数据都存在于当前数据中
  initialData.forEach((initialItem) => {
    if (!currentData.some((item) => item.id === initialItem.id)) {
      errors.push(`初始项目 "${initialItem.id}" 在当前数据中不存在`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
