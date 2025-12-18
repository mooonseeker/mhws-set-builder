import { useContext } from "react";
import { ArmorContext } from "@/contexts/ArmorContext";

/**
 * 使用防具Context的Hook
 *
 * @returns 防具Context
 * @throws {Error} 如果在ArmorProvider外部使用
 *
 * @example
 * ```tsx
 * function ArmorList() {
 *   const { armor, loading, addArmor } = useArmor();
 *
 *   if (loading) return <div>加载中...</div>;
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
