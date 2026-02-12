/**
 * @fileoverview
 * Provides services for exporting application data to and importing from JSON files.
 */

import { DATABASE_VERSION } from "@/constants";
import type { DataId, DataItem } from "@/types";
import { patch, type DataDelta } from "@/utils";

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
 * Imports data from a JSON file and performs basic validation.
 *
 * Automatically detects if the import is a full dataset or a differential patch.
 *
 * @param file The JSON file to import.
 * @throws An error if the file cannot be read or the format is incorrect.
 */
export async function importData(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const payload = JSON.parse(content) as ExportPayload;

        // Basic structure validation.
        if (!payload.version || !payload.dataType || !payload.data) {
          throw new Error(
            "Invalid data structure: missing version, dataType, or data field",
          );
        }

        const dataType = payload.dataType as DataId;
        const mode = payload.mode || "full"; // Default to full for backward compatibility.

        let dataToSave: DataItem[];

        const currentData = DataStorage.loadData(dataType);

        if (mode === "diff") {
          // Differential import: Apply patch to current data.
          const delta = payload.data as DataDelta<DataItem>;
          dataToSave = patch(currentData, delta);
        } else {
          // Full import: Merge with current data (non-destructive).
          const importedData = payload.data as DataItem[];
          const currentMap = new Map(
            currentData.map((item) => [item.id, item]),
          );

          // Overwrite existing items or add new ones.
          importedData.forEach((item) => {
            currentMap.set(item.id, item);
          });

          dataToSave = Array.from(currentMap.values());
        }

        // Save the data using the DataStorage service.
        DataStorage.saveData(dataType, dataToSave)
          .then(() => resolve())
          .catch((err) =>
            reject(err instanceof Error ? err : new Error(String(err))),
          );
      } catch (error) {
        reject(
          new Error(
            `Import failed: Invalid file format or content. (${
              error instanceof Error ? error.message : String(error)
            })`,
          ),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read the file"));
    };

    reader.readAsText(file);
  });
}
