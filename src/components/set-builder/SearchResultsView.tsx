import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSetBuilder } from '@/contexts/SetBuilderContext';
import { useSkills } from '@/contexts/SkillContext';
import {
    calculateExtraSkills, evaluateAndSortResults
} from '@/services/set-search/result-evaluator';

import type { FinalSet, Slot, SlotType } from "@/types";

// Helper function to count remaining slots by type
const countSlotsByType = (slots: Slot[]) => {
    const counts: Record<SlotType, Record<string, number>> = {
        weapon: { '1': 0, '2': 0, '3': 0 },
        armor: { '1': 0, '2': 0, '3': 0 },
    };

    slots.forEach((slot) => {
        if (slot.level > 0) {
            counts[slot.type][slot.level] += 1;
        }
    });

    return counts;
};

export function SearchResultsView() {
    const {
        requiredSkills,
        searchResults,
        loadSetToBuilder,
    } = useSetBuilder();
    const { skills, getSkillById } = useSkills();

    const skillDetails = useMemo(
        () => new Map(skills.map((skill) => [skill.id, skill])),
        [skills]
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
                <p className="text-sm text-muted-foreground">
                    下方搜索结果仅展示剩余孔位及额外技能，点击可加载配装。
                </p>
                {searchResults.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {sortedResults.map((set, index) => {
                            const remainingSlotsCount = countSlotsByType(set.remainingSlots);
                            const extraSkills = calculateExtraSkills(set, requiredSkills);

                            return (
                                <div key={index} className="flex items-stretch gap-3 w-full">
                                    <Badge
                                        variant="outline"
                                        className="flex-none self-stretch flex items-center justify-center px-3 font-mono text-lg min-h-[80px] w-16"
                                    >
                                        #{index + 1}
                                    </Badge>
                                    <Card
                                        className="flex-1 cursor-pointer hover:border-primary transition-colors"
                                        onClick={() => handleSelectSet(set)}
                                    >
                                        <CardContent className="p-4 space-y-3">
                                            {/* Remaining Slots Section */}
                                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                {(['weapon', 'armor'] as SlotType[]).map((type) => (
                                                    <div key={type} className="flex items-center gap-2 min-w-max">
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">
                                                            {type}:
                                                        </span>
                                                        {[3, 2, 1].map((level) => {
                                                            const count = remainingSlotsCount[type][level];
                                                            const isEmpty = count === 0;
                                                            return (
                                                                <div key={level} className="flex items-center gap-1">
                                                                    <img
                                                                        src={`/slot/${type}-slot-${level}.png`}
                                                                        alt={`${type} slot lv${level}`}
                                                                        className={`w-5 h-5 ${isEmpty ? 'opacity-30' : ''}`}
                                                                    />
                                                                    <span className={`text-xs ${isEmpty ? 'text-muted-foreground' : 'font-medium'}`}>
                                                                        {isEmpty ? '—' : `x${count}`}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                                {set.remainingSlots.every(slot => slot.level <= 0) && (
                                                    <p className="text-sm text-muted-foreground col-span-full">无剩余孔位</p>
                                                )}
                                            </div>

                                            {/* Extra Skills Section */}
                                            {extraSkills.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {extraSkills.map(({ skillId, level }) => {
                                                        const skill = getSkillById(skillId);
                                                        return (
                                                            <Badge key={skillId} variant="secondary">
                                                                {skill?.name || skillId} Lv{level}
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">无额外技能</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-muted-foreground">暂无搜索结果。</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}