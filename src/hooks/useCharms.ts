import { useContext } from "react";
import { CharmContext } from "@/contexts/CharmContext";

/**
 * 使用护石Context的Hook
 *
 * @returns 护石Context
 * @throws {Error} 如果在CharmProvider外部使用
 *
 * @example
 * ```tsx
 * function CharmList() {
 *   const { charms, loading, addCharm, deleteCharm } = useCharms();
 *
 *   if (loading) return <div>加载中...</div>;
 *
 *   return (
 *     <div>
 *       {charms.map(charm => (
 *         <div key={charm.id}>
 *           稀有度: {charm.rarity}
 *           <button onClick={() => deleteCharm(charm.id)}>删除</button>
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
