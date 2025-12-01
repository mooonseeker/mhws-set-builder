import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSetBuilder } from '@/contexts/SetBuilderContext';
import { useSkills } from '@/contexts/SkillContext';
import {
    calculateExtraSkills, evaluateAndSortResults
} from '@/services/set-search/result-evaluator';

import type { FinalSet, SkillWithLevel, Slot } from "@/types";

// Helper function to count remaining slots
const countSlots = (slots: Slot[]): Record<string, number> => {
    return slots.reduce<Record<string, number>>((acc, slot) => {
        if (slot.level > 0) {
            acc[slot.level] = (acc[slot.level] || 0) + 1;
        }
        return acc;
    }, {});
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
        <div className="space-y-4">
            <h2 className="text-xl font-bold">搜索结果</h2>
            {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedResults.map((set, index) => {
                        const remainingSlotsCount = countSlots(set.remainingSlots);
                        const extraSkills = calculateExtraSkills(set, requiredSkills, skillDetails);

                        return (
                            <Card
                                key={index}
                                className="cursor-pointer hover:border-primary transition-colors flex flex-col"
                                onClick={() => handleSelectSet(set)}
                            >
                                <CardHeader>
                                    <CardTitle>配装 {index + 1}</CardTitle>
                                    <CardDescription>点击加载此配装</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col justify-between">
                                    <div>
                                        <h4 className="font-semibold mb-2">额外技能:</h4>
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
                                            <p className="text-sm text-muted-foreground">无</p>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <h4 className="font-semibold mb-2">剩余孔位:</h4>
                                        {Object.keys(remainingSlotsCount).length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(remainingSlotsCount)
                                                    .sort(([a], [b]) => Number(b) - Number(a))
                                                    .map(([slot, count]) => (
                                                        <Badge key={slot} variant="outline">
                                                            Lv{slot} x{count}
                                                        </Badge>
                                                    ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">无</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">暂无搜索结果。</p>
                </div>
            )}
        </div>
    );
}