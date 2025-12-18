import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useCharms, useSkills, useCharmOperations } from "@/hooks";
import {
  calculateCharmEquivalentSlots,
  calculateKeySkillValue,
  validateCharm,
} from "@/utils";

import { CharmForm } from "./CharmForm";
import { CharmList } from "./CharmList";
import { CharmValidation } from "./CharmValidation";

import type { Charm, SkillWithLevel, Slot, SlotType, SlotLevel } from "@/types";

/**
 * 护石管理主组件
 *
 * 整合所有护石相关功能，包括状态管理和布局。
 */
export function CharmManager() {
  // 弹窗和编辑状态
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [charmToEdit, setCharmToEdit] = useState<Charm | null>(null);

  // 从 context 和 hooks 获取数据和操作
  const { charms } = useCharms();
  const { skills: allSkills } = useSkills();
  const { createCharm, updateAndRecalculateCharm } = useCharmOperations();

  // 表单状态
  const [rarity, setRarity] = useState(7);
  const [selectedSkills, setSelectedSkills] = useState<SkillWithLevel[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  // 重置表单
  const resetForm = () => {
    setRarity(7);
    setSelectedSkills([]);
    setSlots([]);
  };

  // 初始化表单
  const initializeForm = (charm: Charm) => {
    setRarity(charm.rarity);
    setSelectedSkills(charm.skills);
    setSlots(charm.slots);
  };

  // 实时计算等效孔位和核心技能价值
  const { equivalentSlots, keySkillValue } = useMemo(() => {
    const eq = calculateCharmEquivalentSlots(selectedSkills, slots, allSkills);
    const kv = calculateKeySkillValue(selectedSkills, slots, allSkills);
    return { equivalentSlots: eq, keySkillValue: kv };
  }, [selectedSkills, slots, allSkills]);

  // 实时验证
  const validation = useMemo(() => {
    if (selectedSkills.length === 0) return null;

    // 在编辑模式下，从验证列表中排除当前正在编辑的护石
    const charmsForValidation = charmToEdit
      ? charms.filter((c) => c.id !== charmToEdit.id)
      : charms;

    return validateCharm(
      {
        rarity,
        skills: selectedSkills,
        slots,
        equivalentSlots,
        keySkillValue,
      },
      charmsForValidation,
      allSkills,
    );
  }, [
    rarity,
    selectedSkills,
    slots,
    equivalentSlots,
    keySkillValue,
    charms,
    allSkills,
    charmToEdit,
  ]);

  // 添加技能
  const handleAddSkill = (skill: SkillWithLevel) => {
    if (selectedSkills.length >= 3) return;
    const newSkills = [...selectedSkills, skill].sort((a, b) => {
      const skillA = allSkills.find((s) => s.id === a.skillId);
      const skillB = allSkills.find((s) => s.id === b.skillId);
      if (!skillA || !skillB) return 0;
      if (skillA.isKey !== skillB.isKey) return skillA.isKey ? -1 : 1;
      return b.level - a.level;
    });
    setSelectedSkills(newSkills);
  };

  // 删除技能
  const handleRemoveSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s.skillId !== skillId));
  };

  // 添加孔位
  const handleAddSlot = () => {
    if (slots.length >= 3) return;
    setSlots([...slots, { type: "weapon", level: 1 }]);
  };

  // 更新孔位
  const handleUpdateSlot = (
    index: number,
    type: SlotType,
    level: SlotLevel,
  ) => {
    const newSlots = [...slots];
    newSlots[index] = { type, level };
    setSlots(newSlots);
  };

  // 删除孔位
  const handleRemoveSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  // 提交表单
  const handleSubmit = () => {
    if (selectedSkills.length === 0) {
      alert("请至少选择一个技能");
      return;
    }

    if (charmToEdit) {
      updateAndRecalculateCharm(charmToEdit.id, {
        rarity,
        skills: selectedSkills,
        slots,
      });
    } else {
      createCharm({ rarity, skills: selectedSkills, slots });
    }

    setIsFormOpen(false);
    setCharmToEdit(null);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setCharmToEdit(null);
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-baseline">
          <h1 className="font-bold tracking-tight">护石管理</h1>
          <p className="text-foreground">管理你的护石收藏，智能评估护石价值</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <Button
            size="lg"
            onClick={() => {
              resetForm();
              setCharmToEdit(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-5 w-5" />
            添加护石
          </Button>
          {/* 调整 DialogContent 宽度以适应 Popover 浮窗 */}
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-6 sm:p-8">
            <DialogHeader>
              <DialogTitle>
                {charmToEdit ? "编辑护石" : "添加新护石"}
              </DialogTitle>
              <DialogDescription>
                {charmToEdit
                  ? "修改护石信息，系统将重新计算等效孔位和核心技能价值"
                  : "填写护石信息，系统将自动计算等效孔位和核心技能价值"}
              </DialogDescription>
            </DialogHeader>

            {/* Popover 布局：使用 PopoverAnchor 定位，验证信息自动浮动显示 */}
            <Popover open={!!validation}>
              <PopoverAnchor asChild>
                <div>
                  <CharmForm
                    isEditMode={!!charmToEdit}
                    rarity={rarity}
                    setRarity={setRarity}
                    selectedSkills={selectedSkills}
                    allSkills={allSkills}
                    slots={slots}
                    handleAddSkill={handleAddSkill}
                    handleRemoveSkill={handleRemoveSkill}
                    handleAddSlot={handleAddSlot}
                    handleUpdateSlot={handleUpdateSlot}
                    handleRemoveSlot={handleRemoveSlot}
                    handleSubmit={handleSubmit}
                    onCancel={handleCancel}
                    keySkillValue={keySkillValue}
                    equivalentSlots={equivalentSlots}
                  />
                </div>
              </PopoverAnchor>
              <PopoverContent
                className="w-80 border-none p-0 shadow-lg"
                align="start"
                side="right"
                sideOffset={50}
              >
                <CharmValidation validation={validation} />
              </PopoverContent>
            </Popover>
          </DialogContent>
        </Dialog>
      </div>
      <div className="min-h-0 flex-1">
        <CharmList
          onEdit={(charm) => {
            initializeForm(charm);
            setCharmToEdit(charm);
            setIsFormOpen(true);
          }}
        />
      </div>
    </div>
  );
}
