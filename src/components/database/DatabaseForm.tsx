/**
 * @fileoverview A unified form component that acts as a master controller for the create/edit dialog.
 * It dynamically renders the correct form based on the data type.
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Accessory, Armor, Skill, Weapon } from "@/types";

import { AccessoryForm } from "./AccessoryForm";
import { ArmorForm } from "./ArmorForm";
import { SkillForm } from "./SkillForm";
import { WeaponForm } from "./WeaponForm";

export type DataType = "skills" | "accessories" | "armor" | "weapons";

interface CommonProps {
  open: boolean;
  onClose: () => void;
  error: string | null;
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
  const { open, onClose, dataType } = props;

  const getTitle = () => {
    switch (dataType) {
      case "skills":
        return props.skill ? "编辑技能" : "添加技能";
      case "accessories":
        return props.accessory ? "编辑装饰品" : "添加装饰品";
      case "armor":
        return props.armor ? "编辑防具" : "添加防具";
      case "weapons":
        return props.weapon ? "编辑武器" : "添加武器";
      default:
        return "";
    }
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
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
