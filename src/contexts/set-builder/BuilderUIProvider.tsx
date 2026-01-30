/**
 * @fileoverview Provider component for the Builder UI Context.
 * Orchestrates interaction between Equipment and Search contexts.
 */

import React, { useContext, type ReactNode } from "react";

import { useBuilderInterface } from "@/hooks/set-builder/useBuilderInterface";

import { BuilderUIContext } from "./BuilderUIContext";
import { EquipmentContext } from "./EquipmentContext";
import { SearchContext } from "./SearchContext";

interface BuilderUIProviderProps {
  children: ReactNode;
}

export const BuilderUIProvider: React.FC<BuilderUIProviderProps> = ({
  children,
}) => {
  const eqContext = useContext(EquipmentContext);
  const searchContext = useContext(SearchContext);

  if (!eqContext || !searchContext) {
    throw new Error(
      "BuilderUIProvider must be used within an EquipmentProvider and SearchProvider",
    );
  }

  const uiInterface = useBuilderInterface({
    lockedSlots: eqContext.lockedSlots,
    currentEquipmentSet: eqContext.currentEquipmentSet,
    performSearch: searchContext.confirmSearch,
    applyFinalSet: eqContext.applyFinalSet,
  });

  return (
    <BuilderUIContext.Provider value={uiInterface}>
      {children}
    </BuilderUIContext.Provider>
  );
};
