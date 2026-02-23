/**
 * @fileoverview
 * This file provides a unified data storage service for the MHWS Set Builder.
 * It handles core data persistence tasks, including:
 * - Version checking and data migration on application startup.
 * - Loading and saving all application data.
 * - Centralized management of localStorage.
 */

import {
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

/** Result of the DataStorage initialization process. */
export type InitResult =
  | { status: "ready" }
  | { status: "review_required"; analysis: Map<DataId, ValidationResult> }
  | { status: "error"; message: string };

/**
 * Manages all persistent data for the application in a singleton pattern.
 */
class DataStorageService {
  /** Internal data cache. */
  private dataCache: Map<DataId, DataItem[]> = new Map<DataId, DataItem[]>();

  /** Cache for base (official) data. */
  private baseDataCache: Map<DataId, DataItem[]> = new Map<
    DataId,
    DataItem[]
  >();

  /** Stats from the last migration for UI display. */
  private migrationReport: Map<DataId, MigrationStats> | null = null;

  /** Stashed analysis when a manual review is pending. */
  private pendingReview: Map<DataId, ValidationResult> | null = null;

  /** Flag to indicate if the service has been initialized. */
  private initialized = false;

  /**
   * Initializes the DataStorage service.
   *
   * @returns A promise that resolves to an InitResult.
   */
  async initialize(): Promise<InitResult> {
    if (this.initialized) {
      return { status: "ready" };
    }

    try {
      console.log("[DataStorage] 开始初始化...");

      const storedVersion = this.getStoredVersion();

      if (storedVersion === DATABASE_VERSION) {
        console.log("[DataStorage] Version match. Loading existing data.");
        await this.loadDifferentialData();
      } else if (storedVersion === null) {
        console.log("[DataStorage] New user. Loading initial data.");
        await this.loadInitialData();
      } else {
        console.log(
          `[DataStorage] Version mismatch: ${storedVersion} -> ${DATABASE_VERSION}. Analyzing...`,
        );

        // 1. Analyze the risk of migration.
        const analysis = await this.analyzeMigration();

        // 2. Determine if a manual review is required.
        let needsReview = false;
        for (const result of analysis.values()) {
          if (result.missingOfficial > 0 || result.mismatched > 0) {
            needsReview = true;
            break;
          }
        }

        if (needsReview) {
          console.log(
            "[DataStorage] High-risk changes detected. Review required.",
          );
          this.pendingReview = analysis;
          return { status: "review_required", analysis };
        }

        // 3. Low-risk migration: proceed silently.
        await this.performDataMigration(storedVersion, DATABASE_VERSION);
      }

      this.setStoredVersion(DATABASE_VERSION);
      this.initialized = true;
      console.log("[DataStorage] 初始化完成");
      return { status: "ready" };
    } catch (error) {
      console.error("[DataStorage] Initialization failed:", error);
      return {
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Data storage initialization failed",
      };
    }
  }

  /**
   * Confirms and applies the pending migration.
   * This should be called after the user has reviewed the changes.
   */
  async confirmMigration(): Promise<void> {
    if (this.initialized) return;

    const storedVersion = this.getStoredVersion() ?? "unknown";
    await this.performDataMigration(storedVersion, DATABASE_VERSION);

    this.setStoredVersion(DATABASE_VERSION);
    this.pendingReview = null;
    this.initialized = true;
    console.log("[DataStorage] 迁移确认并完成");
  }

  /**
   * Gets the current pending review analysis.
   */
  getPendingReview(): Map<DataId, ValidationResult> | null {
    return this.pendingReview;
  }

  /**
   * Analyzes the impact of applying existing local deltas to the new official data.
   */
  private async analyzeMigration(): Promise<Map<DataId, ValidationResult>> {
    const analysis = new Map<DataId, ValidationResult>();

    for (const id of DIFFERENTIAL_DATA_IDS) {
      const baseData = await this.loadBaseDataForType(id);
      const delta = this.getDelta<DataItem>(id);

      // Calculate what the data would look like if we apply the old delta to new base.
      const patchedData = patch(baseData, delta);

      // Validate this patched data against the new base.
      // mismatched = user modifications of official data.
      // missing = user deletions of official data.
      const ignoredFields: string[] = id === "charms" ? ["keySkillValue"] : [];
      const result = validateData(patchedData, baseData, ignoredFields);

      if (!result.isValid) {
        analysis.set(id, result);
      }
    }

    return analysis;
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
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
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
    if (id === "charms") {
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
   * Orchestrates the data migration process when a version mismatch is detected.
   * This provides a centralized place to handle structural changes or data
   * conversions between specific versions.
   *
   * @param fromVersion The version currently stored in the user's browser.
   * @param toVersion The version the application is upgrading to.
   */
  private async performDataMigration(
    fromVersion: string,
    toVersion: string,
  ): Promise<void> {
    console.log(
      `[DataStorage] Migrating data from ${fromVersion} to ${toVersion}`,
    );

    try {
      // Future: Add specific migration logic for version ranges here.
      // e.g., if (compareVersions(fromVersion, "1.1.0") < 0) { ... }

      // Currently, we ensure existing differential patches are re-applied to
      // the new base data. This ensures user data persists across upgrades.
      await this.loadDifferentialData();

      console.log("[DataStorage] Data migration completed successfully");
    } catch (error) {
      console.error("[DataStorage] Migration failed:", error);
      // Fallback: On critical migration failure, clear storage to ensure a clean state.
      console.log("[DataStorage] Resetting all data due to migration failure");
      this.clearAll();
      await this.loadInitialData();
    }
  }

  /**
   * Loads the base data for a specific data type from its JSON file.
   */
  public async loadBaseDataForType(id: DataId): Promise<DataItem[]> {
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

// Re-export transfer utilities
export * from "./transfer";
