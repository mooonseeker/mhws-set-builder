import { useMemo, useState } from "react";

import { Plus, Search, Star, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SKILL_CATEGORY_LABELS } from "@/constants";
import { useSkills } from "@/hooks";
import { SKILL_CATEGORIES, type Skill, type SkillCategory } from "@/types";

interface KeySkillManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeySkillManager({ open, onOpenChange }: KeySkillManagerProps) {
  const { skills, updateSkill } = useSkills();
  const [searchQuery, setSearchQuery] = useState("");

  const keySkills = useMemo(() => skills.filter((s) => s.isKey), [skills]);
  const otherSkills = useMemo(() => skills.filter((s) => !s.isKey), [skills]);

  // Group key skills by category
  const keySkillsByCategory = useMemo(() => {
    const grouped: Record<SkillCategory, Skill[]> = {
      weapon: [],
      armor: [],
      series: [],
      group: [],
    };
    keySkills.forEach((skill) => {
      grouped[skill.category].push(skill);
    });
    return grouped;
  }, [keySkills]);

  const filteredOtherSkills = useMemo(() => {
    if (!searchQuery) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return otherSkills.filter((s) => s.name.toLowerCase().includes(lowerQuery));
  }, [otherSkills, searchQuery]);

  const toggleKey = (skill: Skill) => {
    updateSkill({ ...skill, isKey: !skill.isKey });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-auto max-h-[80vh] !w-[80vw] !max-w-[80vw] flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Star className="text-warning-foreground fill-warning h-5 w-5" />
            核心技能管理
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-hidden p-6 pt-2">
          {/* Current Key Skills - Grouped by Category */}
          <div className="flex flex-1 flex-col gap-2 overflow-hidden">
            <h3 className="text-muted-foreground text-sm font-medium">
              当前核心技能 ({keySkills.length})
            </h3>
            <div className="border-input flex-1 overflow-y-auto rounded-md border p-4">
              {keySkills.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {(SKILL_CATEGORIES as readonly SkillCategory[]).map(
                    (category) => {
                      const categorySkills = keySkillsByCategory[category];
                      if (categorySkills.length === 0) return null;

                      return (
                        <div key={category} className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={`/skill-category/${category}.png`}
                              alt={SKILL_CATEGORY_LABELS[category]}
                              className="h-4 w-4 opacity-70"
                            />
                            <span className="text-muted-foreground text-xs font-medium">
                              {SKILL_CATEGORY_LABELS[category]}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {categorySkills.map((skill) => (
                              <Badge
                                key={skill.id}
                                variant="secondary"
                                className="hover:bg-accent hover:text-accent-foreground flex items-center gap-1 px-2 py-1 text-sm transition-colors"
                              >
                                {skill.name}
                                <button
                                  onClick={() => toggleKey(skill)}
                                  className="text-muted-foreground hover:text-destructive ml-1 rounded-full p-0.5 transition-colors focus:outline-hidden"
                                >
                                  <X className="h-3 w-3" />
                                  <span className="sr-only">移除</span>
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-2 text-sm italic">
                  <Star className="text-muted-foreground/30 h-8 w-8" />
                  <p>暂无核心技能，请在下方搜索添加</p>
                </div>
              )}
            </div>
          </div>

          {/* Add New Key Skill */}
          <div className="shrink-0 space-y-2">
            <h3 className="text-muted-foreground text-sm font-medium">
              添加核心技能
            </h3>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="搜索技能名称以添加..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {searchQuery && (
              <div className="border-input bg-popover mt-2 max-h-40 overflow-y-auto rounded-md border shadow-md">
                {filteredOtherSkills.length > 0 ? (
                  <div className="divide-border flex flex-col divide-y">
                    {filteredOtherSkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-2 px-3 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={`/skill-category/${skill.category}.png`}
                            alt={skill.category}
                            className="h-4 w-4 opacity-70"
                          />
                          <span className="text-sm">{skill.name}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            toggleKey(skill);
                            // We don't clear search query so user can keep adding
                          }}
                          className="hover:bg-accent hover:text-accent-foreground h-7 gap-1 px-2 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          添加
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground py-4 text-center text-sm">
                    未找到匹配的非核心技能
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
