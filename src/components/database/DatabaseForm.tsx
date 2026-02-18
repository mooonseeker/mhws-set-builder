/**
 * @fileoverview A unified form component that acts as a master controller for the create/edit dialog.
 * It dynamically renders the correct form based on the data type.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Accessory, Armor, Skill, Weapon } from "@/types";
import { isOfficialId } from "@/utils";

import { AccessoryForm } from "./AccessoryForm";
import { ArmorForm } from "./ArmorForm";
import { SkillForm } from "./SkillForm";
import { WeaponForm } from "./WeaponForm";

export type DataType = "skills" | "accessories" | "armor" | "weapons";

interface CommonProps {
  open: boolean;
  onClose: () => void;
  error: string | null;
  isEditMode: boolean;
}

interface SkillProps extends CommonProps {
  dataType: "skills";
  skill?: Skill;
  onSubmit: (data: Omit<Skill, "id">) => void;
  skills: Skill[]; // For duplicate checking
}

interface AccessoryProps extends CommonProps {
  dataType: "accessories";
  accessory?: Accessory;
  onSubmit: (data: Omit<Accessory, "id">) => void;
  accessories: Accessory[]; // For duplicate checking
}

interface ArmorProps extends CommonProps {
  dataType: "armor";
  armor?: Armor;
  onSubmit: (data: Omit<Armor, "id">) => void;
}

interface WeaponProps extends CommonProps {
  dataType: "weapons";
  weapon?: Weapon;
  onSubmit: (data: Omit<Weapon, "id">) => void;
}

export type DatabaseFormProps =
  | SkillProps
  | AccessoryProps
  | ArmorProps
  | WeaponProps;

/**
 * A unified form component for managing different types of database entries.
 */
export function DatabaseForm(props: DatabaseFormProps) {
  const { open, onClose, dataType, isEditMode } = props;

  const getTitle = () => {
    switch (dataType) {
      case "skills":
        return isEditMode ? "编辑技能" : "添加技能";
      case "accessories":
        return isEditMode ? "编辑装饰品" : "添加装饰品";
      case "armor":
        return isEditMode ? "编辑防具" : "添加防具";
      case "weapons":
        return isEditMode ? "编辑武器" : "添加武器";
      default:
        return "";
    }
  };

  const isEditingOfficialData = () => {
    if (!isEditMode) return false;

    let id = "";
    switch (dataType) {
      case "skills":
        id = props.skill?.id ?? "";
        break;
      case "accessories":
        id = props.accessory?.id ?? "";
        break;
      case "armor":
        id = props.armor?.id ?? "";
        break;
      case "weapons":
        id = props.weapon?.id ?? "";
        break;
    }
    return isOfficialId(id);
  };

  const renderContent = () => {
    switch (dataType) {
      case "skills":
        return <SkillForm key={props.skill?.id ?? "new"} {...props} />;
      case "accessories":
        return <AccessoryForm key={props.accessory?.id ?? "new"} {...props} />;
      case "armor":
        return <ArmorForm key={props.armor?.id ?? "new"} {...props} />;
      case "weapons":
        return <WeaponForm key={props.weapon?.id ?? "new"} {...props} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          {isEditingOfficialData() && (
            <DialogDescription className="text-warning font-medium">
              ⚠️ 当前正在编辑官方数据，请慎重操作！
            </DialogDescription>
          )}
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
