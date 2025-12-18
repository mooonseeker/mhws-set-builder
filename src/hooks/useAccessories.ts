import { useContext } from "react";
import { AccessoryContext } from "@/contexts/AccessoryContext";

/**
 * 使用装饰品Context的Hook
 *
 * @returns 装饰品Context
 * @throws {Error} 如果在AccessoryProvider外部使用
 *
 * @example
 * ```tsx
 * function AccessoryList() {
 *   const { accessories, loading, addAccessory } = useAccessories();
 *
 *   if (loading) return <div>加载中...</div>;
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
