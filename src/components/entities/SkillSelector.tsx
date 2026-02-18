/**
 * @fileoverview SkillSelector component for searching and adding skills.
 * Default level is 1; level adjustment is handled by the parent list.
 */

import { useState } from "react";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSkills } from "@/hooks";
import type { SkillWithLevel } from "@/types";

/** Props for the SkillSelector component. */
interface SkillSelectorProps {
  onSelect: (skill: SkillWithLevel) => void;
  excludeSkillIds?: string[];
}

/**
 * Skill selector component that allows searching for and selecting skills.
 */
export function SkillSelector({
  onSelect,
  excludeSkillIds = [],
}: SkillSelectorProps) {
  const { skills, isKeySkill } = useSkills();
  const [search, setSearch] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");

  // Filter available skills based on search and exclusions
  const availableSkills = skills.filter(
    (s) => !excludeSkillIds.includes(s.id) && s.name.includes(search),
  );

  const handleAdd = () => {
    if (selectedSkillId) {
      onSelect({ skillId: selectedSkillId, level: 1 });
      setSearch("");
      setSelectedSkillId("");
    }
  };

  return (
    <div className="flex h-10 gap-2">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="搜索技能..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter" && selectedSkillId) {
              handleAdd();
            }
          }}
        />
        {search && availableSkills.length > 0 && (
          <div className="bg-background absolute top-full right-0 left-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-md border shadow-lg">
            {availableSkills.map((skill) => (
              <button
                key={skill.id}
                className="hover:bg-accent w-full px-3 py-2 text-left"
                onClick={() => {
                  setSelectedSkillId(skill.id);
                  setSearch(skill.name);
                }}
              >
                {skill.name} {isKeySkill(skill.id) && "⭐"}
              </button>
            ))}
          </div>
        )}
      </div>

      <Button onClick={handleAdd} disabled={!selectedSkillId} className="h-10">
        添加
      </Button>
    </div>
  );
}
