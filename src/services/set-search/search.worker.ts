/**
 * @fileoverview Web Worker entry point for the set search algorithm.
 * Handles communication between the main thread and the search logic.
 */

import { findOptimalSets } from "./search-logic";
import type { SearchRequest, SearchResponse } from "./worker-types";

// Listen for messages from the main thread
self.onmessage = async (e: MessageEvent<SearchRequest>) => {
  const { requiredSkills, fixedEquipment, allData } = e.data;

  try {
    // Execute the search logic (CPU intensive)
    const results = await findOptimalSets(
      requiredSkills,
      fixedEquipment,
      allData,
      (current, total) => {
        const progressResponse: SearchResponse = {
          type: "progress",
          current,
          total,
        };
        self.postMessage(progressResponse);
      },
    );

    // Send the results back to the main thread
    const response: SearchResponse = {
      type: "success",
      results,
    };
    self.postMessage(response);
  } catch (error) {
    console.error("Worker Search Error:", error);
    const response: SearchResponse = {
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};
