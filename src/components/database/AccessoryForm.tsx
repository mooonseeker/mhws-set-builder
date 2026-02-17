/**
 * @fileoverview Form component for adding and editing accessories.
 * It handles form submission and validation.
 */

import { useState } from "react";

import { SkillEditor } from "@/components/entities";
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
  RARITY_MAX,
  RARITY_MIN,
  type Accessory,
  type SkillWithLevel,
  type SlotLevel,
} from "@/types";

interface AccessoryFormProps {
  accessory?: Accessory;
  onClose: () => void;
  onSubmit: (accessory: Omit<Accessory, "id">) => void;
  error: string | null;
  accessories: Accessory[];
}

/**
 * Form component for adding or editing an accessory.
 */
export function AccessoryForm({
  accessory,
  onClose,
  onSubmit,
  error,
  accessories,
}: AccessoryFormProps) {
  const [name, setName] = useState(accessory?.name ?? "");
  const [type, setType] = useState<"weapon" | "armor">(
    accessory?.type ?? "weapon",
  );
  const [rarity, setRarity] = useState(accessory?.rarity ?? 1);
  const [slotLevel, setSlotLevel] = useState<SlotLevel>(
    accessory?.slotLevel ?? 1,
  );
  const [skills, setSkills] = useState<SkillWithLevel[]>(
    accessory?.skills ?? [],
  );
  const [localError, setLocalError] = useState<string | null>(null);

  const is2Xl = useMediaQuery("(min-width: 1536px)");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();

    // Check for duplicate names (case-insensitive and trimmed).
    const isDuplicate = accessories.some((a) => {
      // In edit mode, exclude the current accessory being edited.
      if (accessory) {
        return (
          a.id !== accessory.id &&
          a.name.trim().toLowerCase() === trimmedName.toLowerCase()
        );
      }
      return a.name.trim().toLowerCase() === trimmedName.toLowerCase();
    });

    if (isDuplicate) {
      setLocalError(`Accessory "${trimmedName}" already exists.`);
      return;
    }
    setLocalError(null);

    onSubmit({
      name: trimmedName,
      type,
      description: "自定义条目",
      sortID: 9999, // User-defined accessories are sorted to the end by default.
      skills,
      rarity,
      slotLevel,
      color: "WHITE", // Default color for user-defined accessories.
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 pb-0">
      <div className="grid grid-cols-6 items-center gap-4 px-6">
        <Label htmlFor="name" className="col-span-1 text-center">
          装饰品名称
        </Label>
        <div className="relative col-span-5">
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setLocalError(null); // Clear error on input
            }}
            placeholder="输入装饰品名称"
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
        <Label htmlFor="type" className="col-span-1 text-center">
          类型
        </Label>
        <div className="col-span-2">
          <Select
            value={type}
            onValueChange={(v) => setType(v as "weapon" | "armor")}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weapon">武器</SelectItem>
              <SelectItem value="armor">防具</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Label htmlFor="slotLevel" className="col-span-1 text-center">
          孔位
        </Label>
        <div className="col-span-2">
          <Select
            value={slotLevel.toString()}
            onValueChange={(v) => setSlotLevel(parseInt(v) as SlotLevel)}
          >
            <SelectTrigger id="slotLevel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1级孔</SelectItem>
              <SelectItem value="2">2级孔</SelectItem>
              <SelectItem value="3">3级孔</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="px-6 pb-4">
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
          maxSkills={2}
          variant={is2Xl ? "full" : "default"}
        />
      </div>

      <DialogFooter className="bg-muted/30 -mx-6 mt-6 -mb-6 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button type="submit">{accessory ? "保存" : "添加"}</Button>
      </DialogFooter>
    </form>
  );
}
