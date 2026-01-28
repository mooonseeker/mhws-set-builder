/**
 * @fileoverview View component for displaying and selecting from search results.
 */

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSetBuilder, useSkills } from "@/hooks";
import {
  calculateExtraSkills,
  evaluateAndSortResults,
} from "@/services/set-search/result-evaluator";
import type { FinalSet, Slot, SlotType } from "@/types";

/**
 * Counts the remaining empty slots grouped by equipment type and slot level.
 * @param slots Array of remaining slots in a set.
 */
const countSlotsByType = (slots: Slot[]) => {
  const counts: Record<SlotType, Record<string, number>> = {
    weapon: { "1": 0, "2": 0, "3": 0 },
    armor: { "1": 0, "2": 0, "3": 0 },
  };

  slots.forEach((slot) => {
    if (slot.level > 0) {
      counts[slot.type][slot.level] += 1;
    }
  });

  return counts;
};

/**
 * Displays a list of search results with details on remaining slots and extra skills.
 */
export function SearchResultsView() {
  const {
    requiredSkills,
    searchResults,
    loadSetToBuilder,
    isSearching,
    searchProgress,
    searchStatus,
  } = useSetBuilder();
  const { skills, getSkillById } = useSkills();

  const skillDetails = useMemo(
    () => new Map(skills.map((skill) => [skill.id, skill])),
    [skills],
  );

  const sortedResults = useMemo(() => {
    if (!searchResults || searchResults.length === 0) return [];
    return evaluateAndSortResults(searchResults, requiredSkills, skillDetails);
  }, [searchResults, requiredSkills, skillDetails]);

  const handleSelectSet = (set: FinalSet) => {
    loadSetToBuilder(set);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>搜索结果</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSearching ? (
          <div className="flex h-64 flex-col items-center justify-center space-y-6">
            <div className="w-full max-w-md space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-medium">
                  {searchStatus || "正在计算最优配装..."}
                </span>
                <span className="font-mono">{searchProgress ?? 0}%</span>
              </div>
              <Progress value={searchProgress ?? 0} className="h-2" />
              <p className="text-muted-foreground text-center text-xs">
                搜索过程中请勿切换 Tab 或修改技能需求
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              下方搜索结果仅展示剩余孔位及额外技能，点击可加载配装。
            </p>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {sortedResults.map((set, index) => {
                  const remainingSlotsCount = countSlotsByType(
                    set.remainingSlots,
                  );
                  const extraSkills = calculateExtraSkills(set, requiredSkills);

                  return (
                    <div
                      key={index}
                      className="flex w-full items-stretch gap-3"
                    >
                      <Badge
                        variant="outline"
                        className="flex min-h-20 w-16 flex-none items-center justify-center self-stretch px-3 font-mono text-lg"
                      >
                        #{index + 1}
                      </Badge>
                      <Card
                        className="hover:border-primary flex-1 cursor-pointer transition-colors"
                        onClick={() => handleSelectSet(set)}
                      >
                        <CardContent className="space-y-3 p-4">
                          // Remaining Slots Section
                          <div className="flex flex-wrap gap-x-4 gap-y-2">
                            {(["weapon", "armor"] as SlotType[]).map((type) => (
                              <div
                                key={type}
                                className="flex min-w-max items-center gap-2"
                              >
                                <span className="text-muted-foreground mr-1 text-xs font-medium tracking-wider uppercase">
                                  {type}:
                                </span>
                                {[3, 2, 1].map((level) => {
                                  const count =
                                    remainingSlotsCount[type][level];
                                  const isEmpty = count === 0;
                                  return (
                                    <div
                                      key={level}
                                      className="flex items-center gap-1"
                                    >
                                      <img
                                        src={`/slot/${type}-slot-${level}.png`}
                                        alt={`${type} slot lv${level}`}
                                        className={`h-5 w-5 ${isEmpty ? "opacity-30" : ""}`}
                                      />
                                      <span
                                        className={`text-xs ${isEmpty ? "text-muted-foreground" : "font-medium"}`}
                                      >
                                        {isEmpty ? "—" : `x${count}`}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                            {set.remainingSlots.every(
                              (slot) => slot.level <= 0,
                            ) && (
                              <p className="text-muted-foreground col-span-full text-sm">
                                无剩余孔位
                              </p>
                            )}
                          </div>
                          // Extra Skills Section
                          {extraSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {extraSkills.map(({ skillId, level }) => {
                                const skill = getSkillById(skillId);
                                return (
                                  <Badge key={skillId} variant="secondary">
                                    {skill?.name ?? skillId} Lv{level}
                                  </Badge>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              无额外技能
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center">
                <p className="text-muted-foreground">暂无搜索结果。</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
