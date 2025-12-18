import { useContext } from "react";
import { SkillContext } from "@/contexts/SkillContext";

/**
 * 使用技能Context的Hook
 *
 * @returns 技能Context
 * @throws {Error} 如果在SkillProvider外部使用
 *
 * @example
 * ```tsx
 * function SkillList() {
 *   const { skills, loading, addSkill } = useSkills();
 *
 *   if (loading) return <div>加载中...</div>;
 *
 *   return (
 *     <div>
 *       {skills.map(skill => <div key={skill.id}>{skill.name}</div>)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSkills() {
  const context = useContext(SkillContext);
  if (!context) {
    throw new Error("useSkills must be used within SkillProvider");
  }
  return context;
}
