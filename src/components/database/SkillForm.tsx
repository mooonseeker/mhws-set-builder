/**
 * @fileoverview A form component for adding and editing skills.
 * It uses a dialog and a reducer for state management.
 */

import { useEffect, useReducer } from "react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SKILL_CATEGORY_LABELS, SLOT_LEVEL_LABELS } from "@/constants";
import type { Skill, SkillCategory, SlotLevel } from "@/types";

interface SkillFormProps {
  skill?: Skill;
  onClose: () => void;
  onSubmit: (skill: Omit<Skill, "id">) => void;
  error: string | null;
  skills: Skill[];
}

// Define the state for the form.
interface SkillFormState {
  name: string;
  category: SkillCategory;
  maxLevel: number;
  accessoryLevel: SlotLevel;
  localError: string | null;
}

// Define action types for the reducer.
type SkillFormAction =
  | {
      type: "SET_FIELD";
      field: keyof SkillFormState;
      value: SkillFormState[keyof SkillFormState];
    }
  | { type: "RESET_FORM"; skill?: Skill }
  | { type: "SET_LOCAL_ERROR"; error: string | null };

// Reducer for the skill form state.
function skillFormReducer(
  state: SkillFormState,
  action: SkillFormAction,
): SkillFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET_FORM":
      if (action.skill) {
        return {
          name: action.skill.name,
          category: action.skill.category,
          maxLevel: action.skill.maxLevel,
          accessoryLevel: action.skill.accessoryLevel,
          localError: null,
        };
      } else {
        return {
          name: "",
          category: "armor",
          maxLevel: 3,
          accessoryLevel: 2,
          localError: null,
        };
      }
    case "SET_LOCAL_ERROR":
      return { ...state, localError: action.error };
    default:
      return state;
  }
}

/**
 * A form component for adding or editing a skill.
 */
export function SkillForm({
  skill,
  onClose,
  onSubmit,
  error,
  skills,
}: SkillFormProps) {
  // Initial state for the reducer.
  const initialFormState: SkillFormState = {
    name: "",
    category: "armor",
    maxLevel: 3,
    accessoryLevel: 2,
    localError: null,
  };

  const [state, dispatch] = useReducer(skillFormReducer, initialFormState);

  const { name, category, maxLevel, accessoryLevel, localError } = state;

  useEffect(() => {
    dispatch({ type: "RESET_FORM", skill });
  }, [skill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    // Check for duplicate names (case-insensitive and trimmed).
    const isDuplicate = skills.some((s) => {
      // In edit mode, exclude the current skill.
      if (skill) {
        return (
          s.id !== skill.id &&
          s.name.trim().toLowerCase() === trimmedName.toLowerCase()
        );
      }
      return s.name.trim().toLowerCase() === trimmedName.toLowerCase();
    });

    if (isDuplicate) {
      dispatch({
        type: "SET_LOCAL_ERROR",
        error: `Skill "${trimmedName}" already exists.`,
      });
      return;
    }
    dispatch({ type: "SET_LOCAL_ERROR", error: null });

    onSubmit({
      name: trimmedName,
      category,
      maxLevel,
      accessoryLevel,
      description: "", // User-defined skills have no description by default.
      type: "", // User-defined skills have no type by default.
      sortId: 9999, // User-defined skills are sorted to the end by default.
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 pb-0">
      <div className="grid grid-cols-6 items-center gap-4 px-6">
        <Label htmlFor="name" className="col-span-1 text-center">
          技能名称
        </Label>
        <div className="relative col-span-5">
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              dispatch({
                type: "SET_FIELD",
                field: "name",
                value: e.target.value,
              });
              dispatch({ type: "SET_LOCAL_ERROR", error: null }); // Clear error on input
            }}
            placeholder="输入技能名称"
            required
            className={(localError ?? error) ? "pr-20" : ""}
          />
          {(localError ?? error) && (
            <span className="text-destructive absolute top-1/2 right-3 -translate-y-1/2 transform text-sm">
              {localError ?? error}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-6 items-center gap-4 px-6">
        <Label htmlFor="category" className="col-span-1 text-center">
          技能分类
        </Label>
        <div className="col-span-5">
          <Select
            value={category}
            onValueChange={(v) =>
              dispatch({
                type: "SET_FIELD",
                field: "category",
                value: v as SkillCategory,
              })
            }
          >
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weapon">
                {SKILL_CATEGORY_LABELS.weapon}
              </SelectItem>
              <SelectItem value="armor">
                {SKILL_CATEGORY_LABELS.armor}
              </SelectItem>
              <SelectItem value="series">
                {SKILL_CATEGORY_LABELS.series}
              </SelectItem>
              <SelectItem value="group">
                {SKILL_CATEGORY_LABELS.group}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-6 items-center gap-4 px-6">
        <Label htmlFor="maxLevel" className="col-span-1 text-center">
          最大等级
        </Label>
        <div className="col-span-2">
          <Input
            id="maxLevel"
            type="number"
            min={1}
            max={10}
            value={maxLevel}
            onChange={(e) =>
              dispatch({
                type: "SET_FIELD",
                field: "maxLevel",
                value: parseInt(e.target.value),
              })
            }
            required
          />
        </div>
        <Label htmlFor="accessoryLevel" className="col-span-1 text-center">
          装饰品等级
        </Label>
        <div className="col-span-2">
          <Select
            value={accessoryLevel.toString()}
            onValueChange={(v) =>
              dispatch({
                type: "SET_FIELD",
                field: "accessoryLevel",
                value: parseInt(v) as SlotLevel,
              })
            }
          >
            <SelectTrigger id="accessoryLevel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-1">{SLOT_LEVEL_LABELS[-1]}</SelectItem>
              <SelectItem value="1">{SLOT_LEVEL_LABELS[1]}</SelectItem>
              <SelectItem value="2">{SLOT_LEVEL_LABELS[2]}</SelectItem>
              <SelectItem value="3">{SLOT_LEVEL_LABELS[3]}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter className="bg-muted/30 -mx-6 mt-6 -mb-6 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button type="submit">{skill ? "保存" : "添加"}</Button>
      </DialogFooter>
    </form>
  );
}
