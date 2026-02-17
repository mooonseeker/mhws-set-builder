/**
 * @fileoverview Form component for creating and editing armor pieces.
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
import { useMediaQuery } from "@/hooks";
import {
  ARMOR_TYPES,
  RARITY_MAX,
  RARITY_MIN,
  type Armor,
  type ArmorType,
  type Resistance,
  type SkillWithLevel,
  type Slot,
} from "@/types";

interface ArmorFormProps {
  armor?: Armor;
  onClose: () => void;
  onSubmit: (armor: Omit<Armor, "id">) => void;
  error?: string | null;
}

/**
 * Form content for creating and editing armor pieces.
 */
export function ArmorForm({ armor, onClose, onSubmit, error }: ArmorFormProps) {
  const [name, setName] = useState(armor?.name ?? "");
  const [type, setType] = useState<ArmorType>(armor?.type ?? "helm");
  const [rarity, setRarity] = useState(armor?.rarity ?? 1);
  const [defense, setDefense] = useState(armor?.defense ?? 0);
  const [resistance, setResistance] = useState<Resistance>(
    armor?.resistance ?? [0, 0, 0, 0, 0],
  );
  const [series, setSeries] = useState(armor?.series ?? "");
  const [skills, setSkills] = useState<SkillWithLevel[]>(armor?.skills ?? []);
  const [slots, setSlots] = useState<Slot[]>(armor?.slots ?? []);
  const [localError, setLocalError] = useState<string | null>(null);

  const is2Xl = useMediaQuery("(min-width: 1536px)");

  const handleResistanceChange = (index: number, value: string) => {
    const newResistance = [...resistance] as Resistance;
    newResistance[index] = parseInt(value, 10) || 0;
    setResistance(newResistance);
  };

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
      defense,
      resistance,
      series: series.trim(),
      skills,
      slots,
      description: "自定义条目", // Add default value
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 pb-0">
      <div className="grid grid-cols-6 items-center gap-4 px-6">
        <Label htmlFor="name" className="col-span-1 text-center">
          防具名称
        </Label>
        <div className="relative col-span-5">
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setLocalError(null);
            }}
            placeholder="输入防具名称"
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
          防具部位
        </Label>
        <div className="col-span-2">
          <Select value={type} onValueChange={(v) => setType(v as ArmorType)}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ARMOR_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Label htmlFor="series" className="col-span-1 text-center">
          套装系列
        </Label>
        <Input
          id="series"
          value={series}
          onChange={(e) => setSeries(e.target.value)}
          placeholder="输入防具系列"
          className="col-span-2"
        />
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

      <div className="space-y-2 px-6">
        <div className="grid grid-cols-6 gap-4 text-center">
          <Label className="text-xs">防御</Label>
          <Label className="text-xs">火抗性</Label>
          <Label className="text-xs">水抗性</Label>
          <Label className="text-xs">雷抗性</Label>
          <Label className="text-xs">冰抗性</Label>
          <Label className="text-xs">龙抗性</Label>
        </div>
        <div className="grid grid-cols-6 gap-4">
          <Input
            type="number"
            value={defense}
            onChange={(e) => setDefense(parseInt(e.target.value, 10))}
            required
            className="px-1 text-center"
          />
          {resistance.map((res, index) => (
            <Input
              key={index}
              type="number"
              value={res}
              onChange={(e) => handleResistanceChange(index, e.target.value)}
              className="px-1 text-center"
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-6 pb-4">
        <SkillEditor
          skills={skills}
          onAdd={(skill) => setSkills((prev) => [...prev, skill])}
          onRemove={(skillId) =>
            setSkills((prev) => prev.filter((s) => s.skillId !== skillId))
          }
          onUpdate={(updatedSkill) =>
            setSkills((prev) =>
              prev.map((s) =>
                s.skillId === updatedSkill.skillId ? updatedSkill : s,
              ),
            )
          }
          variant={is2Xl ? "full" : "default"}
        />
        <SlotEditor
          slots={slots}
          onAdd={() =>
            setSlots((prev) => [
              ...prev,
              {
                type: "armor",
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
        <Button type="submit">{armor ? "保存" : "创建"}</Button>
      </DialogFooter>
    </form>
  );
}
