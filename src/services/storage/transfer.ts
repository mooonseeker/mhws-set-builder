/**
 * @fileoverview
 * Provides services for exporting application data to and importing from JSON files.
 */

import { DATABASE_VERSION } from "@/constants";
import type { DataId, DataItem } from "@/types";
import {
  patch,
  validateData,
  type DataDelta,
  type ValidationResult,
} from "@/utils";

import { DataStorage } from "./index";

/**
 * Defines the unified structure for exported data.
 */
export interface ExportPayload {
  version: string;
  exportedAt: string;
  dataType: DataId | "all";
  mode: "full" | "diff";
  data: DataItem[] | DataDelta<DataItem>;
}

/**
 * Result of the import analysis.
 */
export interface ImportAnalysis {
  payload: ExportPayload;
  validation: ValidationResult;
  isVersionMismatch: boolean;
}

/**
 * Exports data of a specific type to a JSON file.
 *
 * @param id The ID of the data type to export.
 * @param mode The export mode: "full" (default) or "diff".
 */
export function exportData(id: DataId, mode: "full" | "diff" = "full"): void {
  let data: DataItem[] | DataDelta<DataItem>;

  if (mode === "diff") {
    data = DataStorage.getDelta(id);
  } else {
    data = DataStorage.loadData(id);
  }

  const payload: ExportPayload = {
    version: DATABASE_VERSION,
    exportedAt: new Date().toISOString(),
    dataType: id,
    mode,
    data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  // Generate a filename based on the data type and mode.
  const dateStr = new Date().toISOString().split("T")[0];
  const suffix = mode === "diff" ? "-diff" : "";
  const fileName = `mhws-set-builder-${id}${suffix}-${dateStr}.json`;

  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses an imported JSON file and returns the payload.
 */
export async function parseImportFile(file: File): Promise<ExportPayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const payload = JSON.parse(content) as ExportPayload;
        if (!payload.version || !payload.dataType || !payload.data) {
          throw new Error("Invalid structure");
        }
        resolve(payload);
      } catch {
        reject(new Error("Invalid file format"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Analyzes the potential impact of an import payload.
 */
export async function analyzeImport(
  payload: ExportPayload,
): Promise<ImportAnalysis> {
  const dataType = payload.dataType as DataId;
  const isVersionMismatch = payload.version !== DATABASE_VERSION;

  // Get current state to compare against.
  const currentBase = await DataStorage.loadBaseDataForType(dataType);
  const currentData = DataStorage.loadData(dataType);

  let dataToPreview: DataItem[];
  if (payload.mode === "diff") {
    dataToPreview = patch(currentData, payload.data as DataDelta<DataItem>);
  } else {
    const importedData = payload.data as DataItem[];
    const currentMap = new Map(currentData.map((item) => [item.id, item]));
    importedData.forEach((item) => currentMap.set(item.id, item));
    dataToPreview = Array.from(currentMap.values());
  }

  const ignoredFields: string[] =
    dataType === "charms" ? ["keySkillValue"] : [];
  const validation = validateData(dataToPreview, currentBase, ignoredFields);

  return {
    payload,
    validation,
    isVersionMismatch,
  };
}

/**
 * Performs the actual data import.
 */
export async function performImport(payload: ExportPayload): Promise<void> {
  const dataType = payload.dataType as DataId;
  const currentData = DataStorage.loadData(dataType);
  let dataToSave: DataItem[];

  if (payload.mode === "diff") {
    dataToSave = patch(currentData, payload.data as DataDelta<DataItem>);
  } else {
    const importedData = payload.data as DataItem[];
    const currentMap = new Map(currentData.map((item) => [item.id, item]));
    importedData.forEach((item) => currentMap.set(item.id, item));
    dataToSave = Array.from(currentMap.values());
  }

  await DataStorage.saveData(dataType, dataToSave);
}

/**
 * Legacy importData function, maintained for backward compatibility or simple cases.
 */
export async function importData(file: File): Promise<void> {
  const payload = await parseImportFile(file);
  await performImport(payload);
}
