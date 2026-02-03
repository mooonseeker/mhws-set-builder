/**
 * @fileoverview Main component for managing the application's database.
 * It integrates lists and forms for skills, accessories, armor, and weapons.
 */

import { useState } from "react";

import {
  Gem,
  Lock,
  Plus,
  Shield,
  Sparkles,
  Star,
  Swords,
  Unlock,
} from "lucide-react";

import { ErrorMessage, Loading } from "@/components/common";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useAccessories, useArmor, useSkills, useWeapon } from "@/hooks";
import type { Accessory, Armor, DataId, Skill, Weapon } from "@/types";
import { generateSkillId } from "@/utils";

import { AccessoryList } from "./AccessoryList";
import { ArmorList } from "./ArmorList";
import { DatabaseForm } from "./DatabaseForm";
import { KeySkillManager } from "./KeySkillManager";
import { SkillList } from "./SkillList";
import { WeaponList } from "./WeaponList";

/**
 * The main component for database management.
 * Integrates list and form functionalities for skills and accessories.
 */
export function DatabaseManager() {
  const {
    loading: skillsLoading,
    error: skillsError,
    addSkill,
    updateSkill,
    skills,
  } = useSkills();
  const {
    loading: accessoriesLoading,
    error: accessoriesError,
    addAccessory,
    updateAccessory,
    accessories,
  } = useAccessories();
  const {
    loading: armorLoading,
    error: armorError,
    addArmor,
    updateArmor,
  } = useArmor();
  const {
    loading: weaponsLoading,
    error: weaponsError,
    addWeapon,
    updateWeapon,
  } = useWeapon();

  const [currentDb, setCurrentDb] = useState<DataId>("skills");
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [showKeySkillManager, setShowKeySkillManager] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    { type: DataId; data: Skill | Accessory | Armor | Weapon } | undefined
  >();
  const [formError, setFormError] = useState<string | null>(null);

  const loading =
    skillsLoading || accessoriesLoading || armorLoading || weaponsLoading;
  const error = skillsError ?? accessoriesError ?? armorError ?? weaponsError;

  const handleAdd = () => {
    setFormError(null);
    let newItem: {
      type: DataId;
      data: Skill | Accessory | Armor | Weapon;
    } | null = null;

    switch (currentDb) {
      case "skills":
        newItem = {
          type: "skills",
          data: {
            id: "",
            name: "",
            category: "armor",
            maxLevel: 1,
            accessoryLevel: -1,
            isKey: false,
            description: "",
            type: "SKILL_0000",
            sortId: 999,
          },
        };
        break;
      case "accessories":
        newItem = {
          type: "accessories",
          data: {
            id: "",
            name: "",
            type: "armor",
            description: "",
            sortID: 999,
            skills: [],
            rarity: 1,
            slotLevel: 1,
            color: "default",
          },
        };
        break;
      case "armor":
        newItem = {
          type: "armor",
          data: {
            id: "",
            name: "",
            type: "helm",
            description: "",
            skills: [],
            slots: [],
            rarity: 1,
            defense: 0,
            resistance: [0, 0, 0, 0, 0],
            series: "",
          },
        };
        break;
      case "weapons":
        newItem = {
          type: "weapons",
          data: {
            id: "",
            name: "",
            type: "hammer",
            description: "",
            sortId: 999,
            skills: [],
            slots: [],
            rarity: 1,
            attack: 0,
            critical: 0,
            defense: 0,
          },
        };
        break;
      default:
        return;
    }
    if (newItem) {
      setEditingItem(newItem);
      setFormOpen(true);
    }
  };

  const handleEdit = (
    item: Skill | Accessory | Armor | Weapon,
    type: DataId,
  ) => {
    setEditingItem({ type, data: item });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = (
    itemData:
      | Omit<Skill, "id">
      | Omit<Accessory, "id">
      | Omit<Armor, "id">
      | Omit<Weapon, "id">,
  ) => {
    if (!editingItem) return;

    try {
      const isEditMode = !!editingItem.data.id;

      switch (editingItem.type) {
        case "skills": {
          const data = itemData as Omit<Skill, "id">;
          if (isEditMode) {
            updateSkill({ ...data, id: (editingItem.data as Skill).id });
          } else {
            const newSkill = { ...data, id: generateSkillId(data.name) };
            addSkill(newSkill);
          }
          break;
        }
        case "accessories": {
          const data = itemData as Omit<Accessory, "id">;
          if (isEditMode) {
            updateAccessory({
              ...data,
              id: (editingItem.data as Accessory).id,
            });
          } else {
            addAccessory(data as Accessory);
          }
          break;
        }
        case "armor": {
          const data = itemData as Omit<Armor, "id">;
          if (isEditMode) {
            updateArmor({ ...data, id: (editingItem.data as Armor).id });
          } else {
            addArmor(data as Armor);
          }
          break;
        }
        case "weapons": {
          const data = itemData as Omit<Weapon, "id">;
          if (isEditMode) {
            updateWeapon({ ...data, id: (editingItem.data as Weapon).id });
          } else {
            addWeapon(data as Weapon);
          }
          break;
        }
        default:
          throw new Error("Invalid data type for submission");
      }
      setFormOpen(false);
      setEditingItem(undefined);
    } catch (err) {
      if (err instanceof Error) {
        setFormError(err.message);
      }
    }
  };

  if (loading) {
    return <Loading message="加载数据库数据中..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  const addButtonTextMap: Partial<Record<DataId, string>> = {
    skills: "添加技能",
    accessories: "添加装饰品",
    armor: "添加防具",
    weapons: "添加武器",
  };
  const addButtonText = addButtonTextMap[currentDb] ?? "添加";

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex h-11 shrink-0 items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">数据库管理</h1>
          <ToggleGroup
            type="single"
            value={currentDb}
            onValueChange={(value) => value && setCurrentDb(value as DataId)}
            size="sm"
            className="border-border rounded-md border p-1"
          >
            <ToggleGroupItem value="skills" tooltip="技能">
              <Sparkles className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="accessories" tooltip="装饰品">
              <Gem className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="armor" tooltip="防具">
              <Shield className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="weapons" tooltip="武器">
              <Swords className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            value={isLocked ? "locked" : "unlocked"}
            onValueChange={(value) => setIsLocked(value === "locked")}
            size="sm"
            className="border-border rounded-md border p-1"
          >
            <ToggleGroupItem value="unlocked" tooltip="解锁编辑">
              <Unlock className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="locked" tooltip="锁定编辑">
              <Lock className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex gap-2">
          {currentDb === "skills" && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowKeySkillManager(true)}
            >
              <Star className="fill-warning text-warning-foreground mr-2 h-5 w-5" />
              核心技能
            </Button>
          )}
          <Button size="lg" onClick={handleAdd} disabled={isLocked}>
            <Plus className="mr-2 h-5 w-5" />
            {addButtonText}
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {currentDb === "skills" && (
          <SkillList
            onEdit={(skill) => handleEdit(skill, "skills")}
            isLocked={isLocked}
          />
        )}
        {currentDb === "accessories" && (
          <AccessoryList
            onEdit={(accessory) => handleEdit(accessory, "accessories")}
            isLocked={isLocked}
          />
        )}
        {currentDb === "armor" && (
          <ArmorList
            onEdit={(item) => handleEdit(item, "armor")}
            isLocked={isLocked}
          />
        )}
        {currentDb === "weapons" && (
          <WeaponList
            onEdit={(item) => handleEdit(item, "weapons")}
            isLocked={isLocked}
          />
        )}
      </div>

      {formOpen &&
        editingItem &&
        (() => {
          const commonProps = {
            open: formOpen,
            onClose: () => setFormOpen(false),
            onSubmit: handleSubmit,
            error: formError,
          };

          switch (editingItem.type) {
            case "skills":
              return (
                <DatabaseForm
                  {...commonProps}
                  dataType="skills"
                  skill={editingItem.data as Skill}
                  skills={skills}
                />
              );
            case "accessories":
              return (
                <DatabaseForm
                  {...commonProps}
                  dataType="accessories"
                  accessory={editingItem.data as Accessory}
                  accessories={accessories}
                />
              );
            case "armor":
              return (
                <DatabaseForm
                  {...commonProps}
                  dataType="armor"
                  armor={editingItem.data as Armor}
                />
              );
            case "weapons":
              return (
                <DatabaseForm
                  {...commonProps}
                  dataType="weapons"
                  weapon={editingItem.data as Weapon}
                />
              );
            default:
              return null;
          }
        })()}
      <KeySkillManager
        open={showKeySkillManager}
        onOpenChange={setShowKeySkillManager}
      />
    </div>
  );
}
