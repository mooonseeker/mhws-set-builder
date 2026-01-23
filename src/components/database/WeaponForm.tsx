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
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">名称</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入武器名称"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">类型</Label>
          <Select value={type} onValueChange={(v) => setType(v as WeaponType)}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEAPON_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rarity">稀有度</Label>
            <Badge variant="outline">R{rarity}</Badge>
          </div>
          <Slider
            id="rarity"
            min={RARITY_MIN}
            max={RARITY_MAX}
            step={1}
            value={[rarity]}
            onValueChange={(vals) => setRarity(vals[0])}
            className="py-4"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="attack">攻击力</Label>
          <Input
            id="attack"
            type="number"
            value={attack}
            onChange={(e) => setAttack(parseInt(e.target.value, 10))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="critical">会心率</Label>
          <Input
            id="critical"
            type="number"
            value={critical}
            onChange={(e) => setCritical(parseInt(e.target.value, 10))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="defense">防御</Label>
          <Input
            id="defense"
            type="number"
            value={defense}
            onChange={(e) => setDefense(parseInt(e.target.value, 10))}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="attribute">属性</Label>
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
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="attributeValue">属性值</Label>
          <Input
            id="attributeValue"
            type="number"
            value={attributeValue}
            onChange={(e) => setAttributeValue(parseInt(e.target.value, 10))}
            disabled={!attribute}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subattribute">副属性</Label>
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
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subattributeValue">副属性值</Label>
          <Input
            id="subattributeValue"
            type="number"
            value={subattributeValue}
            onChange={(e) => setSubattributeValue(parseInt(e.target.value, 10))}
            disabled={!subattribute}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SkillEditor
          skills={skills}
          onAdd={(skill) => setSkills((prev) => [...prev, skill])}
          onRemove={(skillId) =>
            setSkills((prev) => prev.filter((s) => s.skillId !== skillId))
          }
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

      {(localError ?? error) && (
        <p className="text-destructive text-sm">{localError ?? error}</p>
      )}

      <DialogFooter className="mt-4 border-t pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button type="submit">{weapon ? "保存" : "创建"}</Button>
      </DialogFooter>
    </form>
  );
}
