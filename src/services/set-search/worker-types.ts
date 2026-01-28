/**
 * @fileoverview Definitions of types used for communication with the search worker.
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

/**
 * The data payload sent to the worker to initiate a search.
 */
export interface SearchRequest {
  requiredSkills: SkillWithLevel[];
  fixedEquipment: EquipmentSet;
  allData: {
    armors: Armor[];
    weapons: Weapon[];
    accessories: Accessory[];
    skills: Skill[];
    charms: Charm[];
  };
}

/**
 * The successful response payload from the worker.
 */
export interface SearchSuccessResponse {
  type: "success";
  results: FinalSet[];
}

/**
 * The error response payload from the worker.
 */
export interface SearchErrorResponse {
  type: "error";
  error: string;
}

/**
 * The progress response payload from the worker.
 */
export interface SearchProgressResponse {
  type: "progress";
  current: number;
  total: number;
}

/**
 * Union type for all possible worker responses.
 */
export type SearchResponse =
  | SearchSuccessResponse
  | SearchErrorResponse
  | SearchProgressResponse;
