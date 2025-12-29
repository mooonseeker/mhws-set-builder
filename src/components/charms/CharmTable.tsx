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

import type { Charm, CharmSortField, SortDirection } from "@/types";
import type { EquipmentCellType } from "@/types/set-builder";

interface CharmTableProps {
  charms: Charm[];
  hasCharms: boolean;
  sortField: CharmSortField;
  sortDirection: SortDirection;
  mode: "display" | "selector";
  selectingFor?: EquipmentCellType;
  currentCharm?: Charm | null;
  onSortChange: (field: CharmSortField) => void;
  onToggleFilter: () => void;
  onEdit?: (charm: Charm) => void;
  onDelete: (id: string) => void;
  onSelect?: (charm: Charm) => void;
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

export function CharmTable({
  charms,
  hasCharms,
  sortField,
  sortDirection,
  mode,
  selectingFor,
  currentCharm,
  onSortChange,
  onToggleFilter,
  onEdit,
  onDelete,
  onSelect,
}: CharmTableProps) {
  // 获取装饰品等级图标
  const getAccessoryIcon = (slotType: "weapon" | "armor", level: number) => {
    return `/slot/${slotType}-slot-${level}.png`;
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
              技能
            </TableHead>
            <TableHead className="bg-primary text-primary-foreground hidden text-center md:table-cell">
              孔位
            </TableHead>
            {mode === "display" && (
              <>
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
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {charms.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-muted-foreground text-center"
              >
                {!hasCharms ? "暂无护石" : "没有符合条件的护石"}
              </TableCell>
            </TableRow>
          ) : (
            charms.map((charm) => {
              const isSelector = mode === "selector";
              const isSelected = !!currentCharm && currentCharm.id === charm.id;
              const isMatchingSlot = isSelector && selectingFor === "charm";

              return (
                <TableRow
                  key={charm.id}
                  className={cn(
                    isSelector && "transition-colors",
                    isSelected && "bg-accent/30",
                    isSelector &&
                      isMatchingSlot &&
                      "hover:bg-accent/50 cursor-pointer",
                    isSelector &&
                      !isMatchingSlot &&
                      "cursor-not-allowed opacity-50",
                  )}
                  onClick={
                    isSelector && onSelect && isMatchingSlot
                      ? () => onSelect(charm)
                      : undefined
                  }
                >
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
                    <div className="space-y-1 px-2 sm:space-y-2">
                      {charm.skills.map((skillWithLevel) => (
                        <SkillItem
                          key={skillWithLevel.skillId}
                          skillId={skillWithLevel.skillId}
                          level={skillWithLevel.level}
                          variant="full"
                        />
                      ))}
                      {/* 小屏幕显示孔位信息 */}
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
                  {mode === "display" && (
                    <>
                      <TableCell className="text-center">
                        <span className="text-primary text-sm font-medium sm:text-base">
                          {charm.keySkillValue}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-center lg:table-cell">
                        <div className="flex flex-col justify-center gap-2 text-sm md:flex-row md:gap-4">
                          <div className="flex items-center gap-1">
                            <img
                              src="/weapon.png"
                              alt="WeaponSlot"
                              style={{ width: "1.5rem", height: "1.5rem" }}
                            />
                            {charm.equivalentSlots.weaponSlot3}/
                            {charm.equivalentSlots.weaponSlot2}/
                            {charm.equivalentSlots.weaponSlot1}
                          </div>
                          <div className="flex items-center gap-1">
                            <img
                              src="/armor.png"
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
                              className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(charm.id)}
                            className="h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                          >
                            <Trash2 className="text-destructive h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
