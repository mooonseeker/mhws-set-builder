/**
 * @fileoverview Hook for accessing the weapon context.
 */

import { useContext } from "react";

import { WeaponContext } from "@/contexts/WeaponContext";

/**
 * Hook for using the Weapon context.
 *
 * @returns The weapon context.
 * @throws {Error} If used outside of a WeaponProvider.
 *
 * @example
 * ```tsx
 * function WeaponList() {
 *   const { weapons, loading, addWeapon } = useWeapon();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       {weapons.map(weapon => <div key={weapon.id}>{weapon.name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWeapon() {
  const context = useContext(WeaponContext);
  if (!context) {
    throw new Error("useWeapon must be used within WeaponProvider");
  }
  return context;
}
