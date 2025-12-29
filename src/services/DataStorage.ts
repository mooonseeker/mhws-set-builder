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

import type { DataId, DataItem } from "@/types";
import { ALL_DATA_IDS } from "@/types";
import {
  DATABASE_VERSION,
  DATABASE_VERSION_KEY,
  DEFAULT_ARMOR_SERIES_PER_PAGE,
  DEFAULT_CHARMS_PER_PAGE,
  DEFAULT_SKILLS_PER_PAGE,
  DEFAULT_ACCESSORIES_PER_PAGE,
  STORAGE_KEYS,
} from "@/constants";
import { type MigrationStats, reconcileData } from "@/utils/data-io";

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
        // 版本匹配，直接加载现有数据
        console.log("[DataStorage] 版本匹配，加载现有数据");
        await this.loadExistingData();
      } else if (storedVersion === null) {
        // 新用户，加载初始数据
        console.log("[DataStorage] 新用户，加载初始数据");
        await this.loadInitialData();
      } else {
        // 版本不匹配，执行迁移
        console.log(
          `[DataStorage] 版本升级: ${storedVersion} -> ${DATABASE_VERSION}`,
        );
        await this.migrateData(storedVersion);
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
  saveData<T extends DataItem>(id: DataId, data: T[]): void {
    if (!this.initialized) {
      throw new Error("DataStorage not initialized. Call initialize() first.");
    }

    try {
      // 更新内存缓存
      this.dataCache.set(id, data);

      // 持久化到 localStorage
      const key = STORAGE_KEYS[id];
      localStorage.setItem(key, JSON.stringify(data));

      console.log(`[DataStorage] 已保存 ${id}:`, data.length, "条记录");
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
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
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
   * 加载现有数据到缓存
   */
  private async loadExistingData(): Promise<void> {
    for (const id of ALL_DATA_IDS) {
      const key = STORAGE_KEYS[id];
      const stored = localStorage.getItem(key);

      if (stored) {
        try {
          const data = JSON.parse(stored) as DataItem[];
          this.dataCache.set(id, data);
          console.log(`[DataStorage] 已加载 ${id}:`, data.length, "条记录");
        } catch (error) {
          console.error(`[DataStorage] 解析 ${id} 数据失败:`, error);
          // 如果解析失败，加载初始数据
          await this.loadInitialDataForType(id);
        }
      } else {
        // 如果某个类型的数据不存在，加载其初始数据
        await this.loadInitialDataForType(id);
      }
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
    // 特殊的处理：护石数据初始为空，不需要初始数据文件
    if (id === "charms") {
      this.dataCache.set(id, []);
      const key = STORAGE_KEYS[id];
      localStorage.setItem(key, JSON.stringify([]));
      console.log(`[DataStorage] 已初始化空 ${id} 数据`);
      return;
    }

    // 特殊处理：设置数据使用默认值初始化
    if (id === "settings") {
      const defaultSettings: DataItem[] = [
        {
          id: "app-settings",
          enableLimitBreak: false,
          skillsPerPage: DEFAULT_SKILLS_PER_PAGE,
          armorSeriesPerPage: DEFAULT_ARMOR_SERIES_PER_PAGE,
          charmsPerPage: DEFAULT_CHARMS_PER_PAGE,
          accessoriesPerPage: DEFAULT_ACCESSORIES_PER_PAGE,
        },
      ];
      this.dataCache.set(id, defaultSettings);
      const key = STORAGE_KEYS[id];
      localStorage.setItem(key, JSON.stringify(defaultSettings));
      console.log(`[DataStorage] 已初始化默认 ${id} 数据`);
      return;
    }

    try {
      // 使用相对路径进行动态导入
      const module = (await import(`../data/initial-${id}.json`)) as {
        default: Record<string, unknown[]>;
      };

      // 从 module.default 中提取对应类型的数据
      // 例如: { skills: [...] } 或 { accessories: [...] }
      const data = (module.default[id] ?? []) as DataItem[];

      // 更新内存缓存
      this.dataCache.set(id, data);

      // 持久化到 localStorage（不调用 saveData 以避免初始化检查）
      const key = STORAGE_KEYS[id];
      localStorage.setItem(key, JSON.stringify(data));

      console.log(`[DataStorage] 已加载初始 ${id}:`, data.length, "条记录");
    } catch (error) {
      console.error(`[DataStorage] 加载初始 ${id} 数据失败:`, error);
      // 如果加载失败，设置为空数组
      this.dataCache.set(id, []);
    }
  }

  /**
   * 执行数据迁移
   *
   * 遍历所有数据类型，将本地数据与官方初始数据进行对比和合并。
   *
   * @param oldVersion - 旧版本号
   */
  private async migrateData(oldVersion: string): Promise<void> {
    console.log(
      `[DataStorage] 执行数据迁移: ${oldVersion} -> ${DATABASE_VERSION}`,
    );

    this.migrationReport = new Map<DataId, MigrationStats>();

    try {
      for (const id of ALL_DATA_IDS) {
        // 1. 获取本地旧数据
        const key = STORAGE_KEYS[id];
        const stored = localStorage.getItem(key);
        const currentData = stored ? (JSON.parse(stored) as DataItem[]) : [];

        // 2. 获取官方新数据
        let officialData: DataItem[] = [];
        if (id === "charms") {
          // 护石没有官方初始数据，视为空数组
          officialData = [];
        } else if (id === "settings") {
          // 设置数据没有官方初始文件，使用默认值
          officialData = [
            {
              id: "app-settings",
              enableLimitBreak: false,
              skillsPerPage: DEFAULT_SKILLS_PER_PAGE,
              armorSeriesPerPage: DEFAULT_ARMOR_SERIES_PER_PAGE,
              charmsPerPage: DEFAULT_CHARMS_PER_PAGE,
              accessoriesPerPage: DEFAULT_ACCESSORIES_PER_PAGE,
            },
          ] as DataItem[];
        } else {
          try {
            const module = (await import(`../data/initial-${id}.json`)) as {
              default: Record<string, unknown[]>;
            };
            officialData = (module.default[id] ?? []) as DataItem[];
          } catch (e) {
            console.warn(`[DataStorage] 无法加载 ${id} 的初始数据`, e);
          }
        }

        // 3. 执行对比与合并
        const stats = reconcileData(currentData, officialData);

        // 4. 保存结果
        this.dataCache.set(id, stats.mergedData);
        localStorage.setItem(key, JSON.stringify(stats.mergedData));

        // 5. 记录报告（仅当有变化时）
        if (
          stats.officialAdded > 0 ||
          stats.officialUpdated > 0 ||
          stats.userRetainedIds.length > 0
        ) {
          this.migrationReport.set(id, stats);
          console.log(`[DataStorage] ${id} 迁移:`, stats);
        }
      }

      console.log("[DataStorage] 数据迁移完成");
    } catch (error) {
      console.error("[DataStorage] 数据迁移失败:", error);
      // 如果迁移失败，回退到加载初始数据
      console.log("[DataStorage] 回退到加载初始数据");
      this.migrationReport = null;
      await this.loadInitialData();
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
 *
 * 使用示例：
 * ```typescript
 * // 在应用启动时
 * await DataStorage.initialize();
 *
 * // 在 Context 中
 * const skills = DataStorage.loadData<Skill>('skills');
 * DataStorage.saveData('skills', updatedSkills);
 * ```
 */
export const DataStorage = new DataStorageService();
