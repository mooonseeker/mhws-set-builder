/**
 * @fileoverview A table component for displaying charm data with sorting,
 * selection, and action controls.
 */

import { ChevronDown, ChevronUp, Filter, Pencil, Trash2 } from "lucide-react";

import { SkillItem } from "@/components/entities/";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  Charm,
  CharmEnhanced,
  CharmSortField,
  SortDirection,
} from "@/types";
import { getAssetPath, isOfficialCharmId } from "@/utils";

interface CharmTableProps {
  charms: CharmEnhanced[];
  hasCharms: boolean;
  sortField: CharmSortField;
  sortDirection: SortDirection;
  onSortChange: (field: CharmSortField) => void;
  onToggleFilter: () => void;
  onEdit?: (charm: Charm) => void;
  onDelete: (id: string) => void;
}

const SortIcon = ({
  field,
  currentSortField,
  sortDirection,
}: {
  field: CharmSortField;
  currentSortField: CharmSortField;
  sortDirection: SortDirection;
}) => {
  if (currentSortField !== field) return null;
  return sortDirection === "asc" ? (
    <ChevronUp className="ml-1 inline h-4 w-4" />
  ) : (
    <ChevronDown className="ml-1 inline h-4 w-4" />
  );
};

/**
 * Renders a table of charms with sorting, selection, and action controls.
 */
export function CharmTable({
  charms,
  hasCharms,
  sortField,
  sortDirection,
  onSortChange,
  onToggleFilter,
  onEdit,
  onDelete,
}: CharmTableProps) {
  // Gets the icon for a decoration slot based on its type and level.
  const getAccessoryIcon = (slotType: "weapon" | "armor", level: number) => {
    return getAssetPath(`/slot/${slotType}-slot-${level}.png`);
  };

  return (
    <div className="min-h-0 flex-1 rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-tl-lg text-center"
              onClick={() => onSortChange("rarity")}
            >
              <span className="hidden sm:inline">稀有度</span>
              <span className="sm:hidden">R</span>{" "}
              <SortIcon
                field="rarity"
                currentSortField={sortField}
                sortDirection={sortDirection}
              />
            </TableHead>
            <TableHead className="bg-primary text-primary-foreground px-4 text-center">
              名称
            </TableHead>
            <TableHead className="bg-primary text-primary-foreground px-4 text-center">
              技能
            </TableHead>
            <TableHead className="bg-primary text-primary-foreground hidden text-center md:table-cell">
              孔位
            </TableHead>
            <TableHead
              className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer text-center"
              onClick={() => onSortChange("keySkillValue")}
            >
              <span className="hidden sm:inline">核心价值</span>
              <span className="sm:hidden">价值</span>{" "}
              <SortIcon
                field="keySkillValue"
                currentSortField={sortField}
                sortDirection={sortDirection}
              />
            </TableHead>
            <TableHead className="bg-primary text-primary-foreground hidden text-center lg:table-cell">
              等效孔位
            </TableHead>
            <TableHead
              className="bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground hidden cursor-pointer text-center lg:table-cell"
              onClick={() => onSortChange("createdAt")}
            >
              创建时间{" "}
              <SortIcon
                field="createdAt"
                currentSortField={sortField}
                sortDirection={sortDirection}
              />
            </TableHead>
            <TableHead className="bg-primary text-primary-foreground rounded-tr-lg text-right">
              <div className="flex items-center justify-end gap-1">
                操作
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onToggleFilter}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {charms.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="text-muted-foreground text-center"
              >
                {!hasCharms ? "暂无护石" : "没有符合条件的护石"}
              </TableCell>
            </TableRow>
          ) : (
            charms.map((charm) => (
              <TableRow key={charm.id}>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      color:
                        charm.rarity === 12
                          ? "black"
                          : `var(--rarity-${charm.rarity})`,
                      borderColor:
                        charm.rarity === 12
                          ? "var(--border)"
                          : `var(--rarity-${charm.rarity})`,
                      background:
                        charm.rarity === 12
                          ? `var(--rarity-${charm.rarity})`
                          : "transparent",
                    }}
                  >
                    R{charm.rarity}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-medium">{charm.name}</span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="space-y-1 px-2 sm:space-y-2">
                    {charm.skills.map((skillWithLevel) => (
                      <SkillItem
                        key={skillWithLevel.skillId}
                        skillId={skillWithLevel.skillId}
                        level={skillWithLevel.level}
                        variant="full"
                      />
                    ))}
                    {/* Display slot info on smaller screens */}
                    {charm.slots.length > 0 && (
                      <div className="text-muted-foreground mt-1 text-xs md:hidden">
                        孔位:{" "}
                        {charm.slots.map((slot, index) => (
                          <span key={index}>
                            {slot.type === "weapon" ? "武" : "防"}
                            {slot.level}
                            {index < charm.slots.length - 1 && ", "}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden text-center md:table-cell">
                  <div className="flex justify-center gap-2">
                    {Array.from({ length: 3 }, (_, index) => {
                      const slot = charm.slots[index];
                      return slot ? (
                        <img
                          key={index}
                          src={getAccessoryIcon(slot.type, slot.level)}
                          alt={`${slot.type === "weapon" ? "WeaponSlot" : "ArmorSlot"} ${slot.level}级`}
                          style={{ width: "1.5rem", height: "1.5rem" }}
                        />
                      ) : (
                        <span
                          key={index}
                          className="text-muted-foreground text-sm"
                          style={{
                            width: "1.5rem",
                            height: "1.5rem",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          —
                        </span>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-primary text-sm font-medium sm:text-base">
                    {charm.keySkillValue}
                  </span>
                </TableCell>
                <TableCell className="hidden text-center lg:table-cell">
                  <div className="flex flex-col justify-center gap-2 text-sm md:flex-row md:gap-4">
                    <div className="flex items-center gap-1">
                      <img
                        src={getAssetPath("/weapon.png")}
                        alt="WeaponSlot"
                        style={{ width: "1.5rem", height: "1.5rem" }}
                      />
                      {charm.equivalentSlots.weaponSlot3}/
                      {charm.equivalentSlots.weaponSlot2}/
                      {charm.equivalentSlots.weaponSlot1}
                    </div>
                    <div className="flex items-center gap-1">
                      <img
                        src={getAssetPath("/armor.png")}
                        alt="ArmorSlot"
                        style={{ width: "1.5rem", height: "1.5rem" }}
                      />
                      {charm.equivalentSlots.armorSlot3}/
                      {charm.equivalentSlots.armorSlot2}/
                      {charm.equivalentSlots.armorSlot1}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden text-center text-xs lg:table-cell">
                  {new Date(charm.createdAt).toLocaleDateString("zh-CN")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1 sm:gap-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(charm)}
                        disabled={isOfficialCharmId(charm.id)}
                        className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                        title={
                          isOfficialCharmId(charm.id)
                            ? "官方护石不可编辑"
                            : undefined
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(charm.id)}
                      disabled={isOfficialCharmId(charm.id)}
                      className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                      title={
                        isOfficialCharmId(charm.id)
                          ? "官方护石不可删除"
                          : undefined
                      }
                    >
                      <Trash2
                        className={cn(
                          "h-4 w-4",
                          !isOfficialCharmId(charm.id) && "text-destructive",
                        )}
                      />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
