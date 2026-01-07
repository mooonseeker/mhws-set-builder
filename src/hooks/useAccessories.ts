/**
 * @fileoverview Hook for accessing the accessory context.
 */

import { useContext } from "react";

import { AccessoryContext } from "@/contexts/AccessoryContext";

/**
 * Hook for using the Accessory context.
 *
 * @returns The accessory context.
 * @throws {Error} If used outside of an AccessoryProvider.
 *
 * @example
 * ```tsx
 * function AccessoryList() {
 *   const { accessories, loading, addAccessory } = useAccessories();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {accessories.map(accessory => <div key={accessory.id}>{accessory.name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccessories() {
  const context = useContext(AccessoryContext);
  if (!context) {
    throw new Error("useAccessories must be used within AccessoryProvider");
  }
  return context;
}
