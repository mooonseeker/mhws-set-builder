import { useContext } from "react";
import { WeaponContext } from "@/contexts/WeaponContext";

/**
 * 使用武器Context的Hook
 *
 * @returns 武器Context
 * @throws {Error} 如果在WeaponProvider外部使用
 *
 * @example
 * ```tsx
 * function WeaponList() {
 *   const { weapons, loading, addWeapon } = useWeapon();
 *
 *   if (loading) return <div>加载中...</div>;
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
