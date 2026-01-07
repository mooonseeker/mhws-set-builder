/**
 * @fileoverview General-purpose data I/O utilities for MHWS Set Builder.
 *
 * Provides data-agnostic functions for comparing, validating, and
 * manipulating data sets.
 */

import type { DataItem } from "@/types";

/**
 * Statistics for data migration, describing changes when migrating local data
 * to an official version.
 */
export interface MigrationStats {
  mergedData: DataItem[];
  /** Number of items added from the official data (not present locally). */
  officialAdded: number;
  /** Number of items updated by the official data (present locally but different). */
  officialUpdated: number;
  /** List of user-retained item IDs (not present in official data). */
  userRetainedIds: string[];
}

/**
 * Result of data validation, describing differences between local and official data.
 */
export interface ValidationResult {
  isValid: boolean;
  /** Number of missing official items. */
  missingOfficial: number;
  /** Number of items inconsistent with the official data. */
  mismatched: number;
  /** Number of extra user-private items. */
  userPrivate: number;
  /** Detailed error or difference descriptions. */
  errors: string[];
}

/**
 * Describes the changes in a dataset relative to its base version.
 * T must be an object type with an `id: string` property.
 */
export interface DataDelta<T extends { id: string }> {
  /**
   * New items that do not exist in the base data.
   */
  added: T[];

  /**
   * Modified items whose `id` exists in the base data but whose content has changed.
   * The full object is stored to simplify patching logic.
   */
  modified: T[];

  /**
   * IDs of items that exist in the base data but have been deleted by the user.
   * Only IDs are stored to save space.
   */
  deleted: string[];
}

/**
 * Diff Algorithm: Compares base and current data to generate a DataDelta object.
 *
 * @param baseData - The base data array.
 * @param currentData - The current data array.
 * @returns A DataDelta object describing the changes.
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

  // Find added and modified items by iterating through current data.
  for (const currentItem of currentData) {
    const baseItem = baseMap.get(currentItem.id);
    if (!baseItem) {
      // Not in base data -> added.
      added.push(currentItem);
    } else if (JSON.stringify(currentItem) !== JSON.stringify(baseItem)) {
      // Exists but content is different -> modified.
      modified.push(currentItem);
    }
  }

  // Find deleted items by iterating through base data.
  for (const baseItem of baseData) {
    if (!currentMap.has(baseItem.id)) {
      // Not in current data -> deleted.
      deleted.push(baseItem.id);
    }
  }

  return { added, modified, deleted };
}

/**
 * Patch Algorithm: Applies a DataDelta to base data to generate merged data.
 *
 * @param baseData - The base data array.
 * @param delta - The DataDelta object describing changes.
 * @returns The merged, complete data array.
 */
export function patch<T extends { id: string }>(
  baseData: T[],
  delta: DataDelta<T>,
): T[] {
  // 1. Start with the base data.
  const patchedMap = new Map(baseData.map((item) => [item.id, item]));

  // 2. Apply deletions.
  for (const id of delta.deleted) {
    patchedMap.delete(id);
  }

  // 3. Apply modifications.
  for (const item of delta.modified) {
    patchedMap.set(item.id, item);
  }

  // 4. Apply additions.
  for (const item of delta.added) {
    patchedMap.set(item.id, item);
  }

  return Array.from(patchedMap.values());
}

/**
 * Core data reconciliation function.
 *
 * Logic:
 * 1. Official data has the highest priority; new or modified official items are always adopted.
 * 2. User-private data (existing only in `currentData`) is retained.
 * 3. Assumes item IDs are stable across versions.
 *
 * @param currentData - The current data stored locally.
 * @param officialData - The latest official initial data.
 * @returns Migration statistics, including the merged data.
 */
export function reconcileData(
  currentData: DataItem[],
  officialData: DataItem[],
): MigrationStats {
  const currentMap = new Map(currentData.map((item) => [item.id, item]));
  const officialMap = new Map(officialData.map((item) => [item.id, item]));

  // Default to all official data, covering additions and updates.
  const mergedData: DataItem[] = [...officialData];

  let officialAdded = 0;
  let officialUpdated = 0;
  const userRetainedIds: string[] = [];

  // 1. Tally changes from the official data.
  officialData.forEach((officialItem) => {
    const currentItem = currentMap.get(officialItem.id);

    if (!currentItem) {
      // Not present locally, considered an official addition.
      officialAdded++;
    } else if (JSON.stringify(currentItem) !== JSON.stringify(officialItem)) {
      // Present but different, considered an official update.
      officialUpdated++;
    }
  });

  // 2. Handle user-private data.
  currentData.forEach((currentItem) => {
    // If not in official data, it's user-private and should be retained.
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
 * Validates the consistency of database data against initial data.
 *
 * Reuses `reconcileData` logic but interprets results from a validation perspective:
 * - `officialAdded` -> Missing official data.
 * - `officialUpdated` -> Mismatched data.
 * - `userRetainedIds` -> Non-official (user) data.
 *
 * @param currentData - The current in-app data.
 * @param initialData - The initial data loaded from a source like JSON.
 * @returns A validation result object.
 */
export function validateData(
  currentData: DataItem[],
  initialData: DataItem[],
): ValidationResult {
  const stats = reconcileData(currentData, initialData);

  const errors: string[] = [];
  if (stats.officialAdded > 0) {
    errors.push(`Missing official data entries: ${stats.officialAdded}`);
  }
  if (stats.officialUpdated > 0) {
    errors.push(`Mismatched with official data: ${stats.officialUpdated}`);
  }
  if (stats.userRetainedIds.length > 0) {
    errors.push(
      `Contains non-official (user) data: ${stats.userRetainedIds.length}`,
    );
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
