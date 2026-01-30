/**
 * @fileoverview Provider component for the Equipment Context.
 * Wraps the application part that requires access to equipment state.
 */

import React, { type ReactNode } from "react";

import { useEquipmentModel } from "@/hooks/set-builder/useEquipmentModel";

import { EquipmentContext } from "./EquipmentContext";

interface EquipmentProviderProps {
  children: ReactNode;
}

export const EquipmentProvider: React.FC<EquipmentProviderProps> = ({
  children,
}) => {
  const equipmentModel = useEquipmentModel();

  return (
    <EquipmentContext.Provider value={equipmentModel}>
      {children}
    </EquipmentContext.Provider>
  );
};
