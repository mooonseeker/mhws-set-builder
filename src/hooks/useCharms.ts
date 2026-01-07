/**
 * @fileoverview Hook for accessing the charm context.
 */

import { useContext } from "react";

import { CharmContext } from "@/contexts/CharmContext";

/**
 * Hook for using the Charm context.
 *
 * @returns The charm context.
 * @throws {Error} If used outside of a CharmProvider.
 *
 * @example
 * ```tsx
 * function CharmList() {
 *   const { charms, loading, addCharm, deleteCharm } = useCharms();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {charms.map(charm => (
 *         <div key={charm.id}>
 *           Rarity: {charm.rarity}
 *           <button onClick={() => deleteCharm(charm.id)}>Delete</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCharms() {
  const context = useContext(CharmContext);
  if (!context) {
    throw new Error("useCharms must be used within CharmProvider");
  }
  return context;
}
