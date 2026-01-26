/**
 * @fileoverview Form component for creating and editing weapons.
 */

import { useState } from "react";

import { SkillEditor, SlotEditor } from "@/components/entities";
import { Badge } from "@/components/ui/badge";
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
import { Slider } from "@/components/ui/slider";
import { ATTRIBUTE_TYPE_LABELS, WEAPON_TYPE_LABELS } from "@/constants";
import { useMediaQuery } from "@/hooks";
import {
  ATTRIBUTE_TYPES,
  RARITY_MAX,
  RARITY_MIN,
  WEAPON_TYPES,
  type AttributeType,
  type SkillWithLevel,
  type Slot,
  type Weapon,
  type WeaponType,
} from "@/types";

interface WeaponFormProps {
  weapon?: Weapon;
  onClose: () => void;
  onSubmit: (weapon: Omit<Weapon, "id">) => void;
  error?: string | null;
}

/**
 * Form component for creating and editing weapons.
 */
export function WeaponForm({
  weapon,
  onClose,
  onSubmit,
  error,
}: WeaponFormProps) {
  const [name, setName] = useState(weapon?.name ?? "");
  const [type, setType] = useState<WeaponType>(weapon?.type ?? "hammer");
  const [rarity, setRarity] = useState(weapon?.rarity ?? 1);
  const [attack, setAttack] = useState(weapon?.attack ?? 0);
  const [critical, setCritical] = useState(weapon?.critical ?? 0);
  const [defense, setDefense] = useState(weapon?.defense ?? 0);
  const [attribute, setAttribute] = useState<AttributeType | undefined>(
    weapon?.attribute,
  );
  const [attributeValue, setAttributeValue] = useState(
    weapon?.attributeValue ?? 0,
  );
  const [subattribute, setSubattribute] = useState<AttributeType | undefined>(
    weapon?.subattribute,
  );
  const [subattributeValue, setSubattributeValue] = useState(
    weapon?.subattributeValue ?? 0,
  );
  const [skills, setSkills] = useState<SkillWithLevel[]>(weapon?.skills ?? []);
  const [slots, setSlots] = useState<Slot[]>(weapon?.slots ?? []);
  const [localError, setLocalError] = useState<string | null>(null);

  const is2Xl = useMediaQuery("(min-width: 1536px)");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError("名称为必填项。");
      return;
    }
    setLocalError(null);

    onSubmit({
      name: trimmedName,
      type,
      rarity,
      attack,
      critical,
      defense,
      attribute,
      attributeValue: attribute ? attributeValue : undefined,
      subattribute,
      subattributeValue: subattribute ? subattributeValue : undefined,
      skills,
      slots,
      description: "自定义条目", // Add default value
      sortId: 999, // Add default value
      sharpness: [0, 0, 0, 0, 0, 0, 0], // Default sharpness
      takumi: [0, 0, 0, 0], // Default takumi
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 pb-0">
      <div className="grid grid-cols-6 items-center gap-4 px-6">
        <Label htmlFor="name" className="col-span-1 text-center">
          武器名称
        </Label>
        <div className="relative col-span-5">
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setLocalError(null);
            }}
            placeholder="输入武器名称"
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
        <Label htmlFor="type" className="col-span-1 text-center">
          武器类型
        </Label>
        <div className="col-span-5">
          <Select value={type} onValueChange={(v) => setType(v as WeaponType)}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEAPON_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {WEAPON_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-6 items-center gap-4 px-6 py-2">
        <Label className="col-span-1 text-center">稀有度</Label>
        <div className="col-span-5 flex items-center gap-4">
          <Badge
            variant="outline"
            className="w-12 shrink-0 justify-center text-sm font-medium"
            style={{
              color: rarity === 12 ? "black" : `var(--rarity-${rarity})`,
              borderColor:
                rarity === 12 ? "var(--border)" : `var(--rarity-${rarity})`,
              background:
                rarity === 12 ? `var(--rarity-${rarity})` : "transparent",
            }}
          >
            R{rarity}
          </Badge>
          <div className="min-w-0 flex-1 pb-8">
            <Slider
              value={[rarity]}
              onValueChange={(vals) => setRarity(vals[0])}
              min={RARITY_MIN}
              max={RARITY_MAX}
              step={1}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-6 items-center gap-4 px-6">
        <Label htmlFor="attack" className="col-span-1 text-center">
          攻击
        </Label>
        <Input
          id="attack"
          type="number"
          value={attack}
          onChange={(e) => setAttack(parseInt(e.target.value, 10))}
          required
          className="col-span-1"
        />
        <Label htmlFor="critical" className="col-span-1 text-center">
          会心
        </Label>
        <Input
          id="critical"
          type="number"
          value={critical}
          onChange={(e) => setCritical(parseInt(e.target.value, 10))}
          required
          className="col-span-1"
        />
        <Label htmlFor="defense" className="col-span-1 text-center">
          防御
        </Label>
        <Input
          id="defense"
          type="number"
          value={defense}
          onChange={(e) => setDefense(parseInt(e.target.value, 10))}
          required
          className="col-span-1"
        />
      </div>

      <div className="grid grid-cols-6 items-center gap-4 px-6">
        <Label htmlFor="attribute" className="col-span-1 text-center">
          主属性
        </Label>
        <div className="col-span-2">
          <Select
            value={attribute ?? "none"}
            onValueChange={(v) =>
              setAttribute(v === "none" ? undefined : (v as AttributeType))
            }
          >
            <SelectTrigger id="attribute">
              <SelectValue placeholder="无" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无</SelectItem>
              {ATTRIBUTE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {ATTRIBUTE_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Label htmlFor="attributeValue" className="col-span-1 text-center">
          数值
        </Label>
        <Input
          id="attributeValue"
          type="number"
          value={attributeValue}
          onChange={(e) => setAttributeValue(parseInt(e.target.value, 10))}
          disabled={!attribute}
          className="col-span-2"
        />
      </div>

      <div className="grid grid-cols-6 items-center gap-4 px-6">
        <Label htmlFor="subattribute" className="col-span-1 text-center">
          副属性
        </Label>
        <div className="col-span-2">
          <Select
            value={subattribute ?? "none"}
            onValueChange={(v) =>
              setSubattribute(v === "none" ? undefined : (v as AttributeType))
            }
          >
            <SelectTrigger id="subattribute">
              <SelectValue placeholder="无" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无</SelectItem>
              {ATTRIBUTE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {ATTRIBUTE_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Label htmlFor="subattributeValue" className="col-span-1 text-center">
          数值
        </Label>
        <Input
          id="subattributeValue"
          type="number"
          value={subattributeValue}
          onChange={(e) => setSubattributeValue(parseInt(e.target.value, 10))}
          disabled={!subattribute}
          className="col-span-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 px-6 pb-4">
        <SkillEditor
          skills={skills}
          onAdd={(skill) => setSkills((prev) => [...prev, skill])}
          onRemove={(skillId) =>
            setSkills((prev) => prev.filter((s) => s.skillId !== skillId))
          }
          variant={is2Xl ? "full" : "default"}
        />
        <SlotEditor
          slots={slots}
          onAdd={() =>
            setSlots((prev) => [
              ...prev,
              {
                type: "weapon",
                level: 1,
              },
            ])
          }
          onUpdate={(index, type, level) => {
            const newSlots = [...slots];
            newSlots[index] = { ...newSlots[index], type, level };
            setSlots(newSlots);
          }}
          onRemove={(index) =>
            setSlots((prev) => prev.filter((_, i) => i !== index))
          }
        />
      </div>

      <DialogFooter className="bg-muted/30 -mx-6 mt-6 -mb-6 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button type="submit">{weapon ? "保存" : "创建"}</Button>
      </DialogFooter>
    </form>
  );
}
