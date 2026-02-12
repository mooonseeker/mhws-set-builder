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
 * Represents a single difference between two versions of an object.
 */
export interface DiffDetail {
  field: string;
  oldVal: unknown;
  newVal: unknown;
}

/**
 * Detailed information about a data discrepancy.
 */
export interface DataDifference {
  id: string;
  name: string;
  diffs?: DiffDetail[];
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
  /** Structured details for UI rendering. */
  details: {
    missing: DataDifference[];
    mismatched: DataDifference[];
    userPrivate: DataDifference[];
  };
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
 * @param ignoredFields - Optional list of fields to ignore during comparison.
 * @returns A DataDelta object describing the changes.
 */
export function createDiff<T extends { id: string }>(
  baseData: T[],
  currentData: T[],
  ignoredFields: string[] = [],
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
    } else {
      // Check if modified
      const isModified =
        ignoredFields.length > 0
          ? compareObjects(baseItem, currentItem, "", ignoredFields).length > 0
          : JSON.stringify(currentItem) !== JSON.stringify(baseItem);

      if (isModified) {
        // Exists but content is different -> modified.
        modified.push(currentItem);
      }
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
 * Deeply compares two objects to find specific field differences.
 *
 * @param obj1 - The base object (e.g., official data).
 * @param obj2 - The comparison object (e.g., local data).
 * @param path - The current property path (used for recursion).
 * @param ignoredFields - Optional list of fields to ignore during comparison.
 * @returns An array of difference details.
 */
function compareObjects(
  obj1: unknown,
  obj2: unknown,
  path = "",
  ignoredFields: string[] = [],
): DiffDetail[] {
  const diffs: DiffDetail[] = [];

  // Handle primitives and nulls
  if (obj1 === obj2) return diffs;

  if (
    typeof obj1 !== typeof obj2 ||
    obj1 === null ||
    obj2 === null ||
    typeof obj1 !== "object"
  ) {
    diffs.push({ field: path, oldVal: obj1, newVal: obj2 });
    return diffs;
  }

  // Handle Arrays
  if (Array.isArray(obj1) !== Array.isArray(obj2)) {
    diffs.push({ field: path, oldVal: obj1, newVal: obj2 });
    return diffs;
  }

  if (Array.isArray(obj1)) {
    const arr1 = obj1 as unknown[];
    const arr2 = obj2 as unknown[];
    // For arrays, if lengths differ, we mark the length change.
    // Then we compare up to the max length.
    const maxLen = Math.max(arr1.length, arr2.length);
    for (let i = 0; i < maxLen; i++) {
      const currentPath = path ? `${path}[${i}]` : `[${i}]`;
      if (ignoredFields.includes(currentPath)) continue;

      if (i >= arr1.length) {
        // Added element in obj2
        diffs.push({ field: currentPath, oldVal: undefined, newVal: arr2[i] });
      } else if (i >= arr2.length) {
        // Deleted element in obj2
        diffs.push({ field: currentPath, oldVal: arr1[i], newVal: undefined });
      } else {
        diffs.push(
          ...compareObjects(arr1[i], arr2[i], currentPath, ignoredFields),
        );
      }
    }
    return diffs;
  }

  // Handle Objects
  const record1 = obj1 as Record<string, unknown>;
  const record2 = obj2 as Record<string, unknown>;
  const keys = new Set([...Object.keys(record1), ...Object.keys(record2)]);
  for (const key of keys) {
    const currentPath = path ? `${path}.${key}` : key;
    if (ignoredFields.includes(currentPath)) continue;

    if (!(key in record1)) {
      diffs.push({
        field: currentPath,
        oldVal: undefined,
        newVal: record2[key],
      });
    } else if (!(key in record2)) {
      diffs.push({
        field: currentPath,
        oldVal: record1[key],
        newVal: undefined,
      });
    } else {
      diffs.push(
        ...compareObjects(
          record1[key],
          record2[key],
          currentPath,
          ignoredFields,
        ),
      );
    }
  }

  return diffs;
}

/**
 * Helper to safely get a name from a DataItem.
 */
function getItemName(item: unknown): string {
  const data = item as Record<string, unknown> | null;
  return (data?.name as string) ?? (data?.id as string) ?? "Unknown";
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
 * Validates the consistency of database data against initial data.
 *
 * Uses `createDiff` to identify specific discrepancies and `compareObjects`
 * to generate detailed difference reports.
 *
 * @param currentData - The current in-app data (Local).
 * @param initialData - The initial data loaded from a source like JSON (Official).
 * @param ignoredFields - Optional list of fields to ignore during validation.
 * @returns A detailed validation result object.
 */
export function validateData(
  currentData: DataItem[],
  initialData: DataItem[],
  ignoredFields: string[] = [],
): ValidationResult {
  // Use createDiff to find high-level changes
  // base = official (initialData), current = local (currentData)
  const diff = createDiff(initialData, currentData, ignoredFields);

  const errors: string[] = [];
  const missingDetails: DataDifference[] = [];
  const mismatchedDetails: DataDifference[] = [];
  const userPrivateDetails: DataDifference[] = [];

  const initialMap = new Map(initialData.map((item) => [item.id, item]));

  // 1. Missing Official Data (Deleted from local)
  // createDiff.deleted returns IDs of items in base but not in current
  for (const id of diff.deleted) {
    const originalItem = initialMap.get(id);
    const name = getItemName(originalItem);
    errors.push(`缺失官方数据: [${id}] ${name}`);
    missingDetails.push({ id, name });
  }

  // 2. Mismatched Data (Modified in local)
  // createDiff.modified returns the *current* (local) version of the item
  for (const localItem of diff.modified) {
    const officialItem = initialMap.get(localItem.id);
    const name = getItemName(localItem);

    // Deep compare to find specific fields
    const diffs = compareObjects(officialItem, localItem, "", ignoredFields);

    errors.push(
      `数据不匹配: [${localItem.id}] ${name} (${diffs.length} 处差异)`,
    );
    mismatchedDetails.push({ id: localItem.id, name, diffs });
  }

  // 3. User Private Data (Added in local)
  // createDiff.added returns items in current but not in base
  for (const localItem of diff.added) {
    const name = getItemName(localItem);
    errors.push(`用户自定义数据: [${localItem.id}] ${name}`);
    userPrivateDetails.push({ id: localItem.id, name });
  }

  return {
    isValid:
      diff.deleted.length === 0 &&
      diff.modified.length === 0 &&
      diff.added.length === 0,
    missingOfficial: diff.deleted.length,
    mismatched: diff.modified.length,
    userPrivate: diff.added.length,
    errors,
    details: {
      missing: missingDetails,
      mismatched: mismatchedDetails,
      userPrivate: userPrivateDetails,
    },
  };
}
