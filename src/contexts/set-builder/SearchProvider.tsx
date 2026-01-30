/**
 * @fileoverview Provider component for the Search Context.
 * Depends on EquipmentContext to function.
 */

import React, { useContext, type ReactNode } from "react";

import { useSearchService } from "@/hooks/set-builder/useSearchService";

import { EquipmentContext } from "./EquipmentContext";
import { SearchContext } from "./SearchContext";

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const eqContext = useContext(EquipmentContext);

  if (!eqContext) {
    throw new Error("SearchProvider must be used within an EquipmentProvider");
  }

  const searchService = useSearchService({
    currentEquipmentSet: eqContext.currentEquipmentSet,
    lockedSlots: eqContext.lockedSlots,
  });

  return (
    <SearchContext.Provider value={searchService}>
      {children}
    </SearchContext.Provider>
  );
};
