/**
 * @fileoverview Main component for charm management.
 * It integrates all charm-related functionalities, including state management and layout.
 */

import { useMemo, useState } from "react";

import { Plus } from "lucide-react";

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
import { useCharmOperations, useCharms, useSkills } from "@/hooks";
import type { Charm, SkillWithLevel, Slot, SlotLevel, SlotType } from "@/types";
import {
  calculateCharmEquivalentSlots,
  calculateKeySkillValue,
  validateCharm,
} from "@/utils";

import { CharmForm } from "./CharmForm";
import { CharmList } from "./CharmList";
import { CharmValidation } from "./CharmValidation";

/**
 * Main component for charm management.
 *
 * This component integrates all charm-related functionalities,
 * including state management for the form, dialogs, and the charm list display.
 */
export function CharmManager() {
  // State for dialog visibility and the charm being edited
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [charmToEdit, setCharmToEdit] = useState<Charm | null>(null);

  // Data and operations from context and hooks
  const { charms } = useCharms();
  const { skills: allSkills } = useSkills();
  const { createCharm, updateAndRecalculateCharm } = useCharmOperations();

  // Form state
  const [rarity, setRarity] = useState(7);
  const [selectedSkills, setSelectedSkills] = useState<SkillWithLevel[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  // Resets the form to its initial state.
  const resetForm = () => {
    setRarity(7);
    setSelectedSkills([]);
    setSlots([]);
  };

  // Initializes the form with data from an existing charm for editing.
  const initializeForm = (charm: Charm) => {
    setRarity(charm.rarity);
    setSelectedSkills(charm.skills);
    setSlots(charm.slots);
  };

  // Generates a preview name for the charm based on its rarity (for custom charms).
  const previewName = useMemo(() => {
    if (charmToEdit) return charmToEdit.name;
    switch (rarity) {
      case 5:
        return "不明护石";
      case 6:
        return "史传护石";
      case 7:
        return "秘史护石";
      case 8:
        return "盛世护石";
      default:
        return "非法护石";
    }
  }, [rarity, charmToEdit]);

  // Calculates equivalent slots and key skill value in real-time.
  const { equivalentSlots, keySkillValue } = useMemo(() => {
    const eq = calculateCharmEquivalentSlots(selectedSkills, slots, allSkills);
    const kv = calculateKeySkillValue(selectedSkills, slots, allSkills);
    return { equivalentSlots: eq, keySkillValue: kv };
  }, [selectedSkills, slots, allSkills]);

  // Performs real-time validation of the charm.
  const validation = useMemo(() => {
    if (selectedSkills.length === 0) return null;

    // Exclude the current charm from the validation list in edit mode
    const charmsForValidation = charmToEdit
      ? charms.filter((c) => c.id !== charmToEdit.id)
      : charms;

    return validateCharm(
      {
        name: charmToEdit?.name ?? "预览护石",
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

  // Adds a skill to the charm.
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

  // Removes a skill from the charm.
  const handleRemoveSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s.skillId !== skillId));
  };

  // Adds a slot to the charm.
  const handleAddSlot = () => {
    if (slots.length >= 3) return;
    setSlots([...slots, { type: "weapon", level: 1 }]);
  };

  // Updates a slot's type or level.
  const handleUpdateSlot = (
    index: number,
    type: SlotType,
    level: SlotLevel,
  ) => {
    const newSlots = [...slots];
    newSlots[index] = { type, level };
    setSlots(newSlots);
  };

  // Removes a slot from the charm.
  const handleRemoveSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  // Handles form submission for creating or updating a charm.
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
          {/* Adjust DialogContent width to accommodate Popover */}
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

            {/* Popover layout: Use PopoverAnchor for positioning, validation info floats automatically */}
            <Popover open={!!validation}>
              <PopoverAnchor asChild>
                <div>
                  <CharmForm
                    isEditMode={!!charmToEdit}
                    name={previewName}
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
