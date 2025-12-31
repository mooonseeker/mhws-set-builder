/**
 * MHWS护石管理器 - 统一数据存储服务
 *
 * 这是应用的核心数据持久化服务，负责：
 * - 应用启动时的版本检查和数据迁移
 * - 所有数据的加载和保存
 * - localStorage 的统一管理
 *
 * @module DataStorage
 */

import type { DataId, DataItem, AppSettings } from "@/types";
import { ALL_DATA_IDS } from "@/types";
import {
  DATABASE_VERSION,
  DATABASE_VERSION_KEY,
  DEFAULT_ARMOR_SERIES_PER_PAGE,
  DEFAULT_CHARMS_PER_PAGE,
  DEFAULT_SKILLS_PER_PAGE,
  DEFAULT_ACCESSORIES_PER_PAGE,
  STORAGE_KEYS,
  STORAGE_KEYS_DELTA,
} from "@/constants";
import {
  type MigrationStats,
  createDiff,
  patch,
  type DataDelta,
} from "@/utils/data-io";

// 定义需要进行差异化存储的数据类型
const DIFFERENTIAL_DATA_IDS = ALL_DATA_IDS.filter((id) => id !== "settings");

const EMPTY_DELTA: DataDelta<DataItem> = {
  added: [],
  modified: [],
  deleted: [],
};

/**
 * DataStorage 类
 *
 * 单例模式，管理应用所有持久化数据
 */
class DataStorageService {
  /**
   * 内部数据缓存
   * 在 initialize() 后，所有数据都会被加载到这里
   */
  private dataCache: Map<DataId, DataItem[]> = new Map<DataId, DataItem[]>();

  /**
   * 迁移报告缓存
   * 存储最近一次迁移的统计信息，供 UI 展示
   */
  private migrationReport: Map<DataId, MigrationStats> | null = null;

  /**
   * 初始化状态标记
   */
  private initialized = false;

  /**
   * 初始化 DataStorage
   *
   * 此方法应在应用启动时调用，在任何 Context 初始化之前完成。
   * 它会执行以下操作：
   * 1. 检查 localStorage 中的版本号
   * 2. 如果是新用户或版本不匹配，加载初始数据或执行迁移
   * 3. 将所有数据加载到内存缓存中
   *
   * @returns Promise<void>
   * @throws {Error} 如果初始化失败
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn("DataStorage already initialized");
      return;
    }

    try {
      console.log("[DataStorage] 开始初始化...");

      const storedVersion = this.getStoredVersion();

      if (storedVersion === DATABASE_VERSION) {
        // 版本匹配，加载差异化数据
        console.log("[DataStorage] 版本匹配，加载现有数据");
        await this.loadDifferentialData();
      } else if (storedVersion === null) {
        // 新用户，加载初始数据
        console.log("[DataStorage] 新用户，加载初始数据");
        await this.loadInitialData();
      } else {
        // 版本不匹配，执行迁移
        console.log(
          `[DataStorage] 版本升级: ${storedVersion} -> ${DATABASE_VERSION}`,
        );
        await this.migrateToDifferential(storedVersion);
      }

      // 更新版本号
      this.setStoredVersion(DATABASE_VERSION);

      this.initialized = true;
      console.log("[DataStorage] 初始化完成");
    } catch (error) {
      console.error("[DataStorage] 初始化失败:", error);
      throw new Error("数据存储初始化失败");
    }
  }

  /**
   * 加载指定类型的数据
   *
   * @param id - 数据类型ID
   * @returns 数据数组
   */
  loadData<T extends DataItem>(id: DataId): T[] {
    if (!this.initialized) {
      throw new Error("DataStorage not initialized. Call initialize() first.");
    }

    const data = this.dataCache.get(id);
    return (data ?? []) as T[];
  }

  /**
   * 保存指定类型的数据
   *
   * @param id - 数据类型ID
   * @param data - 要保存的数据
   */
  async saveData<T extends DataItem>(id: DataId, data: T[]): Promise<void> {
    if (!this.initialized) {
      throw new Error("DataStorage not initialized. Call initialize() first.");
    }

    try {
      // 1. 更新内存缓存
      this.dataCache.set(id, data);

      // 2. 根据数据类型执行不同保存策略
      if (id === "settings") {
        // 对于设置，执行全量保存
        const key = STORAGE_KEYS.settings;
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`[DataStorage] 已全量保存 ${id}`);
      } else {
        // 对于其他数据，执行差异化保存
        // 2a. 加载基准数据
        const baseData = await this.loadBaseDataForType(id);

        // 2b. 计算差异
        const delta = createDiff(baseData, data);

        // 2c. 持久化差异到 localStorage
        const deltaKey = STORAGE_KEYS_DELTA[id];
        localStorage.setItem(deltaKey, JSON.stringify(delta));
        console.log(`[DataStorage] 已差异化保存 ${id}:`, {
          added: delta.added.length,
          modified: delta.modified.length,
          deleted: delta.deleted.length,
        });
      }
    } catch (error) {
      console.error(`[DataStorage] 保存 ${id} 失败:`, error);
      throw new Error(`保存 ${id} 数据失败`);
    }
  }

  /**
   * 重置指定类型的数据到初始状态
   *
   * @param id - 数据类型ID
   */
  public async resetData(id: DataId): Promise<void> {
    if (!this.initialized) {
      throw new Error("DataStorage not initialized. Call initialize() first.");
    }

    try {
      console.log(`[DataStorage] 重置 ${id} 数据到初始状态`);
      await this.loadInitialDataForType(id);
      console.log(`[DataStorage] ${id} 数据重置完成`);
    } catch (error) {
      console.error(`[DataStorage] 重置 ${id} 数据失败:`, error);
      throw new Error(`重置 ${id} 数据失败`);
    }
  }

  /**
   * 清除所有存储数据
   */
  clearAll(): void {
    console.log("[DataStorage] 清除所有数据");

    // 清除 localStorage
    // 清除全量和差异数据
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    Object.values(STORAGE_KEYS_DELTA).forEach((key) =>
      localStorage.removeItem(key),
    );
    localStorage.removeItem(DATABASE_VERSION_KEY);

    // 清除内存缓存
    this.dataCache.clear();
    this.initialized = false;
  }

  /**
   * 获取并清除迁移报告
   *
   * @returns 迁移报告（如果有），否则返回 null
   */
  getAndClearMigrationReport(): Map<DataId, MigrationStats> | null {
    const report = this.migrationReport;
    this.migrationReport = null;
    return report;
  }

  /**
   * 加载差异化数据（版本匹配时调用）
   */
  private async loadDifferentialData(): Promise<void> {
    // 1. 全量加载设置
    await this.loadInitialDataForType("settings");

    // 2. 差异化加载其他数据
    for (const id of DIFFERENTIAL_DATA_IDS) {
      // 2a. 加载基准数据
      const baseData = await this.loadBaseDataForType(id);

      // 2b. 加载差异数据
      const deltaKey = STORAGE_KEYS_DELTA[id];
      const storedDelta = localStorage.getItem(deltaKey);
      const delta = storedDelta
        ? (JSON.parse(storedDelta) as DataDelta<DataItem>)
        : EMPTY_DELTA;

      // 2c. 应用 Patch 生成完整数据
      const fullData = patch(baseData, delta);
      this.dataCache.set(id, fullData);

      console.log(
        `[DataStorage] 已加载 ${id} (差异化):`,
        fullData.length,
        "条",
      );
    }
  }

  /**
   * 加载所有初始数据
   */
  private async loadInitialData(): Promise<void> {
    for (const id of ALL_DATA_IDS) {
      await this.loadInitialDataForType(id);
    }
  }

  /**
   * 加载指定类型的初始数据
   */
  private async loadInitialDataForType(id: DataId): Promise<void> {
    if (id === "settings") {
      // 设置数据使用默认值初始化并全量保存
      const key = STORAGE_KEYS.settings;
      const stored = localStorage.getItem(key);
      let settings: AppSettings[];
      if (stored) {
        settings = JSON.parse(stored) as AppSettings[];
      } else {
        settings = [
          {
            id: "app-settings",
            enableLimitBreak: false,
            skillsPerPage: DEFAULT_SKILLS_PER_PAGE,
            armorSeriesPerPage: DEFAULT_ARMOR_SERIES_PER_PAGE,
            charmsPerPage: DEFAULT_CHARMS_PER_PAGE,
            accessoriesPerPage: DEFAULT_ACCESSORIES_PER_PAGE,
          },
        ];
        localStorage.setItem(key, JSON.stringify(settings));
      }
      this.dataCache.set("settings", settings);
      console.log("[DataStorage] 已加载设置数据");
      return;
    }

    // 对于差异化数据类型，加载基准数据并保存一个空的 delta
    const baseData = await this.loadBaseDataForType(id);
    this.dataCache.set(id, baseData);

    const deltaKey = STORAGE_KEYS_DELTA[id];
    localStorage.setItem(deltaKey, JSON.stringify(EMPTY_DELTA));

    console.log(`[DataStorage] 已加载初始 ${id}:`, baseData.length, "条记录");
  }

  /**
   * 迁移到差异化存储（一次性）
   */
  private async migrateToDifferential(oldVersion: string): Promise<void> {
    console.log(
      `[DataStorage] 执行到差异化存储的迁移: ${oldVersion} -> ${DATABASE_VERSION}`,
    );

    try {
      // 1. 迁移/加载设置
      await this.loadInitialDataForType("settings");

      // 2. 迁移其他数据类型
      for (const id of DIFFERENTIAL_DATA_IDS) {
        // 2a. 加载旧的全量数据
        const oldKey = STORAGE_KEYS[id];
        const oldStoredData = localStorage.getItem(oldKey);
        const oldFullData = oldStoredData
          ? (JSON.parse(oldStoredData) as DataItem[])
          : [];

        // 2b. 加载新的基准数据
        const newBaseData = await this.loadBaseDataForType(id);

        // 2c. 计算差异
        const delta = createDiff(newBaseData, oldFullData);

        // 2d. 保存新的差异数据
        const deltaKey = STORAGE_KEYS_DELTA[id];
        localStorage.setItem(deltaKey, JSON.stringify(delta));

        // 2e. 将合并后的数据加载到缓存
        const mergedData = patch(newBaseData, delta);
        this.dataCache.set(id, mergedData);

        // 2f. [重要] 删除旧的全量数据
        localStorage.removeItem(oldKey);

        console.log(`[DataStorage] ${id} 已成功迁移到差异化存储`);
      }
      console.log("[DataStorage] 数据迁移完成");
    } catch (error) {
      console.error("[DataStorage] 数据迁移失败:", error);
      // 迁移失败时回退，清空所有内容并加载初始数据
      console.log("[DataStorage] 迁移失败，回退到加载初始数据");
      this.clearAll();
      await this.loadInitialData();
    }
  }

  /**
   * 加载指定类型的基准数据
   */
  private async loadBaseDataForType(id: DataId): Promise<DataItem[]> {
    // `settings` 没有基准数据文件
    if (id === "settings") return [];

    try {
      // 注意：这里需要调整 import 路径，因为文件位置变了
      // 从 src/services/storage/index.ts 到 src/data/initial-xxx.json
      // 需要向上跳两级: ../../data/
      const module = (await import(`../../data/initial-${id}.json`)) as {
        default: Record<string, unknown[]>;
      };
      return (module.default[id] ?? []) as DataItem[];
    } catch (error) {
      console.error(`[DataStorage] 加载基准 ${id} 数据失败:`, error);
      return []; // 加载失败时返回空数组
    }
  }

  /**
   * 获取存储的版本号
   */
  private getStoredVersion(): string | null {
    return localStorage.getItem(DATABASE_VERSION_KEY);
  }

  /**
   * 设置存储的版本号
   */
  private setStoredVersion(version: string): void {
    localStorage.setItem(DATABASE_VERSION_KEY, version);
  }
}

/**
 * DataStorage 单例实例
 */
export const DataStorage = new DataStorageService();
