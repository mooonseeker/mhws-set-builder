import { Settings2, Trash2, Zap } from "lucide-react";
import { useState } from "react";

import { CharmShowcase } from "@/components/charms";
import { DataIO } from "@/components/settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataStorage } from "@/services/storage";
import {
  DEFAULT_ACCESSORIES_PER_PAGE,
  DEFAULT_ARMOR_SERIES_PER_PAGE,
  DEFAULT_CHARMS_PER_PAGE,
  DEFAULT_SKILLS_PER_PAGE,
} from "@/constants";
import { toggleLimitBreakGlobal } from "@/utils/limit-break";

import type { AppSettings, Charm, Skill } from "@/types";

/**
 * 设置组件
 * 提供导入、导出和重置功能
 */
export function Settings() {
  const skills = DataStorage.loadData<Skill>("skills");
  const charms = DataStorage.loadData<Charm>("charms");

  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedSettings = DataStorage.loadData<AppSettings>("settings")[0];
    const defaultSettings = {
      id: "app-settings",
      enableLimitBreak: false,
      skillsPerPage: DEFAULT_SKILLS_PER_PAGE,
      armorSeriesPerPage: DEFAULT_ARMOR_SERIES_PER_PAGE,
      charmsPerPage: DEFAULT_CHARMS_PER_PAGE,
      accessoriesPerPage: DEFAULT_ACCESSORIES_PER_PAGE,
    };
    // 合并保存的设置，覆盖默认值，以处理旧版本用户数据
    return { ...defaultSettings, ...savedSettings };
  });

  // 处理极限突破切换
  const handleLimitBreakToggle = async (checked: boolean) => {
    try {
      await toggleLimitBreakGlobal(checked);
      setSettings((prev) => ({ ...prev, enableLimitBreak: checked }));
      alert(`极限突破已${checked ? "开启" : "关闭"}，页面将刷新以应用更改。`);
      window.location.reload();
    } catch (error) {
      console.error("Failed to toggle limit break:", error);
      alert("操作失败，请重试。");
    }
  };

  // 处理通用设置保存
  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    DataStorage.saveData("settings", [newSettings]).catch(console.error);
  };

  // 重置数据
  const handleReset = () => {
    if (
      confirm(
        "确定要重置所有数据吗？\n\n这将清除所有技能和护石数据，并恢复到初始状态。\n\n此操作不可撤销！",
      )
    ) {
      DataStorage.clearAll();
      alert("数据已重置，页面将刷新。");
      window.location.reload();
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      {/* 固定标题区域 */}
      <div className="flex shrink-0 items-baseline">
        <h1 className="font-bold tracking-tight">设置</h1>
        <p className="text-foreground ml-2">管理系统设置和数据</p>
      </div>

      {/* 可滚动内容区域 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid gap-6 md:grid-cols-5">
          {/* 第一行：设置卡片 (合并游戏机制和显示设置) */}
          <Card className="md:col-span-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                系统设置
              </CardTitle>
              <CardDescription>调整游戏机制和界面展示参数</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* 游戏机制部分 */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    游戏机制
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="limit-break"
                      checked={settings.enableLimitBreak}
                      onCheckedChange={(checked) => {
                        void handleLimitBreakToggle(!!checked);
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="limit-break"
                        className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        启用防具极限突破 (Limit Break)
                      </Label>
                      <p className="text-muted-foreground text-xs">
                        开启后，所有 R5/R6
                        防具将获得额外的孔位强化。关闭后将恢复至原始数据。
                      </p>
                    </div>
                  </div>
                </div>

                {/* 显示设置部分 */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">显示设置</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="skillsPerPage" className="text-xs">
                        技能每页
                      </Label>
                      <Input
                        id="skillsPerPage"
                        type="number"
                        className="h-8"
                        value={settings.skillsPerPage}
                        onChange={(e) =>
                          updateSetting(
                            "skillsPerPage",
                            parseInt(e.target.value) || 16,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="armorSeriesPerPage" className="text-xs">
                        防具每页
                      </Label>
                      <Input
                        id="armorSeriesPerPage"
                        type="number"
                        className="h-8"
                        value={settings.armorSeriesPerPage}
                        onChange={(e) =>
                          updateSetting(
                            "armorSeriesPerPage",
                            parseInt(e.target.value) || 32,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="charmsPerPage" className="text-xs">
                        护石每页
                      </Label>
                      <Input
                        id="charmsPerPage"
                        type="number"
                        className="h-8"
                        value={settings.charmsPerPage}
                        onChange={(e) =>
                          updateSetting(
                            "charmsPerPage",
                            parseInt(e.target.value) || 16,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accessoriesPerPage" className="text-xs">
                        装饰品每页
                      </Label>
                      <Input
                        id="accessoriesPerPage"
                        type="number"
                        className="h-8"
                        value={settings.accessoriesPerPage}
                        onChange={(e) =>
                          updateSetting(
                            "accessoriesPerPage",
                            parseInt(e.target.value) || 16,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 第二行：数据统计 (4/5) */}
          <Card className="md:col-span-4">
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
                  <p className="text-2xl font-bold">
                    {skills.filter((s) => s.isKey).length}
                  </p>
                </div>
                <div>
                  <p className="text-foreground text-sm">护石总数</p>
                  <p className="text-2xl font-bold">{charms.length}</p>
                </div>
                <div>
                  <p className="text-foreground text-sm">平均核心技能价值</p>
                  <p className="text-2xl font-bold">
                    {charms.length > 0
                      ? (
                          charms.reduce((sum, c) => sum + c.keySkillValue, 0) /
                          charms.length
                        ).toFixed(1)
                      : "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 第二行：重置数据 (1/5) */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                重置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={handleReset}
                variant="destructive"
                className="w-full"
              >
                重置数据
              </Button>
              <p className="text-muted-foreground text-[10px] leading-tight">
                ⚠️ 此操作不可撤销！
              </p>
            </CardContent>
          </Card>

          {/* 数据库管理 */}
          <DataIO />

          {/* 护石展示 */}
          <CharmShowcase />
        </div>
      </div>
    </div>
  );
}
