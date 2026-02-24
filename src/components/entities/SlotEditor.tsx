/**
 * @fileoverview Component for editing equipment slots.
 * Allows configuring slot types and levels.
 */

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Slot, type SlotLevel, type SlotType } from "@/types";

/**
 * Props for the SlotEditor component.
 */
interface SlotEditorProps {
  /** List of current slots. */
  slots: Slot[];
  /** Callback fired when a new slot is added. */
  onAdd: () => void;
  /** Callback fired when a slot is updated. */
  onUpdate: (index: number, type: SlotType, level: SlotLevel) => void;
  /** Callback fired when a slot is removed. */
  onRemove: (index: number) => void;
  /** Maximum number of slots allowed. Defaults to 3. */
  maxSlots?: number;
}

/**
 * A component that provides an interface for managing equipment slots.
 * Allows users to set the type (weapon/armor) and level (1-3) for each slot.
 */
export function SlotEditor({
  slots,
  onAdd,
  onUpdate,
  onRemove,
  maxSlots = 3,
}: SlotEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      <Label className="space-y-3 text-base font-medium">
        孔位 ({slots.length}/{maxSlots})
      </Label>

      {slots.slice(0, maxSlots).map((slot, index) => (
        <div
          key={index}
          className="bg-muted flex h-10 items-center gap-2 rounded-md p-2"
        >
          <Select
            value={slot.type}
            onValueChange={(v) => onUpdate(index, v as SlotType, slot.level)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weapon">武器孔</SelectItem>
              <SelectItem value="armor">防具孔</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={slot.level.toString()}
            onValueChange={(v) =>
              onUpdate(index, slot.type, parseInt(v) as SlotLevel)
            }
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1级</SelectItem>
              <SelectItem value="2">2级</SelectItem>
              <SelectItem value="3">3级</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {/* Fill empty slot spaces */}
      {Array.from(
        { length: Math.max(0, maxSlots - slots.length) },
        (_unused, index) => index,
      ).map((index) => (
        <div
          key={`empty-slot-${slots.length + index}`}
          className="bg-muted h-10 rounded-md"
        />
      ))}

      {/* Add slot button */}
      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        className="w-full"
      >
        添加孔位
      </Button>
    </div>
  );
}
