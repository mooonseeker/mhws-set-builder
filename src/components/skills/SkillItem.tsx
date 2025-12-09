import { Square } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSkills } from '@/contexts';
import { cn } from '@/lib/utils';

interface SkillItemProps {
    skillId: string;
    level: number;
    variant?: 'full' | 'default' | 'compact';
}

export function SkillItem({ skillId, level, variant = 'default' }: SkillItemProps) {
    const { getSkillById } = useSkills();
    const skill = getSkillById(skillId);
    const [isTruncated, setIsTruncated] = useState(false);
    const nameRef = useRef<HTMLSpanElement>(null);

    const name = skill?.name;

    useLayoutEffect(() => {
        const checkTruncation = () => {
            if (nameRef.current) {
                setIsTruncated(nameRef.current.scrollWidth > nameRef.current.offsetWidth);
            }
        };

        checkTruncation();
        window.addEventListener('resize', checkTruncation);
        return () => window.removeEventListener('resize', checkTruncation);
    }, [name, variant]);

    if (!skill) {
        return null;
    }

    const { maxLevel, type, isKey } = skill;
    const isMaxLevel = level >= maxLevel;
    const isOverflow = level > maxLevel;

    // 生成等级方块（使用 lucide Square 图标）
    const levelBlocks = Array.from({ length: maxLevel }, (_, i) => {
        const isActive = i < level;
        return (
            <Square
                key={i}
                className={cn(
                    "w-3 h-3",
                    isActive ? "fill-warning text-warning" : "fill-foreground text-foreground"
                )}
            />
        );
    });

    // 根据 variant 决定样式
    const heightClass = variant === 'full' ? 'h-8' : 'h-6';
    const iconSizeClass = variant === 'full' ? 'w-5 h-5' : 'w-4 h-4';
    const textSizeClass = variant === 'full' ? 'text-sm' : 'text-xs';
    const showIcon = variant !== 'compact';

    return (
        <div
            className={cn(
                "flex items-center justify-between gap-2",
                heightClass
            )}
        >
            <div className="flex items-center gap-1.5 min-w-0">
                {showIcon && (
                    <img
                        src={`/skill-type/${type}.png`}
                        alt={name}
                        className={cn(iconSizeClass)}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                )}
                <TooltipProvider>
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                            <span
                                ref={nameRef}
                                className={cn(
                                    "truncate cursor-default",
                                    textSizeClass,
                                    isKey ? "font-bold" : "font-medium"
                                )}
                            >
                                {name}
                            </span>
                        </TooltipTrigger>
                        {isTruncated && (
                            <TooltipContent>
                                <p>{name}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            </div>
            <div className="flex items-center shrink-0">
                {variant === 'full' ? (
                    <>
                        <div
                            className="flex items-center gap-0.5 text-xs"
                            aria-label={`等级 ${level}/${maxLevel}`}
                        >
                            {levelBlocks}
                        </div>
                        <span
                            className={cn(
                                "text-sm w-8 text-right",
                                isOverflow ? "text-destructive font-bold text-base" : isMaxLevel && "text-accent font-bold text-base"
                            )}
                        >
                            Lv{level}
                        </span>
                    </>
                ) : (
                    <span
                        className={cn(
                            "text-xs text-muted-foreground text-right",
                            "w-10",
                            isMaxLevel && "text-accent font-bold"
                        )}
                    >
                        Lv {level}/{maxLevel}
                    </span>
                )}
            </div>
        </div>
    );
}