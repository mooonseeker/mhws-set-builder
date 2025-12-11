import { Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSkills } from "@/contexts";

import type { SkillWithLevel } from "@/types";

interface SkillSelectorProps {
  onSelect: (skill: SkillWithLevel) => void;
  excludeSkillIds?: string[];
}

/**
 * 技能选择器组件
 * 搜索并选择技能，设置等级
 */
export function SkillSelector({
  onSelect,
  excludeSkillIds = [],
}: SkillSelectorProps) {
  const { skills } = useSkills();
  const [search, setSearch] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState<string>("");
  const [level, setLevel] = useState(1);

  // 筛选可用技能
  const availableSkills = skills.filter(
    (s) => !excludeSkillIds.includes(s.id) && s.name.includes(search),
  );

  const selectedSkill = skills.find((s) => s.id === selectedSkillId);

  const handleAdd = () => {
    if (selectedSkillId && level > 0) {
      onSelect({ skillId: selectedSkillId, level });
      setSearch("");
      setSelectedSkillId("");
      setLevel(1);
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
                {skill.name} {skill.isKey && "⭐"}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSkill && (
        <Select
          value={level.toString()}
          onValueChange={(v) => setLevel(parseInt(v))}
        >
          <SelectTrigger className="h-10 w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from(
              { length: selectedSkill.maxLevel },
              (_, i) => i + 1,
            ).map((l) => (
              <SelectItem key={l} value={l.toString()}>
                Lv.{l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button onClick={handleAdd} disabled={!selectedSkillId} className="h-10">
        添加
      </Button>
    </div>
  );
}
