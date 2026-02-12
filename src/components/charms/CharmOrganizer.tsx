/**
 * @fileoverview A tool for batch organizing charms, including rating updates and inferior charm filtering.
 */

import { useMemo, useState } from "react";

import { Check, Loader2, Merge, RefreshCw, Trash2, Wand2 } from "lucide-react";

import { EquipmentCard } from "@/components/entities";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useCharms, useSkills } from "@/hooks";
import type { Charm, Skill } from "@/types";
import {
  calculateCharmEquivalentSlots,
  calculateKeySkillValue,
  isSuperior,
} from "@/utils";

/**
 * CharmOrganizer component provides an interface for batch management of charms.
 * Optimized for a professional dashboard-like experience with fixed vertical headers.
 */
export function CharmOrganizer() {
  const { charms, importCharms, deleteCharms } = useCharms();
  const { skills: allSkills } = useSkills();

  // Create a skill map for O(1) lookups during batch processing
  const skillMap = useMemo(() => {
    const map = new Map<string, Skill>();
    allSkills.forEach((s) => map.set(s.id, s));
    return map;
  }, [allSkills]);

  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [inferiorCharms, setInferiorCharms] = useState<
    { target: Charm; betterBy: Charm }[]
  >([]);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [updatedCount, setUpdatedCount] = useState(0);

  // Stats for the header
  const totalCharms = charms.length;

  const handleUpdateValue = () => {
    setIsProcessing(true);
    setProgress(0);
    setLastAction("更新等效价值");
    setUpdatedCount(0);
    setInferiorCharms([]);

    setTimeout(() => {
      let count = 0;
      const updatedCharms = charms.map((charm, index) => {
        const keySkillValue = calculateKeySkillValue(
          charm.skills,
          charm.slots,
          allSkills,
        );
        const equivalentSlots = calculateCharmEquivalentSlots(
          charm.skills,
          charm.slots,
          allSkills,
        );

        if (
          keySkillValue !== charm.keySkillValue ||
          JSON.stringify(equivalentSlots) !==
            JSON.stringify(charm.equivalentSlots)
        ) {
          count++;
        }

        if (index % 10 === 0) setProgress((index / charms.length) * 100);
        return { ...charm, keySkillValue, equivalentSlots };
      });
      setUpdatedCount(count);
      importCharms(updatedCharms);
      setIsProcessing(false);
      setProgress(100);
    }, 100);
  };

  const handleFilterInferior = () => {
    setIsProcessing(true);
    setProgress(0);
    setLastAction("筛查下位护石");
    setUpdatedCount(0);

    setTimeout(() => {
      const found: { target: Charm; betterBy: Charm }[] = [];
      for (let i = 0; i < charms.length; i++) {
        const candidate = charms[i];
        let superior: Charm | null = null;
        for (let j = 0; j < charms.length; j++) {
          if (i === j) continue;
          // Use the new deep comparison logic with the indexed skill map
          if (isSuperior(charms[j], candidate, skillMap)) {
            superior = charms[j];
            break;
          }
        }
        if (superior) found.push({ target: candidate, betterBy: superior });
        if (i % 10 === 0) setProgress((i / charms.length) * 100);
      }
      setInferiorCharms(found);
      setIsProcessing(false);
      setProgress(100);
    }, 100);
  };

  const handleOneClickOrganize = () => {
    setIsProcessing(true);
    setProgress(0);
    setLastAction("一键整理");

    setTimeout(() => {
      let count = 0;
      const updatedCharms = charms.map((charm) => {
        const keySkillValue = calculateKeySkillValue(
          charm.skills,
          charm.slots,
          allSkills,
        );
        const equivalentSlots = calculateCharmEquivalentSlots(
          charm.skills,
          charm.slots,
          allSkills,
        );

        if (
          keySkillValue !== charm.keySkillValue ||
          JSON.stringify(equivalentSlots) !==
            JSON.stringify(charm.equivalentSlots)
        ) {
          count++;
        }
        return { ...charm, keySkillValue, equivalentSlots };
      });

      const found: { target: Charm; betterBy: Charm }[] = [];
      for (let i = 0; i < updatedCharms.length; i++) {
        const candidate = updatedCharms[i];
        let superior: Charm | null = null;
        for (let j = 0; j < updatedCharms.length; j++) {
          if (i === j) continue;
          if (isSuperior(updatedCharms[j], candidate, skillMap)) {
            superior = updatedCharms[j];
            break;
          }
        }
        if (superior) found.push({ target: candidate, betterBy: superior });
      }

      setUpdatedCount(count);
      importCharms(updatedCharms);
      setInferiorCharms(found);
      setIsProcessing(false);
      setProgress(100);
    }, 100);
  };

  const handleDeleteSingle = (id: string) => {
    deleteCharms([id]);
    setInferiorCharms((prev) => prev.filter((item) => item.target.id !== id));
  };

  const confirmDeletion = () => {
    const idsToDelete = inferiorCharms.map((item) => item.target.id);
    deleteCharms(idsToDelete);
    setInferiorCharms([]);
    setLastAction("清理完成");
  };

  const resetState = () => {
    setIsProcessing(false);
    setProgress(0);
    setInferiorCharms([]);
    setLastAction(null);
    setUpdatedCount(0);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg">
          <Wand2 className="mr-2 h-5 w-5" />
          整理护石
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[95vh]! max-h-[95vh]! w-[60vw]! max-w-[60vw]! flex-col gap-2 overflow-hidden p-0 2xl:gap-3">
        <DialogHeader className="shrink-0 px-4 pt-1 pb-1.5">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">整理护石</DialogTitle>
              <DialogDescription className="text-xs">
                更新等效核心技能价值并清理下位护石。
              </DialogDescription>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-[10px] font-bold uppercase">
                总数
              </div>
              <div className="text-lg leading-none font-black">
                {totalCharms}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden px-3 py-0 2xl:gap-4 2xl:px-4 2xl:pb-4">
          <div className="grid shrink-0 grid-cols-3 gap-2 2xl:gap-3">
            <CompactCard
              title="更新等效价值"
              icon={<RefreshCw className="h-5 w-5" />}
              onClick={handleUpdateValue}
              disabled={isProcessing}
            />
            <CompactCard
              title="筛查下位护石"
              icon={<Trash2 className="h-5 w-5" />}
              onClick={handleFilterInferior}
              disabled={isProcessing}
            />
            <CompactCard
              title="一键整理护石"
              icon={<Wand2 className="text-primary h-5 w-5" />}
              onClick={handleOneClickOrganize}
              disabled={isProcessing}
              highlight
            />
          </div>

          <div className="bg-muted/30 relative flex flex-1 flex-col overflow-hidden rounded-lg border p-4">
            {/* Progress indicator */}
            {isProcessing && (
              <div className="animate-in fade-in zoom-in-95 flex flex-1 flex-col items-center justify-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  <Loader2 className="text-primary h-12 w-12 animate-spin" />
                  <span className="absolute text-[10px] font-black">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="w-full max-w-xs space-y-2">
                  <div className="text-muted-foreground flex justify-between text-[10px] font-bold tracking-wider uppercase">
                    <span>{lastAction}</span>
                    <span>Processing</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              </div>
            )}

            {!isProcessing && lastAction === null && (
              <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 opacity-60">
                <Wand2 className="h-10 w-10" />
                <p className="text-sm">请选择上方功能开始整理</p>
              </div>
            )}

            {/* Rating update results feedback */}
            {!isProcessing && lastAction === "更新等效价值" && (
              <div className="text-muted-foreground animate-in fade-in zoom-in-95 flex flex-1 flex-col items-center justify-center gap-2">
                <div
                  className={`rounded-full p-3 ${
                    updatedCount > 0
                      ? "bg-green-100 dark:bg-green-900/40"
                      : "bg-muted/50"
                  }`}
                >
                  <Check
                    className={`h-10 w-10 ${
                      updatedCount > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground/60"
                    }`}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">
                    {updatedCount > 0
                      ? `已更新 ${updatedCount} 个护石的等效核心技能价值`
                      : "所有护石均已匹配核心技能列表"}
                  </p>
                </div>
              </div>
            )}

            {/* Inferior charm filter results feedback (Empty state) */}
            {!isProcessing &&
              (lastAction === "筛查下位护石" || lastAction === "清理完成") &&
              inferiorCharms.length === 0 && (
                <div className="text-muted-foreground animate-in fade-in zoom-in-95 flex flex-1 flex-col items-center justify-center gap-2 opacity-60">
                  <div
                    className={`rounded-full p-3 ${lastAction === "清理完成" ? "bg-green-100 dark:bg-green-900/40" : "bg-blue-100 dark:bg-blue-900/40"}`}
                  >
                    <Check
                      className={`h-10 w-10 ${lastAction === "清理完成" ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}
                    />
                  </div>
                  <p className="text-sm font-bold">
                    {lastAction === "清理完成"
                      ? "清理完成"
                      : "护石数据库状态良好"}
                  </p>
                  <p className="text-xs">
                    {lastAction === "清理完成"
                      ? "下位护石已全部清理"
                      : "无可清理的下位护石"}
                  </p>
                </div>
              )}

            {inferiorCharms.length > 0 && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex flex-1 overflow-hidden">
                  {/* Fixed Sidebar Labels & Action Button */}
                  <div className="border-muted/50 mr-4 flex w-10 shrink-0 flex-col items-center border-r pb-4 text-[11px] font-black tracking-[0.2em] uppercase">
                    <div className="text-muted-foreground/60 flex flex-1 items-center justify-center [writing-mode:vertical-rl]">
                      上位护石
                    </div>

                    <div className="flex shrink-0 items-center justify-center py-4">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={confirmDeletion}
                        className="h-auto w-8 flex-col gap-1 rounded-md px-0 py-2 shadow-sm transition-all hover:scale-125 active:scale-95"
                        title={`一键清理 (${inferiorCharms.length})`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="text-[10px] leading-none font-bold">
                          {inferiorCharms.length}
                        </span>
                      </Button>
                    </div>

                    <div className="text-muted-foreground/60 flex flex-1 items-center justify-center [writing-mode:vertical-rl]">
                      下位护石
                    </div>
                  </div>

                  {/* Scrollable Content Area */}
                  <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent flex-1 overflow-x-auto overflow-y-hidden pb-4">
                    <div className="flex h-full items-stretch gap-6">
                      {inferiorCharms.map((pair, idx) => (
                        <div
                          key={idx}
                          className="bg-background flex w-75 shrink-0 flex-col rounded-xl border p-4 shadow-sm"
                        >
                          {/* Top: Better Charm */}
                          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                            <EquipmentCard
                              item={pair.betterBy}
                              variant="default"
                            />
                          </div>

                          {/* Middle: Merged Single Action Button */}
                          <div className="relative z-10 flex shrink-0 items-center justify-center py-4">
                            <div className="bg-muted h-px flex-1"></div>
                            <button
                              onClick={() => handleDeleteSingle(pair.target.id)}
                              className="bg-primary border-background ring-primary/5 flex items-center justify-center rounded-full border-2 p-2 text-white shadow-md ring-4 transition-all hover:scale-125"
                            >
                              <Merge className="h-4 w-4" />
                            </button>
                            <div className="bg-muted h-px flex-1"></div>
                          </div>

                          {/* Bottom: Inferior Charm */}
                          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                            <div className="opacity-70 grayscale-[0.2]">
                              <EquipmentCard
                                item={pair.target}
                                variant="default"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompactCard({
  title,
  icon,
  onClick,
  disabled,
  highlight,
}: {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 transition-all ${highlight ? "border-primary/40 bg-primary/5 hover:bg-primary/10" : "border-border hover:bg-muted bg-card"} ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
    >
      <div
        className={`${highlight ? "text-primary" : "text-muted-foreground"}`}
      >
        {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      </div>
      <span className="truncate text-sm font-bold">{title}</span>
    </button>
  );
}
