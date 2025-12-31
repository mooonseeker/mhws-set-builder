/**
 * 数据导入导出服务
 *
 * 负责将应用数据导出为 JSON 文件，以及从 JSON 文件导入数据。
 */

import type { DataId, DataItem } from "@/types";
import { DATABASE_VERSION } from "@/constants";
import { DataStorage } from "./index";

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
        DataStorage.saveData(payload.dataType as DataId, payload.data)
          .then(() => resolve())
          .catch((err) =>
            reject(err instanceof Error ? err : new Error(String(err))),
          );
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
