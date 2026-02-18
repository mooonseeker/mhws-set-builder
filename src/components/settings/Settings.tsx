/**
 * @fileoverview Provides the Settings component for application configuration
 * and data management.
 */

import { Search, Settings2, Trash2, Zap } from "lucide-react";

import { CharmShowcase } from "@/components/charms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DEFAULT_ACCESSORIES_PER_PAGE,
  DEFAULT_ARMOR_SERIES_PER_PAGE,
  DEFAULT_CHARMS_PER_PAGE,
  DEFAULT_SEARCH_RESULT_LIMIT,
  DEFAULT_SKILLS_PER_PAGE,
  WEAPON_TYPE_LABELS,
} from "@/constants";
import { useCharms, useSettings, useSkills } from "@/hooks";
import { WEAPON_TYPES, type AppSettings, type WeaponType } from "@/types";
import { getAssetPath } from "@/utils";

import { DataIO } from "./DataIO";
import { SettingGroup, SettingItem } from "./SettingItem";

/**
 * Settings component for application configuration.
 * Provides game mechanics adjustment, display settings, and data management.
 */
export function Settings() {
  const { skills, keySkillIds } = useSkills();
  const { enhancedCharms } = useCharms();
  const {
    settings,
    updateSetting,
    handleReset,
    handleLimitBreakToggle,
    dialogs,
  } = useSettings();

  // Configuration for pagination settings
  const PAGINATION_CONFIG: {
    key: keyof AppSettings;
    label: string;
    description: string;
    defaultValue: number;
  }[] = [
    {
      key: "skillsPerPage",
      label: "技能每页数量",
      description: "技能列表每页展示的卡片数量",
      defaultValue: DEFAULT_SKILLS_PER_PAGE,
    },
    {
      key: "armorSeriesPerPage",
      label: "防具每页数量",
      description: "防具系列每页展示的数量",
      defaultValue: DEFAULT_ARMOR_SERIES_PER_PAGE,
    },
    {
      key: "charmsPerPage",
      label: "护石每页数量",
      description: "护石列表每页展示的卡片数量",
      defaultValue: DEFAULT_CHARMS_PER_PAGE,
    },
    {
      key: "accessoriesPerPage",
      label: "装饰品每页数量",
      description: "装饰品列表每页展示的卡片数量",
      defaultValue: DEFAULT_ACCESSORIES_PER_PAGE,
    },
  ];

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Sticky header area */}
      <div className="flex h-11 shrink-0 items-center justify-between">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl font-bold tracking-tight">设置</h1>
          <p className="text-muted-foreground hidden sm:block">
            管理系统设置和数据
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            variant="destructive"
            onClick={() => dialogs.reset.setOpen(true)}
          >
            <Trash2 className="mr-2 h-5 w-5" />
            重置数据
          </Button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={dialogs.reset.isOpen} onOpenChange={dialogs.reset.setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确定要重置所有数据吗？</DialogTitle>
            <DialogDescription className="space-y-2 pt-2">
              <p>这将清除所有技能和护石数据，并恢复到初始状态。</p>
              <p className="text-destructive font-medium">此操作不可撤销！</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleReset}>
              确定重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Limit Break Confirmation Dialog */}
      <Dialog
        open={dialogs.limitBreak.isOpen}
        onOpenChange={dialogs.limitBreak.setOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              确定要{dialogs.limitBreak.pendingValue ? "开启" : "关闭"}
              极限突破吗？
            </DialogTitle>
            <DialogDescription className="pt-2">
              {dialogs.limitBreak.pendingValue ? (
                <p>开启后，所有 R5/R6 防具将获得额外的孔位强化。</p>
              ) : (
                <p>关闭后，所有防具将恢复至原始孔位数据。</p>
              )}
              <p className="mt-2 text-amber-600 dark:text-amber-400">
                应用更改后页面将自动刷新。
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button
              onClick={() => {
                void handleLimitBreakToggle(dialogs.limitBreak.pendingValue);
                dialogs.limitBreak.setOpen(false);
              }}
            >
              确定更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scrollable content area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid gap-6 md:grid-cols-5">
          {/* Row 1: Settings Sections (5/5) */}
          <div className="grid grid-cols-1 gap-6 md:col-span-5 md:grid-cols-2">
            <SettingGroup
              title="游戏机制"
              icon={<Zap className="h-4 w-4 text-yellow-500" />}
            >
              <SettingItem
                label="启用防具极限突破"
                description="开启后，所有 R5/R6 防具将获得额外的孔位强化。关闭后将恢复至原始数据。"
              >
                <Checkbox
                  id="limit-break"
                  checked={settings.enableLimitBreak}
                  onCheckedChange={(checked) => {
                    dialogs.limitBreak.setPendingValue(!!checked);
                    dialogs.limitBreak.setOpen(true);
                  }}
                />
              </SettingItem>

              <SettingItem
                label="配装搜索方案上限"
                description="设置配装搜索时返回的最大方案数量。数值越大搜索可能越慢。"
              >
                <div className="flex items-center gap-2">
                  <Search className="text-muted-foreground h-4 w-4" />
                  <Input
                    type="number"
                    className="h-8 w-20 text-right"
                    value={settings.searchResultLimit}
                    onChange={(e) =>
                      updateSetting(
                        "searchResultLimit",
                        parseInt(e.target.value) || DEFAULT_SEARCH_RESULT_LIMIT,
                      )
                    }
                  />
                </div>
              </SettingItem>

              <SettingItem
                label="默认武器类型"
                description="设置配装器默认选择的武器类型。"
              >
                <TooltipProvider>
                  <ToggleGroup
                    type="single"
                    value={settings.defaultWeaponType}
                    onValueChange={(value) =>
                      value &&
                      updateSetting("defaultWeaponType", value as WeaponType)
                    }
                    className="flex-wrap justify-end"
                  >
                    {WEAPON_TYPES.map((type) => (
                      <ToggleGroupItem
                        key={type}
                        value={type}
                        tooltip={WEAPON_TYPE_LABELS[type]}
                        className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <img
                          src={getAssetPath(`/weapon-type/${type}.png`)}
                          alt={type}
                          className="h-5 w-5"
                        />
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </TooltipProvider>
              </SettingItem>
            </SettingGroup>

            <SettingGroup
              title="显示设置"
              icon={<Settings2 className="h-4 w-4" />}
            >
              <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                {PAGINATION_CONFIG.map((config) => (
                  <SettingItem
                    key={config.key}
                    label={config.label}
                    description={config.description}
                  >
                    <Input
                      type="number"
                      className="h-8 w-20 text-right"
                      value={settings[config.key] as number}
                      onChange={(e) =>
                        updateSetting(
                          config.key,
                          parseInt(e.target.value) || config.defaultValue,
                        )
                      }
                    />
                  </SettingItem>
                ))}
              </div>
            </SettingGroup>
          </div>

          {/* Row 2: Statistics (5/5) */}
          <Card className="md:col-span-5">
            <CardHeader>
              <CardTitle>数据统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <p className="text-foreground text-sm">技能总数</p>
                  <p className="text-2xl font-bold">{skills.length}</p>
                </div>
                <div>
                  <p className="text-foreground text-sm">核心技能</p>
                  <p className="text-2xl font-bold">{keySkillIds.length}</p>
                </div>
                <div>
                  <p className="text-foreground text-sm">护石总数</p>
                  <p className="text-2xl font-bold">{enhancedCharms.length}</p>
                </div>
                <div>
                  <p className="text-foreground text-sm">平均核心技能价值</p>
                  <p className="text-2xl font-bold">
                    {enhancedCharms.length > 0
                      ? (
                          enhancedCharms.reduce(
                            (sum, c) => sum + c.keySkillValue,
                            0,
                          ) / enhancedCharms.length
                        ).toFixed(1)
                      : "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database management */}
          <DataIO />

          {/* Charm showcase */}
          <CharmShowcase />
        </div>
      </div>
    </div>
  );
}
