/**
 * @fileoverview Hook for accessing the skill context.
 */

import { useContext } from "react";

import { SkillContext } from "@/contexts/SkillContext";

/**
 * Hook for using the Skill context.
 *
 * @returns The skill context.
 * @throws {Error} If used outside of a SkillProvider.
 *
 * @example
 * ```tsx
 * function SkillList() {
 *   const { skills, loading, addSkill } = useSkills();
 *
 *   if (loading) return <div>Loading...</div>;
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
