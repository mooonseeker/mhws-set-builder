/**
 * @fileoverview Form component for adding and editing accessories.
 * It handles form submission and validation.
 */

import { useState } from "react";

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
  RARITY_MAX,
  RARITY_MIN,
  type Accessory,
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
  const [localError, setLocalError] = useState<string | null>(null);

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
      skills: [], // Temporarily empty, user-defined accessories have no skills.
      rarity,
      slotLevel,
      color: "WHITE", // Default color for user-defined accessories.
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="name">装饰品名称</Label>
        <div className="relative">
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

      <div className="space-y-3">
        <Label htmlFor="type">装饰品类型</Label>
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

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
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

        <div className="space-y-3">
          <Label htmlFor="slotLevel">孔位等级</Label>
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

      {/* TODO: add skill editor*/}
      <DialogFooter className="border-t pt-6">
        <Button type="button" variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button type="submit">{accessory ? "保存" : "添加"}</Button>
      </DialogFooter>
    </form>
  );
}
