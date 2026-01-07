/**
 * @fileoverview Hook for accessing the armor context.
 */

import { useContext } from "react";

import { ArmorContext } from "@/contexts/ArmorContext";

/**
 * Hook for using the Armor context.
 *
 * @returns The armor context.
 * @throws {Error} If used outside of an ArmorProvider.
 *
 * @example
 * ```tsx
 * function ArmorList() {
 *   const { armor, loading, addArmor } = useArmor();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {armor.map(armor => <div key={armor.id}>{armor.name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useArmor() {
  const context = useContext(ArmorContext);
  if (!context) {
    throw new Error("useArmor must be used within ArmorProvider");
  }
  return context;
}
