/**
 * @fileoverview Entry point for the MHWS Set Builder's search algorithm.
 * Now acts as a wrapper around the Web Worker to prevent UI blocking.
 */

import type {
  Accessory,
  Armor,
  Charm,
  EquipmentSet,
  FinalSet,
  Skill,
  SkillWithLevel,
  Weapon,
} from "@/types";

import type { SearchRequest, SearchResponse } from "./worker-types";

/**
 * Represents all the raw game data needed for the search.
 */
interface AllGameData {
  armors: Armor[];
  weapons: Weapon[];
  accessories: Accessory[];
  skills: Skill[];
  charms: Charm[];
}

/**
 * Represents a search operation that can be cancelled.
 */
export interface CancellableSearch {
  promise: Promise<FinalSet[]>;
  cancel: () => void;
}

/**
 * Finds optimal equipment sets using a Web Worker to avoid blocking the main thread.
 *
 * @param requiredSkills An array of skills the user requires.
 * @param fixedEquipment The specific equipment set to build around.
 * @param allData All game data including armors, weapons, accessories, skills, and charms.
 * @param onProgress Callback for progress updates.
 * @param searchLimit Maximum number of results to return.
 * @returns A CancellableSearch object containing the result promise and a cancel function.
 */
export const findOptimalSets = (
  requiredSkills: SkillWithLevel[],
  fixedEquipment: EquipmentSet,
  allData: AllGameData,
  onProgress?: (current: number, total: number) => void,
  searchLimit = 20,
): CancellableSearch => {
  let worker: Worker | null = null;

  const cancel = () => {
    if (worker) {
      worker.terminate();
      worker = null;
    }
  };

  const promise = new Promise<FinalSet[]>((resolve, reject) => {
    // Create a new worker instance
    // Vite handles this import.meta.url pattern to bundle the worker correctly
    worker = new Worker(new URL("./search.worker.ts", import.meta.url), {
      type: "module",
    });

    const request: SearchRequest = {
      requiredSkills,
      fixedEquipment,
      allData,
      searchLimit,
    };

    worker.onmessage = (e: MessageEvent<SearchResponse>) => {
      const response = e.data;

      if (response.type === "success") {
        resolve(response.results);
        // Terminate the worker after the job is done to free up resources
        if (worker) {
          worker.terminate();
          worker = null;
        }
      } else if (response.type === "progress") {
        if (onProgress) {
          onProgress(response.current, response.total);
        }
      } else {
        reject(new Error(response.error));
        if (worker) {
          worker.terminate();
          worker = null;
        }
      }
    };

    worker.onerror = (event) => {
      const error =
        event instanceof ErrorEvent && event.error instanceof Error
          ? event.error
          : new Error(
              event instanceof ErrorEvent ? event.message : "Worker error",
            );
      reject(error);
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    // Start the worker
    worker.postMessage(request);
  });

  return { promise, cancel };
};
