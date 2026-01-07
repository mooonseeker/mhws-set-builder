/**
 * @fileoverview
 * Provides services for exporting application data to and importing from JSON files.
 */

import { DATABASE_VERSION } from "@/constants";
import type { DataId, DataItem } from "@/types";

import { DataStorage } from "./index";

/**
 * Defines the unified structure for exported data.
 */
export interface ExportPayload {
  version: string;
  exportedAt: string;
  dataType: DataId | "all";
  data: DataItem[];
}

/**
 * Exports data of a specific type to a JSON file.
 *
 * @param id The ID of the data type to export.
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

  // Generate a filename based on the data type.
  const dateStr = new Date().toISOString().split("T")[0];
  const fileName = `mhws-set-builder-${id}-${dateStr}.json`;

  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Imports data from a JSON file and performs basic validation.
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
        if (
          !payload.version ||
          !payload.dataType ||
          !Array.isArray(payload.data)
        ) {
          throw new Error(
            "Invalid data structure: missing version, dataType, or data field",
          );
        }

        // Save the data using the DataStorage service.
        DataStorage.saveData(payload.dataType as DataId, payload.data)
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
