/**
 * @fileoverview
 * This file provides a unified data storage service for the MHWS Set Builder.
 * It handles core data persistence tasks, including:
 * - Version checking and data migration on application startup.
 * - Loading and saving all application data.
 * - Centralized management of localStorage.
 */

import {
  APP_NAME,
  DATABASE_VERSION,
  DATABASE_VERSION_KEY,
  DEFAULT_ACCESSORIES_PER_PAGE,
  DEFAULT_ARMOR_SERIES_PER_PAGE,
  DEFAULT_CHARMS_PER_PAGE,
  DEFAULT_SEARCH_RESULT_LIMIT,
  DEFAULT_SKILLS_PER_PAGE,
  DEFAULT_WEAPON_TYPE,
  STORAGE_KEYS,
  STORAGE_KEYS_DELTA,
} from "@/constants";
import {
  ALL_DATA_IDS,
  type AppSettings,
  type DataId,
  type DataItem,
} from "@/types";
import {
  createDiff,
  patch,
  validateData,
  type DataDelta,
  type MigrationStats,
  type ValidationResult,
} from "@/utils";

// Define data types that require differential storage.
const DIFFERENTIAL_DATA_IDS = ALL_DATA_IDS.filter((id) => id !== "settings");

const EMPTY_DELTA: DataDelta<DataItem> = {
  added: [],
  modified: [],
  deleted: [],
};

/**
 * Manages all persistent data for the application in a singleton pattern.
 */
class DataStorageService {
  /**
   * Internal data cache. All data is loaded here after `initialize()` is called.
   */
  private dataCache: Map<DataId, DataItem[]> = new Map<DataId, DataItem[]>();

  /**
   * Cache for base (initial) data to avoid redundant fetch requests.
   */
  private baseDataCache: Map<DataId, DataItem[]> = new Map<
    DataId,
    DataItem[]
  >();

  /**
   * Cache for the migration report.
   * Stores stats from the last migration for UI display.
   */
  private migrationReport: Map<DataId, MigrationStats> | null = null;

  /**
   * Flag to indicate if the service has been initialized.
   */
  private initialized = false;

  /**
   * Initializes the DataStorage service.
   *
   * This method should be called on application startup before any other
   * data-dependent context is initialized. It performs the following steps:
   * 1. Checks the version number in localStorage.
   * 2. Loads initial data or performs migration if the user is new or the version mismatches.
   * 3. Loads all data into the in-memory cache.
   *
   * @returns A promise that resolves when initialization is complete.
   * @throws {Error} If initialization fails.
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
        // Version matches, load differential data.
        console.log("[DataStorage] Version match. Loading existing data.");
        await this.loadDifferentialData();
      } else if (storedVersion === null) {
        // New user, load initial data.
        console.log("[DataStorage] New user. Loading initial data.");
        await this.loadInitialData();
      } else {
        // Version mismatch, perform migration.
        console.log(
          `[DataStorage] Upgrading version: ${storedVersion} -> ${DATABASE_VERSION}`,
        );
        await this.migrateToDifferential(storedVersion);
      }

      // Update the version number in storage.
      this.setStoredVersion(DATABASE_VERSION);

      this.initialized = true;
      console.log("[DataStorage] 初始化完成");
    } catch (error) {
      console.error("[DataStorage] Initialization failed:", error);
      throw new Error("Data storage initialization failed");
    }
  }

  /**
   * Loads data of a specific type from the cache.
   *
   * @param id The ID of the data type to load.
   * @returns An array of data items.
   */
  loadData<T extends DataItem>(id: DataId): T[] {
    if (!this.initialized) {
      throw new Error("DataStorage not initialized. Call initialize() first.");
    }

    const data = this.dataCache.get(id);
    return (data ?? []) as T[];
  }

  /**
   * Saves data of a specific type.
   *
   * @param id The ID of the data type to save.
   * @param data The data array to save.
   */
  async saveData<T extends DataItem>(id: DataId, data: T[]): Promise<void> {
    if (!this.initialized) {
      throw new Error("DataStorage not initialized. Call initialize() first.");
    }

    try {
      // 1. Update the in-memory cache.
      this.dataCache.set(id, data);

      // 2. Apply different save strategies based on data type.
      if (id === "settings") {
        // For settings, perform a full save.
        const key = STORAGE_KEYS.settings;
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`[DataStorage] Full-saved ${id}`);
      } else {
        // For other data types, perform a differential save.
        // 2a. Load the base data.
        const baseData = await this.loadBaseDataForType(id);

        // 2b. Calculate the diff.
        const delta = createDiff(baseData, data);

        // 2c. Persist the diff to localStorage.
        const deltaKey = STORAGE_KEYS_DELTA[id];
        localStorage.setItem(deltaKey, JSON.stringify(delta));
        console.log(`[DataStorage] Diff-saved ${id}:`, {
          added: delta.added.length,
          modified: delta.modified.length,
          deleted: delta.deleted.length,
        });
      }
    } catch (error) {
      console.error(`[DataStorage] Failed to save ${id}:`, error);
      throw new Error(`Failed to save ${id} data`);
    }
  }

  /**
   * Resets data of a specific type to its initial state.
   *
   * @param id The ID of the data type to reset.
   */
  public async resetData(id: DataId): Promise<void> {
    if (!this.initialized) {
      throw new Error("DataStorage not initialized. Call initialize() first.");
    }

    try {
      console.log(`[DataStorage] Resetting ${id} data to initial state`);
      await this.loadInitialDataForType(id);
      console.log(`[DataStorage] ${id} data reset complete`);
    } catch (error) {
      console.error(`[DataStorage] Failed to reset ${id} data:`, error);
      throw new Error(`Failed to reset ${id} data`);
    }
  }

  /**
   * Clears all stored data from both localStorage and memory.
   */
  clearAll(): void {
    console.log("[DataStorage] Clearing all data");

    // Clear localStorage.
    // Clear full and differential data.
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    DIFFERENTIAL_DATA_IDS.forEach((id) =>
      localStorage.removeItem(`${APP_NAME}-${id}`),
    );
    Object.values(STORAGE_KEYS_DELTA).forEach((key) =>
      localStorage.removeItem(key),
    );
    localStorage.removeItem(DATABASE_VERSION_KEY);

    // Clear the in-memory cache.
    this.dataCache.clear();
    this.initialized = false;
  }

  /**
   * Retrieves and clears the migration report.
   *
   * @returns The migration report if it exists, otherwise null.
   */
  getAndClearMigrationReport(): Map<DataId, MigrationStats> | null {
    const report = this.migrationReport;
    this.migrationReport = null;
    return report;
  }

  /**
   * Retrieves the current differential data (delta) for a specific type.
   *
   * @param id The ID of the data type.
   * @returns The DataDelta object.
   */
  getDelta<T extends { id: string }>(id: DataId): DataDelta<T> {
    if (id === "settings") {
      return { added: [], modified: [], deleted: [] };
    }
    const deltaKey = STORAGE_KEYS_DELTA[id];
    const storedDelta = localStorage.getItem(deltaKey);
    return storedDelta
      ? (JSON.parse(storedDelta) as DataDelta<T>)
      : { added: [], modified: [], deleted: [] };
  }

  /**
   * Validates the data by checking if official data has been modified or deleted.
   *
   * @param id The ID of the data type.
   * @returns A Promise resolving to a ValidationResult object.
   */
  async getValidationResult(id: DataId): Promise<ValidationResult> {
    if (id === "settings") {
      return {
        isValid: true,
        missingOfficial: 0,
        mismatched: 0,
        userPrivate: 0,
        errors: [],
        details: { missing: [], mismatched: [], userPrivate: [] },
      };
    }

    const currentData = this.loadData(id);
    const initialData = await this.loadBaseDataForType(id);

    // Determine fields to ignore based on data type.
    const ignoredFields: string[] = [];
    if (id === "skills") {
      ignoredFields.push("isKey");
    } else if (id === "charms") {
      ignoredFields.push("keySkillValue");
    }

    return validateData(currentData, initialData, ignoredFields);
  }

  /**
   * Loads data differentially, called when the stored version matches the database version.
   */
  private async loadDifferentialData(): Promise<void> {
    // 1. Load settings data fully.
    await this.loadInitialDataForType("settings");

    // 2. Load other data types differentially.
    for (const id of DIFFERENTIAL_DATA_IDS) {
      // 2a. Load the base data.
      const baseData = await this.loadBaseDataForType(id);

      // 2b. Load the diff data from storage.
      const deltaKey = STORAGE_KEYS_DELTA[id];
      const storedDelta = localStorage.getItem(deltaKey);
      const delta = storedDelta
        ? (JSON.parse(storedDelta) as DataDelta<DataItem>)
        : EMPTY_DELTA;

      // 2c. Apply the patch to generate the full dataset.
      const fullData = patch(baseData, delta);
      this.dataCache.set(id, fullData);

      console.log(
        `[DataStorage] Loaded ${id} (differential):`,
        fullData.length,
        "items",
      );
    }
  }

  /**
   * Loads initial data for all data types.
   */
  private async loadInitialData(): Promise<void> {
    for (const id of ALL_DATA_IDS) {
      await this.loadInitialDataForType(id);
    }
  }

  /**
   * Loads initial data for a specific data type.
   */
  private async loadInitialDataForType(id: DataId): Promise<void> {
    if (id === "settings") {
      // Settings are initialized with default values and saved fully.
      const key = STORAGE_KEYS.settings;
      const stored = localStorage.getItem(key);
      const defaultSettings: AppSettings = {
        id: "app-settings",
        enableLimitBreak: false,
        skillsPerPage: DEFAULT_SKILLS_PER_PAGE,
        armorSeriesPerPage: DEFAULT_ARMOR_SERIES_PER_PAGE,
        charmsPerPage: DEFAULT_CHARMS_PER_PAGE,
        accessoriesPerPage: DEFAULT_ACCESSORIES_PER_PAGE,
        defaultWeaponType: DEFAULT_WEAPON_TYPE,
        searchResultLimit: DEFAULT_SEARCH_RESULT_LIMIT,
      };

      let settings: AppSettings[];
      if (stored) {
        const parsed = JSON.parse(stored) as AppSettings[];
        // Merge with defaults to ensure all keys exist (backward compatibility)
        settings = parsed.map((s) => ({ ...defaultSettings, ...s }));
      } else {
        settings = [defaultSettings];
        localStorage.setItem(key, JSON.stringify(settings));
      }
      this.dataCache.set("settings", settings);
      console.log("[DataStorage] Loaded settings data.");
      return;
    }

    // For differential data types, load base data and save an empty delta.
    const baseData = await this.loadBaseDataForType(id);
    this.dataCache.set(id, baseData);

    const deltaKey = STORAGE_KEYS_DELTA[id];
    localStorage.setItem(deltaKey, JSON.stringify(EMPTY_DELTA));

    console.log(
      `[DataStorage] Loaded initial ${id}:`,
      baseData.length,
      "records",
    );
  }

  /**
   * Performs a one-time migration to differential storage.
   */
  private async migrateToDifferential(oldVersion: string): Promise<void> {
    console.log(
      `[DataStorage] Migrating to differential storage: ${oldVersion} -> ${DATABASE_VERSION}`,
    );

    try {
      // 1. Migrate/load settings.
      await this.loadInitialDataForType("settings");

      // 2. Migrate other data types.
      for (const id of DIFFERENTIAL_DATA_IDS) {
        // 2a. Load the old full data from storage.
        const oldKey = `${APP_NAME}-${id}`;
        const oldStoredData = localStorage.getItem(oldKey);
        const oldFullData = oldStoredData
          ? (JSON.parse(oldStoredData) as DataItem[])
          : [];

        // 2b. Load the new base data.
        const newBaseData = await this.loadBaseDataForType(id);

        // 2c. Calculate the diff between the new base and old full data.
        const delta = createDiff(newBaseData, oldFullData);

        // 2d. Save the new diff data.
        const deltaKey = STORAGE_KEYS_DELTA[id];
        localStorage.setItem(deltaKey, JSON.stringify(delta));

        // 2e. Load the merged data into the cache.
        const mergedData = patch(newBaseData, delta);
        this.dataCache.set(id, mergedData);

        // 2f. [IMPORTANT] Remove the old full data from storage.
        localStorage.removeItem(oldKey);

        console.log(
          `[DataStorage] ${id} migrated to differential storage successfully`,
        );
      }
      console.log("[DataStorage] Data migration complete");
    } catch (error) {
      console.error("[DataStorage] Data migration failed:", error);
      // On migration failure, roll back by clearing everything and loading initial data.
      console.log(
        "[DataStorage] Migration failed, rolling back to initial data",
      );
      this.clearAll();
      await this.loadInitialData();
    }
  }

  /**
   * Loads the base data for a specific data type from its JSON file.
   */
  private async loadBaseDataForType(id: DataId): Promise<DataItem[]> {
    // `settings` does not have a base data file.
    if (id === "settings") return [];

    // Return cached base data if available.
    const cached = this.baseDataCache.get(id);
    if (cached) return cached;

    try {
      // Load data from the public data directory using fetch.
      // import.meta.env.BASE_URL is handled by Vite and ensures correct paths on gh-pages.
      const baseUrl = import.meta.env.BASE_URL;
      const response = await fetch(`${baseUrl}data/initial-${id}.json`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as Record<string, unknown[]>;
      const items = (data[id] ?? []) as DataItem[];

      // Cache the base data for future use.
      this.baseDataCache.set(id, items);

      return items;
    } catch (error) {
      console.error(`[DataStorage] Failed to load base data for ${id}:`, error);
      return []; // Return an empty array on failure.
    }
  }

  /**
   * Gets the stored database version from localStorage.
   */
  private getStoredVersion(): string | null {
    return localStorage.getItem(DATABASE_VERSION_KEY);
  }

  /**
   * Sets the database version in localStorage.
   */
  private setStoredVersion(version: string): void {
    localStorage.setItem(DATABASE_VERSION_KEY, version);
  }
}

/**
 * Singleton instance of the DataStorageService.
 */
export const DataStorage = new DataStorageService();
